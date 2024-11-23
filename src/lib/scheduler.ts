// "use server"

// import schedule from 'node-schedule'
// import { UserQuotaModel } from '@/models/UserQuota'
// import { Logger } from '@/lib/logger'

// export async function srv_resetAllQuotas() {
//   try {
//     // Find all quotas where resetDate has passed
//     const result = await UserQuotaModel.updateMany(
//       { 
//         quotaResetDate: { 
//           $lte: new Date() // Find documents where reset date is less than or equal to now
//         }
//       },
//       {
//         $set: {
//           usage: {},
//           quotaResetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
//           dateUpdated: new Date()
//         }
//       }
//     );

//     if (result.modifiedCount > 0) {
//       await Logger.info('Monthly quota reset completed', {
//         documentsUpdated: result.modifiedCount,
//         nextResetDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
//       });
//     }

//     return true;
//   } catch (error) {
//     await Logger.error('Failed to reset monthly quotas', {
//       error: error instanceof Error ? error.message : 'Unknown error',
//       stack: error instanceof Error ? error.stack : undefined
//     });
//     return false;
//   }
// }

// // Schedule the reset to run at midnight (00:00) every day
// export async function srv_initQuotaResetSchedule() {
//   // '0 0 * * *' = At 00:00 every day
//   schedule.scheduleJob('0 0 * * *', async () => {
//     await srv_resetAllQuotas();
//   });

//   Logger.info('Quota reset scheduler initialized', {
//     schedule: '0 0 * * *',
//     description: 'Daily quota check scheduled for midnight'
//   });
// }