import { UserQuotaModel } from '@/models/UserQuota';
import { JobModel } from '@/models/Job';
import { UserModel } from '@/models/User';

const TIER_LIMITS = {
  free: {
    jobs: 50,
    coverLetters: 10,
    emails: 2
  },
  pro: {
    jobs: -1, // unlimited
    coverLetters: 25,
    emails: 50
  },
  power: {
    jobs: -1, // unlimited
    coverLetters: -1, // unlimited
    emails: 100
  }
};

export async function getUserQuota(userId: string) {
  const user = await UserModel.findOne({ userId });
  if (!user) throw new Error('User not found');

  // Get or create quota document
  let quota = await UserQuotaModel.findOne({ userId });
  if (!quota || quota.quotaResetDate < new Date()) {
    // Reset quota if it's past reset date
    quota = await UserQuotaModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          emailsUsed: 0,
          coverLettersUsed: 0,
          quotaResetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          dateUpdated: new Date()
        }
      },
      { upsert: true, new: true }
    );
  }

  // Count jobs
  const jobCount = await JobModel.countDocuments({ userId });

  const tierLimits = TIER_LIMITS[user.tier as keyof typeof TIER_LIMITS];

  return {
    jobs: {
      used: jobCount,
      limit: tierLimits.jobs,
      remaining: tierLimits.jobs === -1 ? -1 : Math.max(0, tierLimits.jobs - jobCount)
    },
    coverLetters: {
      used: quota?.coverLettersUsed || 0,
      limit: tierLimits.coverLetters,
      remaining: tierLimits.coverLetters === -1 ? -1 : Math.max(0, tierLimits.coverLetters - (quota?.coverLettersUsed || 0) )
    },
    emails: {
      used: quota?.emailsUsed || 0,
      limit: tierLimits.emails,
      remaining: tierLimits.emails === -1 ? -1 : Math.max(0, tierLimits.emails - (quota?.emailsUsed || 0) )
    },
    resetDate: quota?.quotaResetDate || new Date()
  };
}

export async function incrementQuota(userId: string, type: 'emails' | 'coverLetters') {
  const quota = await UserQuotaModel.findOne({ userId });
  if (!quota) throw new Error('Quota not found');

  const updateField = type === 'emails' ? 'emailsUsed' : 'coverLettersUsed';
  
  return await UserQuotaModel.findOneAndUpdate(
    { userId },
    { 
      $inc: { [updateField]: 1 },
      $set: { dateUpdated: new Date() }
    },
    { new: true }
  );
} 