// // import mongoose, { Document, Schema, Model } from 'mongoose';
// import { QuotaNotification, UserTier, QuotaResetOptions } from '@/types/subscription';
// // import { ConfigModel } from './Config';

// interface UserQuota extends Document {
//   userId: string;
//   usage: {
//     [key: string]: number;
//   };
//   dateCreated: Date;
//   dateUpdated: Date;
//   quotaResetDate: Date;
//   stripeCurrentPeriodEnd?: Date;
//   notifications: QuotaNotification[];
// }

// const UserQuotaSchema = new Schema({
//   userId: { type: String, required: true, unique: true },
//   usage: {
//     type: Object,
//     default: () => ({})
//   },
//   dateCreated: { type: Date, default: Date.now },
//   dateUpdated: { type: Date, default: Date.now },
//   quotaResetDate: { type: Date, required: true },
//   stripeCurrentPeriodEnd: { type: Date },
//   notifications: [{
//     type: {
//       type: String,
//       enum: ['warning', 'exceeded'],
//       required: true
//     },
//     quotaKey: String,
//     currentUsage: Number,
//     limit: Number,
//     message: String
//   }]
// });

// // Helper function to create initial quota

// // Helper function to reset quota based on tier
// export async function resetQuota({ userId, tier, resetDate }: QuotaResetOptions): Promise<UserQuota | null> {
//   // Special handling for JOBS_COUNT - preserve its value
//   const currentQuota = await UserQuotaModel.findOne({ userId });
//   const jobsCount = currentQuota?.usage?.JOBS_COUNT ?? 0;
  
//   const newUsage: { [key: string]: number } = {};
//   if (jobsCount > 0) {
//     newUsage['JOBS_COUNT'] = jobsCount;
//   }

//   return await UserQuotaModel.findOneAndUpdate(
//     { userId },
//     {
//       $set: {
//         usage: newUsage,
//         quotaResetDate: resetDate || new Date(new Date().setDate(new Date().getDate() + 30)),
//         dateUpdated: new Date()
//       }
//     },
//     { new: true }
//   );
// }

// // Helper function to check quota limits and generate notifications


// // Placeholder for future notification implementation


// const UserQuotaModel: Model<UserQuota> = mongoose.models.UserQuota || mongoose.model<UserQuota>('UserQuota', UserQuotaSchema);