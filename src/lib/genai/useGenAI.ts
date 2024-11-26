"use server";

import { marked } from 'marked';
import puppeteer, { PDFOptions } from 'puppeteer';
// import fs from 'fs/promises';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Job } from '@prisma/client';
import OpenAI from "openai";
import { resumePrompt } from './gpt-4o';
import { z } from 'zod';
import { zodResponseFormat } from "openai/helpers/zod";
import { UTApi } from 'uploadthing/server';
import { FileEsque } from 'uploadthing/types';
import { Logger } from '../logger';
import Pdf from '../pdf-helper';
import { srv_getCompleteUserProfile } from '../useUser';
import { prisma } from '../prisma';

import { srv_func_verifyTiers } from '@/app/actions/server/job-board/primary';
import { srv_addServiceUsage, srv_decrementServiceUsage } from '@/lib/tierlimits';
import chromium from '@sparticuz/chromium-min';
import puppeteerCore from 'puppeteer-core';

const utapi = new UTApi();

const openai = new OpenAI();

interface ConvertOptions {
    title?: string;
    cssPath?: string;
    outputPath?: string;
}

const ResumeSchema = z.object({
    reasoning: z.string(),
    markdown: z.string(),
    error_response: z.string().optional()
});

const defaultTemplate = {
    preamble: `
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>{{title}}</title>
      <style>
        {{css}}
      </style>
    </head>
    <body>
      <div id="resume">
  `,
    postamble: `
      </div>
    </body>
    </html>
  `
};

