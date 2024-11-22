import mongoose, { Document, Schema, Model } from 'mongoose';

interface QuotaLimit {
  limit: number;
  description?: string;
}

 interface ServiceConfig {
  name: string;
  description: string;
  active: boolean;
}

 interface TierLimits {
  [serviceKey: string]: QuotaLimit;
}

 interface ConfigData {
  tierLimits: {
    [tier: string]: TierLimits;
  };
  services: {
    [key: string]: ServiceConfig;
  };
  dateCreated: Date;
  dateUpdated: Date;
}

 interface Config extends Document, ConfigData {}

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

 const ConfigModel: Model<Config> = mongoose.models.Config || mongoose.model<Config>('Config', ConfigSchema); 