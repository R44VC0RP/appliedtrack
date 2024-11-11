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
// import '@/components/fonts/EBGaramond-Medium-normal'

const latexGenerationRules = `
General Rules
Simplify Formatting: Avoid overly complex packages or formatting. Use standard LaTeX classes (e.g., article) and keep layout minimal to maximize compatibility.
Minimal Package Use: Use only essential packages, such as geometry for margins, hyperref for links, and parskip to manage spacing between paragraphs.
Basic and Clear Structure: Use clear and basic structures like section headings without extensive custom commands. Avoid deep nesting or complex environments.
Consistent Font and Styling: Stick to default fonts and avoid custom font packages to minimize dependency issues.
Cross-Platform Compatibility: Ensure the resume is universally compatible by not relying on OS-specific fonts or proprietary packages.
Resume-Specific Guidelines
Name and Contact Details: Center the name at the top, followed by contact details with a horizontal line for separation.
Objective Section: Provide a concise, clear objective, preferably one or two sentences.
Education and Work Experience: Use \\textbf for highlighting titles and use \\hfill for aligning dates to the right.
Bullet Points: Use simple dashes or bullet points for experience and project descriptions, keeping each item brief and impactful.
Skills: Group skills in a simple tabular format or as a list for easy readability.
Projects and Extracurriculars: Keep descriptions concise, emphasizing key achievements or technologies used.
Cover Letter Guidelines
Formal Structure: Start with a salutation and end with a professional closing, including the sender’s and recipient’s information.
Paragraph Spacing: Use \\par or \\vspace for spacing between paragraphs.
Simple Formatting: Emphasize only important keywords or phrases using \\textbf or \\textit.
No Custom Layouts: Avoid using custom sectioning commands; stick to plain text for easy editing.
`

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
 * Generates an AI rating for a job application
 * @param job - The job application data
 * @returns Promise containing the generated AI rating and notes
 */
async function createAIRating(job: Job) {
    const user = await getUser(job.userId);
    const jobData = await getJob(job.id);

    if (!user || !jobData) {
        await Logger.warning('User or job not found during AI rating', {
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

    const prompt_to_create_ai_rating = `
        You are a master AI resume rating system. You are given a resume and a job description. You need to rate the resume on a scale of 1 to 100 based on how well it matches the job description.

        Resume Rating Instructions:

        You are going to rate ${user.name}'s resume for ${job.company}.

        Here is ${user.name}'s resume: ${resumeText}

        And here is ${job.company}'s job description: ${job.jobDescription}

        Please rate the resume on a scale of 1 to 100 based on how well it matches the job description.

        Please include your rating and notes in the response.

        RULES:

        1. DO NOT BE BIASED BY THE COMPANY NAME. Rate the resume based on how well it matches the job description, not the company name.
        2. DO NOT DISCRIMINATE BASED ON THE USER'S AGE, RACE, GENDER, NATIONALITY, DISABILITY, GENETIC INFORMATION, SEXUAL ORIENTATION, RELIGION, OR ANY OTHER STATUS PROTECTED BY LAW.
        3. DO NOT SAY THE RESUME IS "AMAZING" OR "PERFECT" OR ANY OTHER WORDS THAT WOULD BE CONSIDERED TO BE EXAGGERATED.
        4. BE CONSTRUCTIVE AND HELPFUL, IF YOU NOTICE THAT A USER COULD IMPROVE THEIR RESUME, TELL THEM HOW TO DO SO.
        5. IN YOUR NOTES, TELL THE USER WHAT THEY DID WELL AND WHAT THEY COULD IMPROVE ON.
        6. IN YOUR NOTES BE CONCISE AND TO THE POINT. DO NOT WRITE MORE THAN 250 WORDS.
        7. USE HTML TAGS IN YOUR NOTES TO FORMAT THE TEXT. ONLY USE THESE TAGS: <p>, <span>, <br>, <b>, <i>, <u>.
        8. DO NOT ADDRESS THE USER AS THEIR NAME, JUST REFER TO THEM AS "YOU".
    `

    await Logger.info('AI resume rating prompt', {
        jobId: job.id,
        promptLength: prompt_to_create_ai_rating.length
    });

    // Generate cover letter using GPT
    const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: z.object({
            ai_rating: z.object({
                rating: z.number(),
                notes: z.string(),
            }),
        }),
        prompt: prompt_to_create_ai_rating,
    });
    return { success: true, aiRating: object.ai_rating.rating, aiNotes: object.ai_rating.notes };
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
            model: openai('gpt-4o-mini'),
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
        

        const { job, action } = await req.json();

        switch (action) {
            case 'cover-letter':
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
            case 'ai-rating':
                await Logger.info('AI rating request received', {
                    jobId: job.id,
                    company: job.company
                });
                const aiRatingResult = await createAIRating(job);
                await Logger.info('AI rating completed', {
                    jobId: job.id,
                    success: aiRatingResult.success
                });
                await JobModel.updateOne({ id: job.id }, { $set: { aiRating: aiRatingResult.aiRating, aiNotes: aiRatingResult.aiNotes, aiRated: true } });
                return Response.json({ success: true, data: aiRatingResult });
            default:
                return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }
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