export async function markdownToPDF(
    markdown: string,
    options: ConvertOptions = {}
): Promise<Buffer> {
    console.log('Starting markdownToPDF conversion', { options });
    
    // Extract title from first h1 heading or use default
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = options.title || (titleMatch ? titleMatch[1] : 'Resume');
    console.log('Extracted title:', title);

    // Load CSS if provided
    let css = '';
    if (options.cssPath) {
        console.log('Attempting to load CSS from:', options.cssPath);
        try {
            css = await fetch(options.cssPath).then(res => res.text());
            console.log('CSS loaded successfully');
        } catch (error) {
            console.warn('CSS file not found. Output will be unstyled.', error);
            await Logger.warning('CSS loading failed', {
                cssPath: options.cssPath,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Convert markdown to HTML
    console.log('Converting markdown to HTML');
    const htmlContent = marked(markdown);
    console.log('Markdown conversion complete');

    // Construct full HTML
    const html = defaultTemplate.preamble
        .replace('{{title}}', title)
        .replace('{{css}}', css)
        + htmlContent
        + defaultTemplate.postamble;
    console.log('HTML template constructed');

    const isLocal = !!process.env.CHROME_EXECUTABLE_PATH;
    console.log('Environment:', isLocal ? 'Local' : 'Production');

    console.log('Launching browser');
    const browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
    });
    console.log('Browser launched successfully');

    try {
        console.log('Creating new page');
        const page = await browser.newPage();
        console.log('Setting page content');
        await page.setContent(html, { 
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        console.log('Page content set successfully');

        const pdfOptions: PDFOptions = {
            format: 'a4',
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            },
            printBackground: true
        };
        console.log('Generating PDF with options:', pdfOptions);

        const pdfBuffer = await page.pdf(pdfOptions);
        console.log('PDF generated successfully');

        // Upload the PDF to UploadThing
        console.log('Preparing to upload PDF to UploadThing');
        const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
        const file: FileEsque = Object.assign(blob, {
            name: options.outputPath || `${title}.pdf`,
        });
        console.log('Uploading PDF to UploadThing');
        const uploadResponse = await utapi.uploadFiles([file]);
        console.log('PDF uploaded successfully', uploadResponse);

        return Buffer.from(pdfBuffer);
    } catch (error) {
        console.error('PDF Generation failed:', error);
        await Logger.error('PDF Generation failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            options,
            isLocal
        });
        throw error;
    } finally {
        console.log('Closing browser');
        await browser.close();
        console.log('Browser closed successfully');
    }
}

export async function srv_generateGPTResume(job: Job) {
    console.log('Starting resume generation process', {
        jobId: job.id,
        company: job.company,
        position: job.position
    });
    
    Logger.info('Starting resume generation', {
        jobId: job.id,
        company: job.company,
        userId: job.userId
    });

    // Check quota before proceeding
    console.log('Checking user quota');
    const quotaCheck = await srv_func_verifyTiers(job.userId || '', 'GENAI_RESUME');
    console.log('Quota check result:', quotaCheck);
    
    if (!quotaCheck.allowed) {
        console.warn('Resume generation quota exceeded', {
            userId: job.userId,
            used: quotaCheck.used,
            limit: quotaCheck.limit
        });
        await Logger.warning('Resume generation quota exceeded', {
            userId: job.userId,
            quotaCheck
        });
        return {
            success: false,
            error: `Quota exceeded. Used: ${quotaCheck.used}/${quotaCheck.limit}`
        };
    }

    console.log('Extracting PDF text from resume');
    const resumeText = await Pdf.getPDFText(job.resumeUrl || '');
    console.log('PDF text extracted successfully');

    console.log('Fetching user profile');
    const user = await srv_getCompleteUserProfile(job.userId || '');
    console.log('User profile fetched successfully');

    try {
        console.log('Initiating OpenAI API call');
        // Generate resume using OpenAI
        const completion = await openai.beta.chat.completions.parse({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: resumePrompt
                },
                {
                    role: "user",
                    content: `Here is the user's information: \nUser Details: ${user?.about}\nJob Details: ${job.jobDescription} \nResume: ${resumeText}. The 
                    above information is about ${user?.firstName + ' ' + user?.lastName} applying to ${job.company} for the position of ${job.position}.`
                },
            ],
            response_format: zodResponseFormat(ResumeSchema, "resume"),
        });
        console.log('OpenAI API call completed successfully');

        Logger.info('Resume generated successfully', {
            jobId: job.id,
            company: job.company,
            userId: job.userId,
            response: completion.choices?.[0]?.message?.parsed?.markdown,
            reasoning: completion.choices?.[0]?.message?.parsed?.reasoning
        });

        const generatedResume = completion.choices?.[0]?.message?.parsed?.markdown ?? null;

        if (generatedResume) {
            console.log('Counting existing resumes');
            const existingResumesCount = await prisma.generatedResume.count({
                where: {
                    userId: job.userId,
                    jobId: job.id
                }
            });
            console.log('Existing resumes count:', existingResumesCount);

            console.log('Creating new resume record');
            const createdResume = await prisma.generatedResume.create({
                data: {
                    userId: job.userId,
                    jobId: job.id,
                    resumeMarkdown: generatedResume,
                    resumeVersion: existingResumesCount + 1,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            console.log('Resume record created successfully', { resumeId: createdResume.id });

            // Add service usage after successful generation
            console.log('Updating service usage quota');
            if (!await srv_addServiceUsage(job.userId || '', "GENAI_RESUME", 1)) {
                console.warn('Failed to increment resume generation quota');
                await Logger.warning('Failed to increment resume generation quota', {
                    userId: job.userId,
                });
                // We still return success since the resume was generated
            }

            return { success: true, resumeId: createdResume.id };
        } else {
            console.error('No resume generated');
            console.log(completion.choices?.[0]?.message?.parsed);
            console.log('OpenAI API completion response:', JSON.stringify(completion, null, 2));
            await Logger.error('No resume generated', {
                jobId: job.id,
                userId: job.userId
            });
            
            // Decrement the quota since the generation failed
            await srv_decrementServiceUsage(job.userId, 'GENAI_RESUME');
            
            return { success: false, error: completion.choices?.[0]?.message?.parsed?.error_response || 'No resume generated' };
        }
    } catch (error) {
        console.error('Error during resume generation:', error);
        await Logger.error('Resume generation failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            jobId: job.id,
            userId: job.userId
        });
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
