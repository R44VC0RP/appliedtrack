"use server";

import { marked } from 'marked';
import chromium from '@sparticuz/chromium-min';
import puppeteer, { PDFOptions } from 'puppeteer-core';
// import fs from 'fs/promises';

import { Job } from '@prisma/client';
import OpenAI from "openai";
import { resumePrompt, coverLetterPrompt } from './gpt-4o';
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
import puppeteerCore from 'puppeteer-core';

const utapi = new UTApi();

const openai = new OpenAI();

type DocType = 'resume' | 'coverLetter';

type ResumeDoc = {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    jobId: string;
    resumeMarkdown: string;
    resumeVersion: number;
    resumePdfUrl: string | null;
};

type CoverLetterDoc = {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    jobId: string;
    coverLetterMarkdown: string;
    coverLetterVersion: number;
    coverLetterPdfUrl: string | null;
};

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

const CoverLetterSchema = z.object({
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

async function getBrowser() {
    if (process.env.NODE_ENV === "production") {
        return puppeteerCore.launch({
            args: [
                ...chromium.args,
                '--hide-scrollbars',
                '--disable-web-security'
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(
                `https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar`
            ),
            headless: chromium.headless,
        });
    } else {
        // Development environment - more detailed configuration
        return puppeteer.launch({
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage", // Useful for Docker containers
                "--disable-gpu",           // Disable GPU hardware acceleration
            ],
            executablePath: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
            headless: true,              // Use new headless mode
            defaultViewport: {
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
            },
            timeout: 30000,               // 30 second timeout
        });
    }
}

async function srv_convertMarkdownToPDFUrl(
    markdown: string,
    title: string,
    options: ConvertOptions = {}
): Promise<string> {
    console.log('Starting markdown to PDF conversion', { title });

    // Load CSS if provided
    let css = `
    body {
        color: #000000;
        background: #EEEEEE;
        font: 1.1em "Times New Roman";
        line-height: 1.2;
        margin: 40px 0;
    }
    #resume {
        margin: 0 auto;
        max-width: 800px;
        padding: 40px 60px;
        background: #FFFFFF;
        border: 1px solid #CCCCCC;
        box-shadow: 2px 2px 4px #AAAAAA;
        -webkit-box-shadow: 2px 2px 4px #AAAAAA;
    }
    h1 {
        text-transform: uppercase;
        text-align: center;
        font-size: 200%;
        margin: 0;
        padding: 0;
    }
    h2 {
        border-bottom: 1px solid #000000;
        text-transform: uppercase;
        font-size: 130%;
        margin: 1em 0 0 0;
        padding: 0;
    }
    h3 {
        font-size: 100%;
        margin: 0.8em 0 0.3em 0;
        padding: 0;
        display: flex;
        justify-content: space-between;
    }
    p {
        margin: 0 0 0.5em 0;
        padding: 0;
    }
    ul {
        padding: 0;
        margin: 0 1.5em;
    }
    h1 + ul {
        text-align: center;
        margin: 0;
        padding: 0;
    }
    h1 + ul > li {
        display: inline;
        white-space: pre;
        list-style-type: none;
    }
    h1 + ul > li:after {
        content: "  \u2022  ";
    }
    h1 + ul > li:last-child:after {
        content: "";
    }
    h1 + ul + p {
        margin: 1em 0;
    }
    @media print {
        body {
            font-size: 10pt;
            margin: 0;
            padding: 0;
            background: none;
        }
        #resume {
            margin: 0;
            padding: 0;
            border: 0px;
            background: none;
            box-shadow: none;
            -webkit-box-shadow: none;
        }
        abbr {
            text-decoration: none;
            font-variant: none;
        }
        a, a:link, a:visited, a:hover {
            color: #000000;
            text-decoration: underline;
        }
    }
    @page {
        size: letter;
        margin: 0.5in 0.8in;
    }
    @media screen and (max-width: 800px) {
        body {
            font-size: 16pt;
            margin: 0;
            padding: 0;
            background: #FFFFFF !important;
        }
        #resume {
            margin: 0;
            padding: 1em;
            border: 0px;
            background: none;
            box-shadow: none;
            -webkit-box-shadow: none;
        }
    }`;

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

    console.log('Launching browser');
    const browser = await getBrowser();
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

        return uploadResponse[0]?.data?.url || '';
    } catch (error) {
        console.error('PDF Generation failed:', error);
        await Logger.error('PDF Generation failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            options,
        });
        throw error;
    } finally {
        console.log('Closing browser');
        await browser.close();
        console.log('Browser closed successfully');
    }
}

