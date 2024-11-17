import mongoose, { Document, Schema, Model } from 'mongoose';

export interface UserQuota extends Document {
  userId: string;
  usage: {
    [serviceKey: string]: number;
  };
  dateCreated: Date;
  dateUpdated: Date;
  quotaResetDate: Date;
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
  quotaResetDate: { type: Date, default: () => {
    // Set to 30 days from today
    const now = new Date();
    return new Date(now.setDate(now.getDate() + 30));
  }}
});

// Helper function to create initial quota
export async function createInitialQuota(userId: string): Promise<UserQuota> {
  return await UserQuotaModel.create({
    userId,
    usage: new Map(),
    quotaResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
  });
}

export const UserQuotaModel: Model<UserQuota> = mongoose.models.UserQuota || mongoose.model<UserQuota>('UserQuota', UserQuotaSchema); 