import { UserQuotaModel } from '@/models/UserQuota';
import { JobModel } from '@/models/Job';
import { UserModel } from '@/models/User';
import { ConfigModel } from '@/models/Config';



const QUOTA_RESET_INTERVAL = 30; // days

// Add type definitions
interface QuotaLimits {
  jobs: number;
  coverLetters: number;
  emails: number;
}

interface QuotaCategory {
  used: number;
  limit: number;
  remaining: number;
}

export interface QuotaData {
  jobs: QuotaCategory;
  coverLetters: QuotaCategory;
  emails: QuotaCategory;
  resetDate: Date;
}

export async function getUserQuota(userId: string): Promise<QuotaData> {
  const TIER_LIMITS = await ConfigModel.findOne({ key: 'tierLimits' });
  const user = await UserModel.findOne({ userId });
  
  if (!user) {
    console.error('User not found:', userId);
    throw new Error('User not found');
  }

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

  // Ensure we have valid tier limits
  const defaultLimits: Record<string, QuotaLimits> = {
    free: { jobs: 10, coverLetters: 5, emails: 5 },
    pro: { jobs: 100, coverLetters: 50, emails: 50 },
    power: { jobs: -1, coverLetters: -1, emails: -1 }
  };

  const tierLimits = TIER_LIMITS?.[user.tier as keyof typeof TIER_LIMITS] || defaultLimits[user.tier] || defaultLimits.free;

  // Count jobs with error handling
  const jobCount = await JobModel.countDocuments({ userId }).catch(() => 0);

  // Construct the response with validated numbers
  const response: QuotaData = {
    jobs: {
      used: Math.max(0, jobCount),
      limit: tierLimits.jobs,
      remaining: tierLimits.jobs === -1 ? -1 : Math.max(0, tierLimits.jobs - jobCount)
    },
    coverLetters: {
      used: Math.max(0, quota?.aiCoverLettersUsed || 0),
      limit: tierLimits.coverLetters,
      remaining: tierLimits.coverLetters === -1 ? -1 : 
        Math.max(0, tierLimits.coverLetters - (quota?.aiCoverLettersUsed || 0))
    },
    emails: {
      used: Math.max(0, quota?.emailsUsed || 0),
      limit: tierLimits.emails,
      remaining: tierLimits.emails === -1 ? -1 : 
        Math.max(0, tierLimits.emails - (quota?.emailsUsed || 0))
    },
    resetDate: quota?.quotaResetDate || new Date(new Date().setMonth(new Date().getMonth() + 1))
  };

  // Validate the response
  Object.entries(response).forEach(([key, value]) => {
    if (key !== 'resetDate' && typeof value === 'object') {
      Object.entries(value as QuotaCategory).forEach(([subKey, subValue]) => {
        if (typeof subValue !== 'number' || (subValue !== -1 && (isNaN(subValue) || !isFinite(subValue)))) {
          console.error(`Invalid quota value for ${key}.${subKey}:`, subValue);
          throw new Error(`Invalid quota value for ${key}.${subKey}`);
        }
      });
    }
  });

  return response;
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