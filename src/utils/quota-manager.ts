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