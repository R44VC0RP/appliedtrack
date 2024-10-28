import mongoose, { Document, Schema, Model } from 'mongoose';

export interface User extends Document {
  userId: string;
  tier: 'free' | 'premium' | 'enterprise';
  role: 'user' | 'admin';
  about: string;
  dateCreated: Date;
  dateUpdated: Date;
  stripeCustomerId: string;
  subscriptionId: string;

}

const UserSchema: Schema = new Schema({
  userId: { type: String, required: true, unique: true },
  tier: { 
    type: String, 
    required: true, 
    enum: ['free', 'premium', 'enterprise'],
    default: 'free'
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'admin'],
    default: 'user'
  },
  about: { type: String, default: '' },
  dateCreated: { type: Date, default: Date.now },
  dateUpdated: { type: Date, default: Date.now },
  stripeCustomerId: { type: String },
  subscriptionId: { type: String },
});

// Check if the model already exists before compiling
export const UserModel: Model<User> = mongoose.models.User || mongoose.model<User>('User', UserSchema);
