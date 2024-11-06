import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { getJob } from '@/lib/db/jobs';
import { getUser } from '@/lib/db/users';
import Pdf from '@/lib/pdf-helper';
import { UTApi } from 'uploadthing/server';
import { jsPDF } from 'jspdf';
import { File } from '@web-std/file';
import { JobModel, Job } from '@/models/Job';
import { Logger } from '@/lib/logger';
import '@/components/fonts/EBGaramond-Medium-normal'

/**
 * Creates a PDF buffer from a cover letter body text
 * @param coverLetterBody - The text content of the cover letter
 * @returns Promise<Buffer> - PDF document as a buffer
 */
async function createCoverLetterPDF(coverLetterBody: string): Promise<Buffer> {
    try {
        const doc = new jsPDF();
        
        // Configure PDF settings
        doc.setFontSize(14);
        doc.setFont('EB Garamond');
        
        // Split text into lines to handle word wrapping
        const splitText = doc.splitTextToSize(coverLetterBody, 180); // 180 is the max width
        doc.text(splitText, 15, 15); // Start at x:15, y:15
        
        // Convert to Buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        await Logger.info('Cover letter PDF created successfully', {
            contentLength: coverLetterBody.length,
            bufferSize: pdfBuffer.length
        });
        return pdfBuffer;
    } catch (error) {
        await Logger.error('Failed to create cover letter PDF', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

/**
 * Generates a cover letter for a job application using AI and creates a PDF
 * @param job - The job application data
 * @returns Promise containing the generated cover letter data and PDF URL
 */
async function createCoverLetter(job: Job) {
    try {
        await Logger.info('Starting cover letter generation', {
            jobId: job.id,
            company: job.company,
            userId: job.userId
        });

        const utapi = new UTApi();

        const user = await getUser(job.userId);
        const jobData = await getJob(job.id);

        if (!user || !jobData) {
            await Logger.warning('User or job not found during cover letter generation', {
                userId: job.userId,
                jobId: job.id
            });
            return { success: false, error: 'User or job not found' };
        }

        // Extract text from resume PDF
        const resumeText = await Pdf.getPDFText(job.resumeLink);
        await Logger.info('Resume text extracted successfully', {
            jobId: job.id,
            resumeLength: resumeText.length
        });

        const prompt_to_create_cover_letter = `
            You are a master cover letter generator. You are given a resume and a job description. You need to generate a cover letter for the job.

            Cover Letter Instructions:

            Strong Opening: Start with an engaging, personalized introduction that reflects your career objectives and enthusiasm for the role.

            Use Job Keywords: Include specific keywords from the job description to show you’re a match and to help with Applicant Tracking Software (ATS) systems.

            Tailor to the Company: Reference the company’s values or mission to show you’ve done your research and align with their culture.

            Show Real-world Examples: Use concrete achievements to demonstrate your skills, which makes your claims more credible.

            Purposeful Conclusion: End with a brief summary of why you're a good fit and express interest in discussing further.

            Concise Formatting: Aim for 300-400 words. Use clear paragraphs, an easy-to-read font, and close formally (e.g., "Yours sincerely").

            You are going to write a cover letter for ${job.company} as ${user.name}.

            Here is ${user.name}'s resume: ${resumeText}

            And here is ${user.name}'s personal statement: ${user.about}

            Generate a professional cover letter for ${job.company} that is tailored to the job description and the user's resume and personal statement. 

            Please address it to the hiring manager of ${job.company}.

            Please include the greeting and closing of the letter in the body param.
        `

        await Logger.info('Cover letter generation prompt', {
            jobId: job.id,
            promptLength: prompt_to_create_cover_letter.length
        });

        // Generate cover letter using GPT
        const { object } = await generateObject({
            model: openai('gpt-4-turbo'),
            schema: z.object({
                cover_letter: z.object({
                    name_of_company: z.string(),
                    name_of_applicant: z.string(),
                    body: z.string(),
                }),
            }),
            prompt: prompt_to_create_cover_letter,
        });

        await Logger.info('Cover letter generated successfully', {
            jobId: job.id,
            company: object.cover_letter.name_of_company
        });

        // Generate PDF
        const pdfBuffer = await createCoverLetterPDF(object.cover_letter.body);

        // Convert Buffer to File using @web-std/file
        const pdfFile = new File(
            [new Uint8Array(pdfBuffer as Buffer)],
            `cover-letter-${job.id}.pdf`,
            { type: 'application/pdf' }
        );

        // Upload to UploadThing
        const uploadResponse = await utapi.uploadFiles([pdfFile]);

        if (!uploadResponse[0].data) {
            await Logger.error('Failed to upload cover letter to storage', {
                jobId: job.id,
                fileName: pdfFile.name
            });
            throw new Error('Failed to upload cover letter');
        }

        await Logger.info('Cover letter uploaded successfully', {
            jobId: job.id,
            fileUrl: uploadResponse[0].data.url
        });

        return {
            success: true,
            coverLetterData: object.cover_letter,
            pdfUrl: uploadResponse[0].data?.url
        };
    } catch (error) {
        await Logger.error('Error in createCoverLetter', {
            jobId: job.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

/**
 * API route handler for cover letter generation
 * @param req - The incoming request object
 * @returns Response with the generated cover letter data or error
 */
export async function POST(req: Request) {
    try {
        

        const { job } = await req.json();
        await Logger.info('Cover letter generation request received', {
            jobId: job.id,
            company: job.company
        });
        const result = await createCoverLetter(job);
        
        await Logger.info('Cover letter generation completed', {
            jobId: job.id,
            success: result.success
        });

        return Response.json({ success: true, data: result });
    } catch (error) {
        await Logger.error('Error in POST /api/genai', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            path: '/api/genai',
            method: 'POST'
        });
        
        return Response.json(
            { success: false, error: 'Failed to generate cover letter' },
            { status: 500 }
        );
    }
}