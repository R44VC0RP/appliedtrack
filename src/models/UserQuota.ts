import mongoose, { Document, Schema, Model } from 'mongoose';

export interface UserQuota extends Document {
  userId: string;
  usage: {
    [serviceKey: string]: number;
  };
  dateCreated: Date;
  dateUpdated: Date;
  quotaResetDate: Date;
  stripeCurrentPeriodEnd?: Date;
}

const UserQuotaSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  usage: {
    type: Map,
    of: Number,
    default: new Map()
  },
  dateCreated: { type: Date, default: Date.now },
  dateUpdated: { type: Date, default: Date.now },
  quotaResetDate: { type: Date, required: true },
  stripeCurrentPeriodEnd: { type: Date }
});

// Helper function to create initial quota
export async function createInitialQuota(userId: string, periodEnd?: Date): Promise<UserQuota> {
  return await UserQuotaModel.create({
    userId,
    usage: new Map(),
    quotaResetDate: periodEnd || new Date(new Date().setDate(new Date().getDate() + 30)),
    stripeCurrentPeriodEnd: periodEnd
  });
}

// Helper function to reset quota
export async function resetQuota(userId: string, newPeriodEnd: Date): Promise<UserQuota | null> {
  return await UserQuotaModel.findOneAndUpdate(
    { userId },
    {
      usage: new Map(),
      quotaResetDate: newPeriodEnd,
      stripeCurrentPeriodEnd: newPeriodEnd,
      dateUpdated: new Date()
    },
    { new: true }
  );
}

// Helper function to check and reset expired quotas
export async function checkAndResetExpiredQuotas(): Promise<void> {
  const now = new Date();
  
  // Find all quotas that need reset
  const expiredQuotas = await UserQuotaModel.find({
    quotaResetDate: { $lte: now }
  });

  // Reset each expired quota
  for (const quota of expiredQuotas) {
    await resetQuota(quota.userId, 
      quota.stripeCurrentPeriodEnd || new Date(now.setDate(now.getDate() + 30))
    );
  }
}

export const UserQuotaModel: Model<UserQuota> = mongoose.models.UserQuota || mongoose.model<UserQuota>('UserQuota', UserQuotaSchema); 