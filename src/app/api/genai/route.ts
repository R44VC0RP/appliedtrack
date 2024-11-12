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
import { latexToPdfUrl } from '@/lib/latex-to-pdf';
// import '@/components/fonts/EBGaramond-Medium-normal'

// Import templates.
import coverLetterTemplate from '@/app/api/genai/templates/cover_letter_template';
import resumeTemplate from '@/app/api/genai/templates/resume_template';


const latexGenerationRules = `
    Only use the following special characters: $, %, #, &, ’
`

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

            Concise Formatting: Aim for 100-200 words. Use clear paragraphs, an easy-to-read font, and close formally (e.g., "Yours sincerely").

            You are going to write a cover letter for ${job.company} as ${user.name}.

            Here is ${user.name}'s resume: ${resumeText}

            And here is ${user.name}'s personal statement: ${user.about}

            Generate a professional cover letter for ${job.company} that is tailored to the job description and the user's resume and personal statement. 

            Please address it to the hiring manager of ${job.company}. Do not include the company address in the letter.

            If you do not have information for a field, do not include it. NEVER MAKE UP INFORMATION. ALWAYS REFERENCE THE USER'S RESUME AND PERSONAL STATEMENT. NEVER ADD STUFF LIKE [Company Address] [City, State, Zip] OR ANYTHING LIKE THAT.

            For generation of the cover letter, please use LaTeX. You are going to use the following template: ${coverLetterTemplate}. DO NOT CHANGE THE FORMAT OF THE TEMPLATE. JUST ADD AND REPLACE THE NEEDED DETAILS. IF YOU DO NOT HAVE INFORMATION FOR A CERTAIN FIELD, LEAVE IT BLANK.
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
                    latex_body: z.string(),
                }),
            }),
            prompt: prompt_to_create_cover_letter,
        });

        await Logger.info('Cover letter generated successfully', {
            jobId: job.id,
            company: job.company,
            coverLetterLength: object.cover_letter.latex_body.length,
            coverLetter: object.cover_letter.latex_body
        });

        // Generate PDF
        const { url, status } = await latexToPdfUrl(object.cover_letter.latex_body);

        if (status !== "Success") {
            await Logger.error('Cover letter generation failed', {
                jobId: job.id,
                status: status
            });
            return { success: false, error: 'Cover letter generation failed' };
        }

        await Logger.info('Cover letter uploaded successfully', {
            jobId: job.id,
            fileUrl: url
        });

        // Update job with cover letter data
        await JobModel.updateOne({ id: job.id }, { $set: { coverLetter: { url: url, status: 'ready' }, dateGenerated: new Date().toISOString() } });

        return {
            success: true,
            coverLetterData: object.cover_letter,
            pdfUrl: url
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
 * Generates a resume for a job application using AI
 * @param job - The job application data
 * @returns Promise containing the generated resume data and PDF URL
 */
async function createResume(job: Job) {
    try {
        await Logger.info('Starting resume generation', {
            jobId: job.id,
            company: job.company,
            userId: job.userId
        });

        const user = await getUser(job.userId);
        const jobData = await getJob(job.id);

        if (!user || !jobData) {
            await Logger.warning('User or job not found during resume generation', {
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

        const prompt_to_create_resume = `

            You are a master resume generator. You are going to create a resume for ${user.name} applying to ${job.company} for the position of ${job.position}.

            Resume Instructions:
            - Keep it concise and professional
            - Make it as compact as possible.
            - Do not include any information that is not relevant to the job.
            - Try to fit the resume in 1 page.
            - Highlight relevant skills and experience for this specific role
            - Use action verbs and quantifiable achievements
            - Ensure proper formatting and organization
            - Include contact information, work history, education, and skills
            - Tailor content to match job requirements
            - Use LaTeX and this template: ${resumeTemplate}
            
            Here is ${user.name}'s personal statement: ${user.about}

            Here is ${user.name}'s resume: ${resumeText}

            If you do not have information for a field, do not include it. NEVER MAKE UP INFORMATION. ALWAYS REFERENCE THE USER'S RESUME AND PERSONAL STATEMENT. NEVER ADD STUFF LIKE [Company Address] [City, State, Zip] OR ANYTHING LIKE THAT.

            Please generate a professional resume using LaTeX following these rules: ${latexGenerationRules} | STRICTLY FOLLOW THESE RULES.
        `;

        await Logger.info('Resume generation prompt created', {
            jobId: job.id,
            promptLength: prompt_to_create_resume.length
        });

        // Generate resume using GPT
        const { object } = await generateObject({
            model: openai('gpt-4o-mini'),
            schema: z.object({
                resume: z.object({
                    latex_body: z.string(),
                }),
            }),
            prompt: prompt_to_create_resume,
        });

        await Logger.info('Resume generated successfully', {
            jobId: job.id,
            company: job.company,
            resumeLength: object.resume.latex_body.length,
            resume_type: typeof object.resume.latex_body

        });

        // Generate PDF
        const { url, status } = await latexToPdfUrl(object.resume.latex_body);

        if (status !== "Success") {
            await Logger.error('Resume generation failed', {
                jobId: job.id,
                status: status
            });
            return { success: false, error: 'Resume generation failed' };
        }

        await Logger.info('Resume uploaded successfully', {
            jobId: job.id,
            fileUrl: url
        });

        // Update job with resume data
        await JobModel.updateOne({ id: job.id }, { $set: { resumeGenerated: { url: url, status: 'ready', dateGenerated: new Date().toISOString() } } });

        return {
            success: true,
            resumeData: object.resume,
            pdfUrl: url
        };

    } catch (error) {
        await Logger.error('Error in createResume', {
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
            case 'resume':
                await Logger.info('Resume generation request received', {
                    jobId: job.id,
                    company: job.company
                });
                const resumeResult = await createResume(job);
                await Logger.info('Resume generation completed', {
                    jobId: job.id,
                    success: resumeResult.success
                });
                return Response.json({ success: true, data: resumeResult });
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