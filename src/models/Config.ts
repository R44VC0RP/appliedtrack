import mongoose, { Document, Schema, Model } from 'mongoose';

interface QuotaLimit {
  limit: number;
  description?: string;
}

export interface ServiceConfig {
  name: string;
  description: string;
  active: boolean;
}

export interface TierLimits {
  [serviceKey: string]: QuotaLimit;
}

export interface ConfigData {
  tierLimits: {
    [tier: string]: TierLimits;
  };
  services: {
    [key: string]: ServiceConfig;
  };
  dateCreated: Date;
  dateUpdated: Date;
}

export interface Config extends Document, ConfigData {}

const ConfigSchema: Schema = new Schema({
  tierLimits: {
    type: Map,
    of: {
      type: Map,
      of: {
        limit: Number,
        description: String
      }
    },
    required: true
  },
  services: {
    type: Map,
    of: {
      name: String,
      description: String,
      active: { type: Boolean, default: true }
    },
    required: true
  },
  dateCreated: { type: Date, default: Date.now },
  dateUpdated: { type: Date, default: Date.now }
});

export const ConfigModel: Model<Config> = mongoose.models.Config || mongoose.model<Config>('Config', ConfigSchema); 