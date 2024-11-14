import mongoose, { Document, Schema, Model } from 'mongoose';

export interface UserQuota extends Document {
  userId: string;
  emailsUsed: number;
  aiCoverLettersUsed: number;
  aiResumesUsed: number;
  dateCreated: Date;
  dateUpdated: Date;
  quotaResetDate: Date;
}

const UserQuotaSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  emailsUsed: { type: Number, default: 0 },
  aiCoverLettersUsed: { type: Number, default: 0 },
  aiResumesUsed: { type: Number, default: 0 },
  dateCreated: { type: Date, default: Date.now },
  dateUpdated: { type: Date, default: Date.now },
  quotaResetDate: { type: Date, required: true }
});

export const UserQuotaModel: Model<UserQuota> = mongoose.models.UserQuota || mongoose.model<UserQuota>('UserQuota', UserQuotaSchema); 