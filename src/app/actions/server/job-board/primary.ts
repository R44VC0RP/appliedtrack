"use server"

import { JobModel } from "@/models/Job";
import { ResumeModel } from "@/models/Resume";
import { currentUser } from "@clerk/nextjs/server";
import { Logger } from "@/lib/logger";
import { UserModel, User } from "@/models/User";
import { ConfigModel } from "@/models/Config";
import { UserQuotaModel } from "@/models/UserQuota";
import { plain } from "@/lib/plain";
import { IJob as Job } from "@/models/Job";
type ActionType = 'job' | 'coverLetter' | 'resume' | 'email';

export interface QuotaCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
}

export async function srv_checkUserAttributes(userId: string): Promise<{ onboardingComplete: boolean, role: User['role'], tier: User['tier'] }> {
  const user = await UserModel.findOne({ userId });
  return { onboardingComplete: user?.onBoardingComplete || false, role: user?.role || 'user', tier: user?.tier || 'free' };
}

export async function srv_func_verifyTiers(userId: string, action: ActionType): Promise<QuotaCheck> {
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

    // Get user's current quota
    const quota = await UserQuotaModel.findOne({ userId });
    if (!quota) {
      await Logger.warning('Quota not found during tier verification', { userId });
      throw new Error('Quota not found');
    }

    // Get tier limits based on user's tier
    const tierLimits = config.tierLimits[user.tier];
    
    // Initialize quota check result
    let quotaCheck: QuotaCheck = {
      allowed: false,
      remaining: 0,
      limit: 0,
      used: 0
    };

    // Check limits based on action type
    switch (action) {
      case 'job':
        const jobCount = await JobModel.countDocuments({ userId });
        quotaCheck = {
          allowed: tierLimits.jobs === -1 || jobCount < tierLimits.jobs,
          remaining: tierLimits.jobs === -1 ? -1 : Math.max(0, tierLimits.jobs - jobCount),
          limit: tierLimits.jobs,
          used: jobCount
        };
        break;

      case 'coverLetter':
        quotaCheck = {
          allowed: tierLimits.coverLetters === -1 || quota.aiCoverLettersUsed < tierLimits.coverLetters,
          remaining: tierLimits.coverLetters === -1 ? -1 : Math.max(0, tierLimits.coverLetters - quota.aiCoverLettersUsed),
          limit: tierLimits.coverLetters,
          used: quota.aiCoverLettersUsed
        };
        break;

      case 'email':
        quotaCheck = {
          allowed: tierLimits.contactEmails === -1 || quota.emailsUsed < tierLimits.contactEmails,
          remaining: tierLimits.contactEmails === -1 ? -1 : Math.max(0, tierLimits.contactEmails - quota.emailsUsed),
          limit: tierLimits.contactEmails,
          used: quota.emailsUsed
        };
        break;

      default:
        await Logger.warning('Invalid action type for tier verification', { 
          userId, 
          action 
        });
        throw new Error('Invalid action type');
    }

    await Logger.info('Tier verification completed', {
      userId,
      action,
      tier: user.tier,
      quotaCheck
    });

    return quotaCheck;

  } catch (error) {
    await Logger.error('Error during tier verification', {
      userId,
      action,
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
    const newJob = await JobModel.create({ ...job, userId: user.id });
    return plain(newJob);
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