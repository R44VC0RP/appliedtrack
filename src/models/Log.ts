import mongoose, { Schema, Document } from 'mongoose';

export interface ILog extends Document {
  level: 'info' | 'warning' | 'error';
  action: string;
  userId?: string;
  details: any;
  metadata?: Record<string, any>;
  timestamp: Date;
  service: string;
  ip?: string;
}

const LogSchema = new Schema<ILog>({
  level: {
    type: String,
    required: true,
    enum: ['info', 'warning', 'error']
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    index: true
  },
  details: Schema.Types.Mixed,
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  service: {
    type: String,
    required: true,
    index: true
  },
  ip: String
});

export const LogModel = mongoose.models.Log || mongoose.model<ILog>('Log', LogSchema); 