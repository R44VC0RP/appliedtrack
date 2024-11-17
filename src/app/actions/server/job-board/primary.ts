"use server"

import { JobModel } from "@/models/Job";
import { ResumeModel } from "@/models/Resume";
import { currentUser } from "@clerk/nextjs/server";
import { Logger } from "@/lib/logger";
import { UserModel, User } from "@/models/User";
import { srv_getCompleteUserProfile, CompleteUserProfile } from "@/lib/useUser";
import { srv_addGenAIAction } from "@/lib/useGenAI";
import { ConfigModel } from "@/models/Config";
import { UserQuotaModel } from "@/models/UserQuota";
import { plain } from "@/lib/plain";
import { IJob as Job } from "@/models/Job";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import Pdf from "@/lib/pdf-helper";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { srv_addServiceUsage } from "@/lib/tierlimits";
import { createInitialQuota } from "@/models/UserQuota";
type ActionType = 'job' | 'coverLetter' | 'resume' | 'email';

export interface QuotaCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
}

export async function srv_checkUserAttributes(userId: string): Promise<CompleteUserProfile | null> {
  const user = await srv_getCompleteUserProfile(userId);
  return plain(user);
}

export async function srv_func_verifyTiers(userId: string, serviceKey: string): Promise<QuotaCheck> {
  try {
    // Get user and their tier
    const user = await UserModel.findOne({ userId });
    if (!user) {
      await Logger.warning('User not found during tier verification', { userId });
      throw new Error('User not found');
    }

    // Get config with tier limits
    const config = await ConfigModel.findOne({});
    if (!config) {
      await Logger.warning('Config not found during tier verification', { userId });
      throw new Error('Config not found');
    }

    // Convert to plain objects
    const plainConfig = plain(config);
    
    // Check if service exists and is active
    const service = plainConfig.services[serviceKey];
    
    await Logger.info('Service check', { 
      serviceKey,
      serviceExists: !!service,
      serviceActive: service?.active,
      services: plainConfig.services
    });
    
    if (!service || !service.active) {
      await Logger.warning('Invalid or inactive service requested', {
        userId,
        serviceKey
      });
      throw new Error('Service not available');
    }

    // Get user's current quota
    let quota = await UserQuotaModel.findOne({ userId });
    if (!quota) {
      await Logger.info('Creating initial quota for user', { userId });
      try {
        quota = await createInitialQuota(userId);
        await Logger.info('Initial quota created', { userId, quota });
      } catch (error) {
        await Logger.error('Failed to create initial quota', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        throw new Error('Failed to create quota');
      }
    }

    quota = plain(quota);

    // Get tier limits based on user's tier using object access
    const tierLimits = plainConfig.tierLimits[user.tier];
    if (!tierLimits) {
      await Logger.error('Tier limits not found for user tier', {
        userId,
        userTier: user.tier,
        availableTiers: Object.keys(plainConfig.tierLimits)
      });
      throw new Error('Invalid tier configuration');
    }

    // Access service limit using object notation
    const serviceLimit = tierLimits[serviceKey]?.limit ?? 0;
    const currentUsage = quota?.usage[serviceKey] || 0;

    const quotaCheck: QuotaCheck = {
      allowed: serviceLimit === -1 || currentUsage < serviceLimit,
      remaining: serviceLimit === -1 ? -1 : Math.max(0, serviceLimit - currentUsage),
      limit: serviceLimit,
      used: currentUsage
    };

    await Logger.info('Tier verification completed', {
      userId,
      serviceKey,
      tier: user.tier,
      quotaCheck
    });

    return quotaCheck;

  } catch (error) {
    await Logger.error('Error during tier verification', {
      userId,
      serviceKey,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function srv_getJobs() {
  const user = await currentUser();
  if (!user) {
    await Logger.warning('Unauthorized GET jobs attempt', {
      path: "srv_getJobs",
      method: 'GET'
    });
    return [];
  }
  const jobs = await JobModel.find({ userId: user.id });
  return plain(jobs);
}

export async function srv_getJob(jobId: string) {
  const job = await JobModel.findOne({ id: jobId });
  return plain(job);
}

export async function srv_archiveJob(jobId: string) {
  const job = await JobModel.findOneAndUpdate({ id: jobId }, { status: 'Archived' });
  return { success: true, data: plain(job) };
}

export async function srv_getResumes() {
  const user = await currentUser();
  if (!user) {
    await Logger.warning('Unauthorized GET resumes attempt', {
      path: "srv_getResumes",
      method: 'GET'
    });
    return [];
  }
  const resumes = await ResumeModel.find({ userId: user.id });
  return plain(resumes);
}

export async function srv_initialData() {
  const user = await currentUser();
  if (!user) {
    await Logger.warning('Unauthorized initial data attempt', {
      path: "srv_initialData",
      method: 'GET'
    });
    return {};
  }

  const jobs = await srv_getJobs();
  const resumes = await srv_getResumes();
  return { jobs, resumes };
}

export async function srv_addJob(job: Job) {
  const user = await currentUser();

  if (!user) {
    await Logger.warning('Unauthorized add job attempt', { job });
    return;
  }
  const quotaCheck = await srv_func_verifyTiers(user.id, 'JOBS_COUNT');
  if (!quotaCheck.allowed) {
    await Logger.warning('Job creation quota exceeded', { userId: user.id, quotaCheck });
    return { success: false, error: `Job creation quota exceeded. Used: ${quotaCheck.used}/${quotaCheck.limit}` };
  }

  const jobID = uuidv4();
  const newJob = await JobModel.create({ ...job, id: jobID, userId: user.id, dateCreated: new Date().toISOString() });
  return { success: true, data: plain(newJob) };
}

export async function srv_updateJob(job: Job) {
  const user = await currentUser();
  if (!user) {
    await Logger.warning('Unauthorized update job attempt', { job });
    return null;
  }

  try {
    // First verify the job exists and belongs to user
    const existingJob = await JobModel.findOne({ id: job.id, userId: user.id });
    if (!existingJob) {
      await Logger.warning('Job not found or unauthorized access', {
        jobId: job.id,
        userId: user.id
      });
      return null;
    }

    // Update using findOneAndUpdate instead of findByIdAndUpdate
    const updatedJob = await JobModel.findOneAndUpdate(
      { id: job.id, userId: user.id },
      {
        ...job,
        dateUpdated: new Date().toISOString()
      },
      { new: true, runValidators: true }
    );

    if (!updatedJob) {
      throw new Error('Failed to update job');
    }

    await Logger.info('Job updated successfully', {
      jobId: job.id,
      userId: user.id
    });

    return plain(updatedJob);
  } catch (error) {
    await Logger.error('Error updating job', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      jobId: job.id,
      userId: user.id
    });
    return null;
  }
}

export async function srv_updateJobStatus(jobId: string, newStatus: Job['status']) {
  const user = await currentUser();
  if (!user) {
    await Logger.warning('Unauthorized update job status attempt', { jobId });
    return;
  }
  const existingJob = await JobModel.findOne({ id: jobId, userId: user.id });
  if (!existingJob) {
    await Logger.warning('Unauthorized job update attempt', { jobId, userId: user.id });
    return null;
  }
  const updatedJob = await JobModel.findByIdAndUpdate(jobId, { status: newStatus }, { new: true });
  return updatedJob;
}

export async function srv_createAIRating(job: Job) {
  const user = await srv_getCompleteUserProfile(job.userId || '') as CompleteUserProfile;
  
  // Check quota before proceeding
  const quotaCheck = await srv_func_verifyTiers(user.id, 'AI_RESUME_RATING');
  if (!quotaCheck.allowed) {
    await Logger.warning('AI rating quota exceeded', {
      userId: user.id,
      quotaCheck
    });
    return { 
      success: false, 
      error: `Quota exceeded. Used: ${quotaCheck.used}/${quotaCheck.limit}` 
    };
  }

  const jobData = await srv_getJob(job.id || '');

  if (!user || !jobData) {
    await Logger.warning('User or job not found during AI rating', {
      userId: job.userId,
      jobId: job.id
    });
    return { success: false, error: 'User or job not found' };
  }

  if (!await srv_addServiceUsage(user.id, 'GENAI_JOBMATCH', 1)) {
    await Logger.warning('AI job match quota exceeded', {
      userId: user.id,
    });
    return { success: false, error: 'AI job match quota exceeded' };
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

      You are going to rate ${user.firstName + ' ' + user.lastName}'s resume for ${job.company}.

      Here is ${user.firstName}'s resume: ${resumeText}

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
  const { object, usage } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: z.object({
      ai_rating: z.object({
        rating: z.number(),
        notes: z.string(),
      }),
    }),
    prompt: prompt_to_create_ai_rating,
  });

  const GPT_4O_MINI_INPUT_COST_PER_1M_TOKENS_IN_CENTS = 15;
  const GPT_4O_MINI_OUTPUT_COST_PER_1M_TOKENS_IN_CENTS = 60;

  const totalCostInCents = 
    (usage.promptTokens / 1_000_000) * GPT_4O_MINI_INPUT_COST_PER_1M_TOKENS_IN_CENTS +
    (usage.completionTokens / 1_000_000) * GPT_4O_MINI_OUTPUT_COST_PER_1M_TOKENS_IN_CENTS;

  await srv_addGenAIAction('createAIResumeRating', usage.promptTokens, usage.completionTokens, totalCostInCents);

  console.log(usage);

  // After successful generation, update usage
  

  return { success: true, aiRating: object.ai_rating.rating, aiNotes: object.ai_rating.notes };
}

function isValidDomain(domain: string): boolean {
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  return domainPattern.test(cleanDomain);
}

export async function srv_hunterDomainSearch(domain: string, departments: string[], limit: number) {
  const hunterDepartments = ['executive', 'it', 'finance', 'management', 'sales', 'legal', 'support', 'hr', 'marketing', 'communication', 'education', 'design', 'health', 'operations'];
  if (departments.length > 0 && !departments.every(dep => hunterDepartments.includes(dep))) {
    await Logger.warning('Invalid department specified in Hunter search', {
      domain,
      invalidDepartments: departments.filter(dep => !hunterDepartments.includes(dep))
    });
    throw new Error('Invalid department');
  }

  if (limit < 1 || limit > 30) {
    console.error('Invalid amount:', limit);
    throw new Error('Invalid amount');
  }

  const hunterApiKey = process.env.HUNTER_API_KEY;
  let allEmails: any[] = [];

  try {
    await Logger.info('Hunter domain search initiated', {
      domain,
      limit,
      departments
    });
    
    // First request to get total results
    const initialUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterApiKey}&limit=${limit}`;
    console.log('Initial URL:', initialUrl);
    const initialResponse = await fetch(initialUrl);
    if (!initialResponse.ok) {
      throw new Error(`Hunter API error: ${initialResponse.statusText}`);
    }
    const dataResponse = await initialResponse.json();
    const totalResults = dataResponse.meta.results;

    // Sanitize all emails
    

    await Logger.info('Hunter domain search completed', {
      domain,
      totalResults,
      resultsReturned: limit
    });

    return { data: dataResponse, total_results: totalResults };
  } catch (error) {
    await Logger.error('Hunter API request failed', {
      domain,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}