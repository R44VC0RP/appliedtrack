import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { getJob } from '@/lib/db/jobs';
import { getUser } from '@/lib/db/users';
import Pdf from '@/lib/pdf-helper';

async function createCoverLetter(job_id: string, user_id: string) {
    const job = await getJob(job_id);
    const user = await getUser(user_id);

    if (!user || !job) {
        return { success: false, error: 'User or job not found' };
    }

    // Extract text from resume PDF
    const resumeText = await Pdf.getPDFText(job.resumeLink);
    console.log('Extracted resume text:', resumeText);

    // convert the resume Job.resumeLink to images


    

    

    // const { object } = await generateObject({
    //     model: openai('gpt-4o-mini'),
    //     schema: z.object({
    //         cover_letter: z.object({
    //             name_of_company: z.string(),
    //             name_of_applicant: z.string(),
    //             date: z.string(),
    //             body: z.string(),
    //         }),
    //     }),
    //     prompt: 'Generate a cover letter for a job application. ',
    // });
    return "object";
}

export async function POST(req: Request) {
  try {
    const { job_id, user_id } = await req.json();
    const result = await createCoverLetter(job_id, user_id);
    
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in POST /api/genai:', error);
    return Response.json(
      { success: false, error: 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}