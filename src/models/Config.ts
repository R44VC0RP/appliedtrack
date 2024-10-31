import mongoose, { Document, Schema, Model } from 'mongoose';

interface TierLimits {
  jobs: number;
  coverLetters: number;
  contactEmails: number;
}

export interface Config extends Document {
  tierLimits: {
    free: TierLimits;
    pro: TierLimits;
    power: TierLimits;
  };
  dateCreated: Date;
  dateUpdated: Date;
}

const TierLimitsSchema = new Schema({
  jobs: { type: Number, required: true },
  coverLetters: { type: Number, required: true },
  contactEmails: { type: Number, required: true }
});

const ConfigSchema: Schema = new Schema({
  tierLimits: {
    free: { type: TierLimitsSchema, required: true },
    pro: { type: TierLimitsSchema, required: true },
    power: { type: TierLimitsSchema, required: true }
  },
  dateCreated: { type: Date, default: Date.now },
  dateUpdated: { type: Date, default: Date.now }
});

export const ConfigModel: Model<Config> = mongoose.models.Config || mongoose.model<Config>('Config', ConfigSchema); 