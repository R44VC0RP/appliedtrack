import mongoose, { Document, Schema, Model } from 'mongoose';

export interface WebhookEvent extends Document {
  eventId: string;
  type: string;
  processed: boolean;
  retryCount: number;
  lastAttempt: Date;
  dateCreated: Date;
  error?: string;
  metadata?: any;
}

const WebhookEventSchema = new Schema({
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  processed: { type: Boolean, default: false },
  retryCount: { type: Number, default: 0 },
  lastAttempt: { type: Date, default: Date.now },
  dateCreated: { type: Date, default: Date.now },
  error: { type: String },
  metadata: { type: Schema.Types.Mixed }
});

// Indexes for performance
WebhookEventSchema.index({ eventId: 1 }, { unique: true });
WebhookEventSchema.index({ processed: 1, retryCount: 1 });

export const WebhookEventModel: Model<WebhookEvent> = 
  mongoose.models.WebhookEvent || 
  mongoose.model<WebhookEvent>('WebhookEvent', WebhookEventSchema);
