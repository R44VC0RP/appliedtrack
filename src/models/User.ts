import mongoose, { Document, Schema, Model } from 'mongoose';

export interface User extends Document {
  userId: string;
  tier: 'free' | 'pro' | 'power';
  role: 'user' | 'admin';
  about: string;
  dateCreated: Date;
  dateUpdated: Date;
  stripeCustomerId: string;
  subscriptionId: string;
  subscriptionStatus?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: Date;
  onBoardingComplete: boolean;
  quotas?: {
    usage: { [key: string]: number };
    quotaResetDate: Date;
    notifications: Array<{
      type: 'warning' | 'exceeded';
      quotaKey: string;
      currentUsage: number;
      limit: number;
      message: string;
    }>;
  };
}

const UserSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true },
  tier: { 
    type: String, 
    required: true, 
    enum: ['free', 'pro', 'power'],
    default: 'free'
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'admin'],
    default: 'user'
  },
  onBoardingComplete: { type: Boolean, default: false },
  about: { type: String, default: '' },
  dateCreated: { type: Date, default: Date.now },
  dateUpdated: { type: Date, default: Date.now },
  stripeCustomerId: { type: String },
  subscriptionId: { type: String },
  subscriptionStatus: { type: String },
  cancelAtPeriodEnd: { type: Boolean },
  currentPeriodEnd: { type: Date }
});

// Check if the model already exists before compiling
export const UserModel: Model<User> = mongoose.models.User || mongoose.model<User>('User', UserSchema);
