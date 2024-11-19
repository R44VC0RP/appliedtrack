import mongoose, { Document, Schema, Model } from 'mongoose';
import { QuotaNotification, UserTier, QuotaResetOptions } from '@/types/subscription';
import { ConfigModel } from './Config';

export interface UserQuota extends Document {
  userId: string;
  usage: {
    [key: string]: number;
  };
  dateCreated: Date;
  dateUpdated: Date;
  quotaResetDate: Date;
  stripeCurrentPeriodEnd?: Date;
  notifications: QuotaNotification[];
}

const UserQuotaSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  usage: {
    type: Object,
    default: () => ({})
  },
  dateCreated: { type: Date, default: Date.now },
  dateUpdated: { type: Date, default: Date.now },
  quotaResetDate: { type: Date, required: true },
  stripeCurrentPeriodEnd: { type: Date },
  notifications: [{
    type: {
      type: String,
      enum: ['warning', 'exceeded'],
      required: true
    },
    quotaKey: String,
    currentUsage: Number,
    limit: Number,
    message: String
  }]
});

// Helper function to create initial quota
export async function createInitialQuota(userId: string, periodEnd?: Date): Promise<UserQuota> {
  return await UserQuotaModel.create({
    userId,
    usage: {},
    quotaResetDate: periodEnd || new Date(new Date().setDate(new Date().getDate() + 30)),
    stripeCurrentPeriodEnd: periodEnd,
    notifications: []
  });
}

// Helper function to reset quota based on tier
export async function resetQuota({ userId, tier, resetDate }: QuotaResetOptions): Promise<UserQuota | null> {
  // Special handling for JOBS_COUNT - preserve its value
  const currentQuota = await UserQuotaModel.findOne({ userId });
  const jobsCount = currentQuota?.usage?.JOBS_COUNT ?? 0;
  
  const newUsage: { [key: string]: number } = {};
  if (jobsCount > 0) {
    newUsage['JOBS_COUNT'] = jobsCount;
  }

  return await UserQuotaModel.findOneAndUpdate(
    { userId },
    {
      $set: {
        usage: newUsage,
        quotaResetDate: resetDate || new Date(new Date().setDate(new Date().getDate() + 30)),
        dateUpdated: new Date()
      }
    },
    { new: true }
  );
}

// Helper function to check quota limits and generate notifications
export async function checkQuotaLimits(userId: string, tier: UserTier): Promise<QuotaNotification[]> {
  const quota = await UserQuotaModel.findOne({ userId });
  const config = await ConfigModel.findOne();
  
  if (!quota || !config?.tierLimits?.[tier]) {
    return [];
  }

  const notifications: QuotaNotification[] = [];
  const limits = config.tierLimits[tier];

  for (const [key, usage] of Object.entries(quota.usage)) {
    const limit = limits[key]?.limit;
    if (!limit) continue;

    const usagePercent = (usage / limit) * 100;
    
    if (usage >= limit) {
      notifications.push({
        type: 'exceeded',
        quotaKey: key,
        currentUsage: usage,
        limit,
        message: `You have exceeded your ${key} quota limit.`
      });
    } else if (usagePercent >= 80) {
      notifications.push({
        type: 'warning',
        quotaKey: key,
        currentUsage: usage,
        limit,
        message: `You are approaching your ${key} quota limit (${usagePercent.toFixed(1)}% used).`
      });
    }
  }

  // Update notifications in the database
  await UserQuotaModel.findOneAndUpdate(
    { userId },
    { notifications },
    { new: true }
  );

  return notifications;
}

// Placeholder for future notification implementation
export async function notifyQuotaStatus(notifications: QuotaNotification[]): Promise<void> {
  // TODO: Implement notification system (email, in-app, etc.)
  console.log('Quota notifications:', notifications);
}

export const UserQuotaModel: Model<UserQuota> = mongoose.models.UserQuota || mongoose.model<UserQuota>('UserQuota', UserQuotaSchema);