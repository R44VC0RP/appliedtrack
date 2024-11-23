import mongoose, { Document, Schema } from 'mongoose';

interface Campaign extends Document {
  name: string;
  ref: string;
  description?: string;
  visits: number;
  signups: number;
  dateCreated: Date;
  dateUpdated: Date;
  isActive: boolean;
}

const CampaignSchema = new Schema<Campaign>({
  name: { type: String, required: true },
  ref: { type: String, required: true, unique: true },
  description: { type: String },
  visits: { type: Number, default: 0 },
  signups: { type: Number, default: 0 },
  dateCreated: { type: Date, default: Date.now },
  dateUpdated: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

const CampaignModel = mongoose.models.Campaign || mongoose.model<Campaign>('Campaign', CampaignSchema); 