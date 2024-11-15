'use server'

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { Logger } from '@/lib/logger';

// Models
import { ResumeModel } from './resume-model';

// System Prompts:

const resumeGenerationPrompt = `
    You are a resume generation expert.
    The resume should be in JSON format and should match the schema provided.
    Rules:
    - If you are not sure about a field, leave it blank.
    - If you do not have enough information to fill out a field, leave it blank.
    - Never make up information.
    - For each resume, try to cater it as much as possible to the job that is included. (If there is no job, just make it generic)
    - Make sure to follow best practices for resume writing.
`

export async function srv_func_gptResumeGeneration(prompt: string) {
    try {
        const result = await generateObject({
            model: openai('gpt-4o-mini', {
                structuredOutputs: true,
            }),
            system: resumeGenerationPrompt,
            prompt: prompt,
            schemaName: 'JSON Resume Generation',
            schemaDescription: 'A JSON object that contains the resume.',
            schema: ResumeModel,
        });

        console.log(JSON.stringify(result.object, null, 2));
        return result.object;
    } catch (error) {
        await Logger.error('Failed to generate cover letter', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}