export async function srv_markdownResumeToPDF(resumeId: string, options: ConvertOptions = {}): Promise<string> {
    console.log('Starting resume PDF conversion', { resumeId });

    const resume = await prisma.generatedResume.findUnique({
        where: { id: resumeId }
    });

    if (!resume) {
        console.error('Resume not found', { resumeId });
        throw new Error('Resume not found');
    }

    if (resume.resumePdfUrl) {
        return resume.resumePdfUrl;
    }

    const title = options.title || (resume.resumeMarkdown ? resume.resumeMarkdown.match(/^#\s+(.+)$/m)?.[1] : 'Resume');
    const pdfUrl = await srv_convertMarkdownToPDFUrl(resume.resumeMarkdown, title || 'Resume', options);

    if (pdfUrl) {
        await prisma.generatedResume.update({
            where: { id: resumeId },
            data: {
                resumePdfUrl: pdfUrl,
                updatedAt: new Date()
            }
        });
    }

    return pdfUrl;
}

export async function srv_markdownCoverLetterToPDF(coverLetterId: string, options: ConvertOptions = {}): Promise<string> {
    console.log('Starting cover letter PDF conversion', { coverLetterId });

    const coverLetter = await prisma.generatedCoverLetter.findUnique({
        where: { id: coverLetterId }
    });

    if (!coverLetter) {
        console.error('Cover letter not found', { coverLetterId });
        throw new Error('Cover letter not found');
    }

    if (coverLetter.coverLetterPdfUrl) {
        return coverLetter.coverLetterPdfUrl;
    }

    const title = options.title || (coverLetter.coverLetterMarkdown ? coverLetter.coverLetterMarkdown.match(/^#\s+(.+)$/m)?.[1] : 'Cover Letter');
    const pdfUrl = await srv_convertMarkdownToPDFUrl(coverLetter.coverLetterMarkdown, title || 'Cover Letter', options);

    if (pdfUrl) {
        await prisma.generatedCoverLetter.update({
            where: { id: coverLetterId },
            data: {
                coverLetterPdfUrl: pdfUrl,
                updatedAt: new Date()
            }
        });
    }

    return pdfUrl;
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

    const prompt = `Here is the user's information: \nUser Details: ${user?.about}\nJob Details: ${job.jobDescription} \nResume: ${resumeText}. The 
                    above information is about ${user?.firstName + ' ' + user?.lastName} applying to ${job.company} for the position of ${job.position}.`


    console.log('Prompt:', prompt.length);

    try {
        console.log('Initiating OpenAI API call');
        // Generate resume using OpenAI
        const completion = await openai.beta.chat.completions.parse({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: resumePrompt
                },
                {
                    role: "user",
                    content: prompt
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

export async function srv_generateGPTCoverLetter(job: Job) {
    console.log('Starting cover letter generation process', {
        jobId: job.id,
        company: job.company,
        position: job.position
    });

    Logger.info('Starting cover letter generation', {
        jobId: job.id,
        company: job.company,
        userId: job.userId
    });

    // Check quota before proceeding
    console.log('Checking user quota');
    const quotaCheck = await srv_func_verifyTiers(job.userId || '', 'GENAI_COVERLETTER');
    console.log('Quota check result:', quotaCheck);

    if (!quotaCheck.allowed) {
        console.warn('Cover letter generation quota exceeded', {
            userId: job.userId,
            used: quotaCheck.used,
            limit: quotaCheck.limit
        });
        await Logger.warning('Cover letter generation quota exceeded', {
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

    const prompt = `Here is the user's information: \nUser Details: ${user?.about}\nJob Details: ${job.jobDescription} \nResume: ${resumeText}. The 
                    above information is about ${user?.firstName + ' ' + user?.lastName} applying to ${job.company} for the position of ${job.position}. Generate a cover letter that highlights their relevant experience and skills for this specific role.`

    console.log('Prompt:', prompt.length);

    try {
        console.log('Initiating OpenAI API call');
        // Generate cover letter using OpenAI
        const completion = await openai.beta.chat.completions.parse({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: coverLetterPrompt
                },
                {
                    role: "user",
                    content: prompt
                },
            ],
            response_format: zodResponseFormat(CoverLetterSchema, "cover_letter"),
        });
        console.log('OpenAI API call completed successfully');

        Logger.info('Cover letter generated successfully', {
            jobId: job.id,
            company: job.company,
            userId: job.userId,
            response: completion.choices?.[0]?.message?.parsed?.markdown,
            reasoning: completion.choices?.[0]?.message?.parsed?.reasoning
        });

        const generatedCoverLetter = completion.choices?.[0]?.message?.parsed?.markdown ?? null;

        if (generatedCoverLetter) {
            console.log('Counting existing cover letters');
            const existingCoverLettersCount = await prisma.generatedCoverLetter.count({
                where: {
                    userId: job.userId,
                    jobId: job.id
                }
            });
            console.log('Existing cover letters count:', existingCoverLettersCount);

            console.log('Creating new cover letter record');
            const createdCoverLetter = await prisma.generatedCoverLetter.create({
                data: {
                    userId: job.userId,
                    jobId: job.id,
                    coverLetterMarkdown: generatedCoverLetter,
                    coverLetterVersion: existingCoverLettersCount + 1,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            console.log('Cover letter record created successfully', { coverLetterId: createdCoverLetter.id });

            return { success: true, coverLetterId: createdCoverLetter.id };
        } else {
            console.error('No cover letter generated');
            console.log(completion.choices?.[0]?.message?.parsed);
            console.log('OpenAI API completion response:', JSON.stringify(completion, null, 2));
            await Logger.error('No cover letter generated', {
                jobId: job.id,
                userId: job.userId
            });

            // Decrement the quota since the generation failed
            await srv_decrementServiceUsage(job.userId, 'GENAI_COVER_LETTER');

            return { success: false, error: completion.choices?.[0]?.message?.parsed?.error_response || 'No cover letter generated' };
        }
    } catch (error) {
        console.error('Error during cover letter generation:', error);
        await Logger.error('Cover letter generation failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            jobId: job.id,
            userId: job.userId
        });
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
