// import mongoose, { Document, Schema } from 'mongoose';

// export interface WaitlistUser extends Document {
//   email: string;
//   dateSignedUp: Date;
//   isNotified: boolean;
//   source?: string;
// }

// const WaitlistUserSchema = new Schema<WaitlistUser>({
//   email: { 
//     type: String, 
//     required: true, 
//     unique: true,
//     lowercase: true,
//     trim: true 
//   },
//   dateSignedUp: { 
//     type: Date, 
//     default: Date.now 
//   },
//   isNotified: { 
//     type: Boolean, 
//     default: false 
//   },
//   source: { 
//     type: String,
//     default: 'website' 
//   }
// });

// export const WaitlistUserModel = mongoose.models.WaitlistUser || mongoose.model<WaitlistUser>('WaitlistUser', WaitlistUserSchema);
