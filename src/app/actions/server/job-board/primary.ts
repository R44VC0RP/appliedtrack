"use server"

import { ResumeModel } from "@/models/Resume";
import { currentUser } from "@clerk/nextjs/server";
import { Logger } from "@/lib/logger";
import { UserModel, User } from "@/models/User";
import { srv_getCompleteUserProfile, CompleteUserProfile } from "@/lib/useUser";
import { srv_addGenAIAction } from "@/lib/useGenAI";
import { plain } from "@/lib/plain";

import { createInitialQuota } from "@/lib/useQuota";

import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import Pdf from "@/lib/pdf-helper";
import { openai } from "@ai-sdk/openai";
import { generateObject, JSONParseError, TypeValidationError } from "ai";
import { srv_addServiceUsage } from "@/lib/tierlimits";
import { UTApi } from "uploadthing/server";
import { PrismaClient, JobStatus } from '@prisma/client'
import { Job } from "@/app/types/job";

const utapi = new UTApi();
const prisma = new PrismaClient()

interface FileEsque {
  name: string;
  [Symbol.toStringTag]: string;
  stream: () => ReadableStream;
  text: () => Promise<string>;
  arrayBuffer: () => Promise<ArrayBuffer>;
  slice: () => Blob;
  size: number;
  type: string;
}

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

