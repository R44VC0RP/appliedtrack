"use server"

import { ConfigModel } from '@/models/Config';
import { Logger } from '@/lib/logger';
import { UserModel } from '@/models/User';
import { UserQuotaModel } from '@/models/UserQuota';
import schedule from 'node-schedule'

interface TierResponse {
  tierLimits?: Record<string, any>;
  error?: string;
}

interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
}

export async function fetchTierLimits(): Promise<TierResponse> {
  try {
    const config = await ConfigModel.findOne({}, {
      tierLimits: 1,
      _id: 0
    }).lean();

    if (!config) {
      return { error: 'Tier configuration not found' };
    }
    return { tierLimits: config.tierLimits };
  } catch (error) {
    console.log('error', error)
    await Logger.error('Error fetching tier configuration', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'GET_TIER_CONFIG'
    });

    return { error: 'Internal server error' };
  }
}

export async function srv_addServiceUsage(userId: string, serviceKey: string, amount: number = 1): Promise<boolean> {
  try {
    const user = await UserModel.findById(userId).lean();
    const config = await ConfigModel.findOne({}).lean();
    
    if (!user || !config) {
      await Logger.error('Failed to fetch user or config for usage update', {
        userId,
        serviceKey,
        error: 'User or config not found'
      });
      return false;
    }

    // Check if service exists and is active
    const service = config.services[serviceKey];
    if (!service || !service.active) {
      await Logger.error('Invalid or inactive service', {
        userId,
        serviceKey
      });
      return false;
    }

    const tierLimits = config.tierLimits[user.tier || 'free'];
    const serviceLimit = tierLimits[serviceKey]?.limit ?? 0;
    
    // Get or create user quota
    let userQuota = await UserQuotaModel.findOne({ userId });
    if (!userQuota) {
      userQuota = await UserQuotaModel.create({ 
        userId,
        usage: {},
        quotaResetDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
      });
    }

    const currentUsage = userQuota.usage[serviceKey] || 0;
    
    // Check if increment is allowed (-1 means unlimited)
    if (serviceLimit !== -1 && (currentUsage + amount) > serviceLimit) {
      await Logger.warning('Usage limit exceeded', {
        userId,
        serviceKey,
        currentUsage,
        attemptedAmount: amount,
        serviceLimit
      });
      return false;
    }

    // Increment usage
    userQuota.usage[serviceKey] = currentUsage + amount;
    userQuota.dateUpdated = new Date();
    await userQuota.save();
    
    return true;

  } catch (error) {
    await Logger.error('Error updating service usage', {
      userId,
      serviceKey,
      amount,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

export async function srv_getServiceQuota(userId: string, serviceKey: string): Promise<QuotaInfo | null> {
  try {
    const user = await UserModel.findById(userId).lean();
    const config = await ConfigModel.findOne({}).lean();
    const userQuota = await UserQuotaModel.findOne({ userId }).lean();
    
    if (!user || !config) {
      await Logger.error('Failed to fetch user or config for quota check', {
        userId,
        serviceKey
      });
      return null;
    }

    const service = config.services[serviceKey];
    if (!service || !service.active) {
      await Logger.error('Invalid or inactive service for quota check', {
        userId,
        serviceKey
      });
      return null;
    }

    const tierLimits = config.tierLimits[user.tier || 'free'];
    const serviceLimit = tierLimits[serviceKey]?.limit ?? 0;
    const used = (userQuota?.usage[serviceKey] || 0);
    
    return {
      used,
      limit: serviceLimit,
      remaining: serviceLimit === -1 ? -1 : Math.max(0, serviceLimit - used)
    };

  } catch (error) {
    await Logger.error('Error fetching service quota', {
      userId,
      serviceKey,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}

export async function srv_resetAllQuotas() {
  try {
    const result = await UserQuotaModel.updateMany(
      {}, // match all documents
      {
        $set: {
          usage: {},
          quotaResetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          dateUpdated: new Date()
        }
      }
    );

    await Logger.info('Monthly quota reset completed', {
      documentsUpdated: result.modifiedCount,
      nextResetDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
    });

    return true;
  } catch (error) {
    await Logger.error('Failed to reset monthly quotas', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

// Schedule the reset to run at midnight (00:00) on the first day of each month
export function initQuotaResetSchedule() {
  // '0 0 1 * *' = At 00:00 on day-of-month 1
  schedule.scheduleJob('0 0 1 * *', async () => {
    await srv_resetAllQuotas();
  });

  Logger.info('Quota reset scheduler initialized', {
    schedule: '0 0 1 * *',
    description: 'Monthly quota reset scheduled for midnight on the first of each month'
  });
}