export async function srv_func_verifyTiers(userId: string, serviceKey: string, action: string = "increment"): Promise<QuotaCheck> {
  try {
    // Get user and their tier
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { userQuota: true }
    });
    
    if (!user) {
      await Logger.warning('User not found during tier verification', { userId });
      throw new Error('User not found');
    }

    // Get config with tier limits
    const config = await prisma.config.findFirst();
    if (!config) {
      await Logger.warning('Config not found during tier verification', { userId });
      throw new Error('Config not found');
    }

    // Get active job count
    const activeJobCount = await prisma.job.count({
      where: { 
        userId, 
        status: { not: 'ARCHIVED' } 
      }
    });

    // Parse JSON data from config
    const tierLimits = JSON.parse(config.tierLimits as string);
    const services = JSON.parse(config.services as string);

    // Check if service exists and is active
    const service = services[serviceKey];

    await Logger.info('Service check', {
      serviceKey,
      serviceExists: !!service,
      serviceActive: service?.active,
      services
    });

    if (!service || !service.active) {
      await Logger.warning('Invalid or inactive service requested', {
        userId,
        serviceKey
      });
      throw new Error('Service not available');
    }

    // Get or create user quota
    let userQuota = user.userQuota;
    if (!userQuota) {
      userQuota = await prisma.userQuota.create({
        data: {
          userId,
          quotaResetDate: new Date(),
          quotaUsage: {
            create: [
              {
                quotaKey: serviceKey,
                usageCount: 0
              }
            ]
          }
        },
        include: {
          quotaUsage: true
        }
      });
    }

    // Find or create quota usage for the service
    let quotaUsage = await prisma.quotaUsage.findUnique({
      where: {
        userQuotaId_quotaKey: {
          userQuotaId: userQuota.id,
          quotaKey: serviceKey
        }
      }
    });

    if (!quotaUsage) {
      quotaUsage = await prisma.quotaUsage.create({
        data: {
          userQuotaId: userQuota.id,
          quotaKey: serviceKey,
          usageCount: 0
        }
      });
    }

    // Update JOBS_COUNT if necessary
    if (serviceKey === 'JOBS_COUNT') {
      await prisma.quotaUsage.update({
        where: {
          userQuotaId_quotaKey: {
            userQuotaId: userQuota.id,
            quotaKey: serviceKey
          }
        },
        data: {
          usageCount: activeJobCount,
          dateUpdated: new Date()
        }
      });
      quotaUsage = await prisma.quotaUsage.findUnique({
        where: {
          userQuotaId_quotaKey: {
            userQuotaId: userQuota.id,
            quotaKey: serviceKey
          }
        }
      });
    }

    // Get tier limits for user's tier
    const userTierLimits = tierLimits[user.tier];
    if (!userTierLimits) {
      await Logger.error('Tier limits not found for user tier', {
        userId,
        userTier: user.tier,
        availableTiers: Object.keys(tierLimits)
      });
      throw new Error('Invalid tier configuration');
    }

    const serviceLimit = userTierLimits[serviceKey]?.limit ?? 0;
    const currentUsage = quotaUsage?.usageCount || 0;

    // If action is increment and not jobs service
    if (action === "increment" && serviceKey !== 'JOBS_COUNT') {
      const newUsage = currentUsage + 1;

      // Only increment if within limits or if limit is -1 (unlimited)
      if (serviceLimit === -1 || newUsage <= serviceLimit) {
        await prisma.quotaUsage.update({
          where: {
            userQuotaId_quotaKey: {
              userQuotaId: userQuota.id,
              quotaKey: serviceKey
            }
          },
          data: {
            usageCount: newUsage,
            dateUpdated: new Date()
          }
        });

        await Logger.info('Service usage incremented', {
          userId,
          serviceKey,
          previousUsage: currentUsage,
          newUsage
        });
      }
    }

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

  try {
    // Get all jobs
    const jobs = await prisma.job.findMany({
      where: { userId: user.id },
      include: {
        generatedResumes: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        generatedCoverLetters: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        hunterCompanies: {
          include: {
            emails: true
          }
        }
      }
    });

    // Transform the response to flatten the most recent resume
    const transformedJobs = jobs.map(job => {
      return {
        ...job,
        latestGeneratedResume: job.generatedResumes[0] || null,
        latestGeneratedCoverLetter: job.generatedCoverLetters[0] || null,
        generatedResumes: undefined, // Remove the full array since we only need the latest
        generatedCoverLetters: undefined
      };
    });

    // Count active jobs (not archived)
    const activeJobCount = transformedJobs.filter(job => job.status !== 'ARCHIVED').length;

    // Get or create quota
    let quota = await prisma.userQuota.findUnique({ where: { userId: user.id } });
    if (!quota) {
      try {
        quota = await createInitialQuota(user.id);
        await Logger.info('Created initial quota for user', {
          userId: user.id,
          quota: plain(quota)
        });
      } catch (error) {
        await Logger.error('Failed to create initial quota', {
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

    const plainQuota = plain(quota);
    const currentQuotaUsage = plainQuota?.usage?.JOBS_COUNT || 0;

    // Update quota if it doesn't match active job count
    if (quota && currentQuotaUsage !== activeJobCount) {
      await prisma.quotaUsage.update({
        where: {
          userQuotaId_quotaKey: {
            userQuotaId: quota.id,
            quotaKey: 'JOBS_COUNT'
          }
        },
        data: {
          usageCount: activeJobCount,
          dateUpdated: new Date()
        }
      });
      await Logger.info('Updated jobs quota to match active count', {
        userId: user.id,
        previousCount: currentQuotaUsage,
        newCount: activeJobCount
      });
    }
    
    return transformedJobs;
  } catch (error) {
    await Logger.error('Error fetching jobs', {
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return [];
  }
}

export async function srv_getJob(jobId: string) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    return job;
  } catch (error) {
    await Logger.error('Error fetching job', {
      jobId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}

export async function srv_archiveJob(jobId: string) {
  try {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { status: 'ARCHIVED' as JobStatus }
    });
    return { success: true, data: job };
  } catch (error) {
    await Logger.error('Error archiving job', {
      jobId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return { success: false, error: 'Failed to archive job' };
  }
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

  try {
    const jobID = uuidv4();
    const newJob = await prisma.job.create({
      data: {
        id: jobID,
        userId: user.id,
        company: job.company,
        position: job.position,
        status: (job.status?.toUpperCase().replace(' ', '_') || 'YET_TO_APPLY') as JobStatus,
        website: job.website,
        jobDescription: job.jobDescription,
        dateApplied: job.dateApplied ? new Date(job.dateApplied) : null,
        notes: job.notes,
        contactName: job.contactName,
        contactEmail: job.contactEmail,
        contactPhone: job.contactPhone,
        interviewDate: job.interviewDate ? new Date(job.interviewDate) : null,
        location: job.location,
        flag: job.flag,
        aiRated: job.aiRated || false,
        aiNotes: job.aiNotes,
        aiRating: job.aiRating,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    return { success: true, data: newJob };
  } catch (error) {
    await Logger.error('Error creating job', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: user.id
    });
    return { success: false, error: 'Failed to create job' };
  }
}

export async function srv_updateJob(job: Job) {
  const user = await currentUser();
  if (!user) {
    await Logger.warning('Unauthorized update job attempt', { job });
    return null;
  }

  try {
    // First verify the job exists and belongs to user
    const existingJob = await prisma.job.findFirst({
      where: { 
        id: job.id,
        userId: user.id
      }
    });

    if (!existingJob) {
      await Logger.warning('Job not found or unauthorized access', {
        jobId: job.id,
        userId: user.id
      });
      return null;
    }

    const updatedJob = await prisma.job.update({
      where: { id: job.id },
      data: {
        company: job.company,
        position: job.position,
        status: job.status?.toUpperCase().replace(' ', '_') as JobStatus,
        website: job.website,
        jobDescription: job.jobDescription,
        dateApplied: job.dateApplied ? new Date(job.dateApplied) : null,
        notes: job.notes,
        contactName: job.contactName,
        contactEmail: job.contactEmail,
        contactPhone: job.contactPhone,
        interviewDate: job.interviewDate ? new Date(job.interviewDate) : null,
        location: job.location,
        flag: job.flag,
        aiRated: job.aiRated || false,
        aiNotes: job.aiNotes,
        aiRating: job.aiRating,
        updatedAt: new Date()
      }
    });

    await Logger.info('Job updated successfully', {
      jobId: job.id,
      userId: user.id
    });

    return updatedJob;
  } catch (error) {
    await Logger.error('Error updating job', {
      error: error instanceof Error ? error.message : 'Unknown error',
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
    return null;
  }

  try {
    // First verify the job exists and belongs to user
    const existingJob = await prisma.job.findFirst({
      where: { 
        id: jobId,
        userId: user.id
      }
    });

    if (!existingJob) {
      await Logger.warning('Unauthorized job update attempt', { jobId, userId: user.id });
      return null;
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: newStatus.toUpperCase().replace(' ', '_') as JobStatus,
        updatedAt: new Date()
      }
    });

    return updatedJob;
  } catch (error) {
    await Logger.error('Error updating job status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      jobId,
      userId: user.id
    });
    return null;
  }
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
  for (let i = 0; i < jobs.length; i++) {
    if (jobs[i].hunterCompanies?.length != 0) {
      console.log("Found hunter companies for job:", jobs[i].id);
      // console.log(jobs[i].hunterCompanies);
    }
  }
  const resumes = await srv_getResumes();
  return { jobs, resumes };
}

export interface ResumeUploadData {
  fileUrl: string;
  fileId: string;
  resumeId: string;
  fileName: string;
}

export async function srv_uploadResume(data: ResumeUploadData): Promise<boolean> {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('User not found');
    }

    // Create resume record in the database
    await prisma.generatedResume.create({
      data: {
        userId: user.id,
        jobId: data.resumeId, // Using resumeId as jobId for base resume
        resumeMarkdown: data.fileUrl,
        resumeVersion: 1
      }
    });

    await Logger.info('Resume uploaded successfully', {
      userId: user.id,
      resumeId: data.resumeId,
      fileName: data.fileName
    });

    return true;
  } catch (error) {
    await Logger.error('Failed to upload resume', {
      error: error instanceof Error ? error.message : 'Unknown error',
      data
    });
    throw error;
  }
}

export interface BaselineResumeData {
  fileUrl: string;
  fileId: string;
  fileName: string;
}

export async function srv_uploadBaselineResume(data: BaselineResumeData): Promise<boolean> {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('User not found');
    }

    // Update user with baseline resume
    await prisma.user.update({
      where: { id: user.id },
      data: {
        baselineResume: data.fileUrl
      }
    });

    await Logger.info('Baseline resume uploaded successfully', {
      userId: user.id,
      fileName: data.fileName
    });

    return true;
  } catch (error) {
    await Logger.error('Failed to upload baseline resume', {
      error: error instanceof Error ? error.message : 'Unknown error',
      data
    });
    throw error;
  }
}

export async function srv_createAIRating(job: Job) {
  const user = await srv_getCompleteUserProfile(job.userId || '') as CompleteUserProfile;

  // Check quota before proceeding
  const quotaCheck = await srv_func_verifyTiers(user.id, 'GENAI_JOBMATCH');
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
  const resumeText = await Pdf.getPDFText(job.resumeUrl || '');
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

  // console.log(usage);

  // After successful generation, update usage


  return { success: true, aiRating: object.ai_rating.rating, aiNotes: object.ai_rating.notes };
}

function isValidDomain(domain: string): boolean {
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  return domainPattern.test(cleanDomain);
}

export async function srv_hunterDomainSearch(domain: string, departments: string[], limit: number) {
  const user = await currentUser();
  if (!user) {
    await Logger.warning('Unauthorized Hunter domain search attempt', { domain });
    return { success: false, error: 'Unauthorized' };
  }

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

  const actionAllowed = await srv_func_verifyTiers(user.id, 'HUNTER_EMAILSEARCH');
  if (!actionAllowed.allowed) {
    await Logger.warning('Hunter search quota exceeded', {
      userId: user.id,
      quotaCheck: actionAllowed
    });
    return {
      success: false,
      quotaExceeded: true,
      error: `Quota exceeded for InsightLink&trade; email search. Used: ${actionAllowed.used}/${actionAllowed.limit}. Consider upgrading your tier to access this feature.`
    };
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


    await Logger.info('Hunter domain search completed', {
      domain,
      totalResults,
      resultsReturned: limit
    });

    return { success: true, data: dataResponse, total_results: totalResults };
  } catch (error) {
    await Logger.error('Hunter API request failed', {
      domain,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function srv_generateResume(job: Job) {
  await Logger.info('Starting resume generation', {
    jobId: job.id,
    company: job.company,
    userId: job.userId
  });

  const user = await srv_getCompleteUserProfile(job.userId || '');
  const jobData = await srv_getJob(job.id || '');

  if (!user || !jobData) {
    await Logger.warning('User or job not found during resume generation', {
      userId: job.userId,
      jobId: job.id
    });
    return { success: false, error: 'User or job not found' };
  }

  // Extract text from resume PDF
  const resumeText = await Pdf.getPDFText(job.resumeUrl || '');
  
  const resumeSchema = z.object({
    basics: z.object({
      name: z.string(),
      label: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      url: z.string().optional(),
      summary: z.string(),
      location: z.object({
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        countryCode: z.string().optional(),
        region: z.string().optional()
      }).optional(),
      profiles: z.array(z.object({
        network: z.string(),
        username: z.string(),
        url: z.string()
      })).optional()
    }),
    work: z.array(z.object({
      name: z.string(),
      position: z.string(),
      url: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      summary: z.string(),
      highlights: z.array(z.string())
    })).optional(),
    education: z.array(z.object({
      institution: z.string(),
      url: z.string().optional(),
      area: z.string(),
      studyType: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      score: z.string().optional(),
      courses: z.array(z.string()).optional()
    })).optional(),
    skills: z.array(z.object({
      name: z.string(),
      level: z.string().optional(),
      keywords: z.array(z.string())
    })).optional(),
    languages: z.array(z.object({
      language: z.string(),
      fluency: z.string()
    })).optional(),
    projects: z.array(z.object({
      name: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      description: z.string(),
      highlights: z.array(z.string()).optional(),
      url: z.string().optional()
    })).optional()
  });

  try {
    // const { object: generatedResume, usage } = await generateObject({
    //   model: openai('gpt-4-turbo'),
    //   schema: resumeSchema,
    //   schemaName: 'JSONResume',
    //   schemaDescription: 'A structured resume format optimized for the target job position',
    //   prompt: `
    //     Generate a professional resume in JSON Resume format for ${user.firstName + ' ' + user.lastName} 
    //     applying to ${job.company} for the position of ${job.position}.
        
    //     Original Resume Text: ${resumeText}
    //     Personal Statement: ${user.about}
    //     Target Job Description: ${job.jobDescription}

    //     Instructions:
    //     1. Only include sections where you have reliable information from the provided resume and personal statement
    //     2. Do not fabricate or assume any information
    //     3. Tailor the content to highlight skills and experience relevant to ${job.position} at ${job.company}
    //     4. Use clear, professional language
    //     5. Include quantifiable achievements where possible
    //     6. Format dates as YYYY-MM-DD if available, otherwise omit
    //     7. Ensure all generated content is factual and based on the provided information
    //   `
    // });

    // // Create temporary directory
    // const tempDir = join(process.cwd(), 'tmp');
    // await fs.mkdir(tempDir, { recursive: true });

    // // Save JSON resume to temporary file
    // const jsonPath = join(tempDir, `${job.id}-resume.json`);
    // await fs.writeFile(jsonPath, JSON.stringify(generatedResume, null, 2));

    console.log("User Details:", user);
    console.log("Job Details:", job);
    console.log("Resume Text:", resumeText);

    return { success: true };

  } catch (error) {
    if (error instanceof JSONParseError || error instanceof TypeValidationError) {
      await Logger.error('Resume generation structured data error', {
        jobId: job.id,
        error: error.message,
        errorType: error instanceof JSONParseError ? 'JSONParseError' : 'TypeValidationError',
        details: error instanceof JSONParseError ? error.text : error.value
      });
    } else {
      await Logger.error('Resume generation failed', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
    throw error;
  }
}

export async function srv_updateUserOnboarding(about: string) {
  try {
    const user = await currentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { userId: user.id },
      { 
        $set: { 
          about,
          onBoardingComplete: true 
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error('User not found');
    }

    return plain(updatedUser);
  } catch (error) {
    await Logger.error('Error updating user onboarding', { error });
    throw error;
  }
}

export async function srv_getUserRole() {
  try {
    const user = await currentUser();
    if (!user) {
      return { role: 'user', tier: 'free' };
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return { role: 'user', tier: 'free' };
    }

    return {
      role: dbUser.role || 'user',
      tier: dbUser.tier || 'free'
    };
  } catch (error) {
    await Logger.error('Error fetching user role', { error });
    throw error;
  }
}

export async function srv_getUserDetails() {
  try {
    const user = await currentUser();
    if (!user) {
      await Logger.warning('Unauthorized attempt to get user details', {
        path: "srv_getUserDetails",
        method: 'GET'
      });
      return null;
    }

    console.log('Fetching details for user:', user.id);
    
    // Get user and quota information using Prisma
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userQuota: {
          include: {
            quotaUsage: true,
            notifications: true
          }
        }
      }
    });

    if (!dbUser) {
      console.log('User not found in database');
      return null;
    }

    if (!dbUser.userQuota) {
      console.log('No quota found for user, creating initial quota');
      const newQuota = await createInitialQuota(user.id);
      console.log('Created new quota:', newQuota);
      
      // Fetch the user again with the new quota
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          userQuota: {
            include: {
              quotaUsage: true,
              notifications: true
            }
          }
        }
      });
      
      if (!updatedUser) {
        throw new Error('User not found after quota creation');
      }
      
      dbUser.userQuota = updatedUser.userQuota;
    }

    // Transform the data into the expected format
    const userDetails = {
      userId: dbUser.id,
      tier: dbUser.tier,
      role: dbUser.role,
      about: dbUser.about,
      onboardingComplete: dbUser.onboardingComplete,
      stripeCustomerId: dbUser.stripeCustomerId,
      subscriptionId: dbUser.subscriptionId,
      subscriptionStatus: dbUser.subscriptionStatus,
      cancelAtPeriodEnd: dbUser.cancelAtPeriodEnd,
      currentPeriodEnd: dbUser.currentPeriodEnd,
      quotas: dbUser.userQuota ? {
        usage: dbUser.userQuota.quotaUsage.reduce((acc, usage) => {
          acc[usage.quotaKey] = usage.usageCount;
          return acc;
        }, {} as Record<string, number>),
        quotaResetDate: dbUser.userQuota.quotaResetDate,
        notifications: dbUser.userQuota.notifications.map(notification => ({
          type: notification.type,
          quotaKey: notification.quotaKey,
          currentUsage: notification.currentUsage,
          limit: notification.limit,
          message: notification.message
        }))
      } : undefined
    };

    console.log('Final user details:', userDetails);
    return userDetails;
  } catch (error) {
    await Logger.error('Error fetching user details', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}
