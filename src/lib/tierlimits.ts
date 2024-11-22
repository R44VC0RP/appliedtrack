"use server"

import { Logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { QuotaUsage } from '@prisma/client';
import schedule from 'node-schedule';

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
    const config = await prisma.config.findFirst({
      select: {
        tierLimits: true
      }
    });

    if (!config) {
      return { error: 'Tier configuration not found' };
    }
    return { tierLimits: config.tierLimits as Record<string, any> };
  } catch (error) {
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
    const [user, config] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.config.findFirst()
    ]);
    
    if (!user || !config) {
      await Logger.error('Failed to fetch user or config for usage update', {
        userId,
        serviceKey,
        error: 'User or config not found'
      });
      return false;
    }

    // Check if service exists and is active
    const services = config.services as Record<string, { active: boolean }>;
    const service = services[serviceKey];
    if (!service || !service.active) {
      await Logger.error('Invalid or inactive service', {
        userId,
        serviceKey
      });
      return false;
    }

    const tierLimits = (config.tierLimits as Record<string, any>)[user.tier || 'free'];
    const serviceLimit = tierLimits[serviceKey]?.limit ?? 0;
    
    // Get or create user quota and its usage
    const userQuota = await prisma.userQuota.upsert({
      where: { userId },
      create: {
        userId,
        quotaResetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        quotaUsage: {
          create: {
            quotaKey: serviceKey,
            usageCount: amount
          }
        }
      },
      update: {},
      include: {
        quotaUsage: true
      }
    });

    const quotaUsage = userQuota.quotaUsage.find(u => u.quotaKey === serviceKey);
    const currentUsage = quotaUsage?.usageCount || 0;
    
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
    if (quotaUsage) {
      await prisma.quotaUsage.update({
        where: { id: quotaUsage.id },
        data: {
          usageCount: currentUsage + amount,
          dateUpdated: new Date()
        }
      });
    } else {
      await prisma.quotaUsage.create({
        data: {
          userQuotaId: userQuota.id,
          quotaKey: serviceKey,
          usageCount: amount
        }
      });
    }
    
    return true;

  } catch (error) {
    await Logger.error('Error updating service usage', {
      userId,
      serviceKey,
      amount,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

export async function srv_getServiceQuota(userId: string, serviceKey: string): Promise<QuotaInfo | null> {
  try {
    const [user, config, userQuota] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.config.findFirst(),
      prisma.userQuota.findUnique({
        where: { userId },
        include: {
          quotaUsage: true
        }
      })
    ]);

    if (!user || !config) {
      return null;
    }

    const tierLimits = (config.tierLimits as Record<string, any>)[user.tier || 'free'];
    const serviceLimit = tierLimits[serviceKey]?.limit ?? 0;
    
    const quotaUsage = userQuota?.quotaUsage.find(u => u.quotaKey === serviceKey);
    const used = quotaUsage?.usageCount || 0;
    
    return {
      used,
      limit: serviceLimit,
      remaining: serviceLimit === -1 ? -1 : Math.max(0, serviceLimit - used)
    };

  } catch (error) {
    await Logger.error('Error fetching service quota', {
      userId,
      serviceKey,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}

export async function srv_resetAllQuotas(): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      include: {
        userQuota: true
      }
    });

    for (const user of users) {
      if (user.userQuota) {
        // Delete all quota usage records
        await prisma.quotaUsage.deleteMany({
          where: { userQuotaId: user.userQuota.id }
        });
        
        // Update the reset date
        await prisma.userQuota.update({
          where: { id: user.userQuota.id },
          data: {
            quotaResetDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
          }
        });
      }
    }

    await Logger.info('Successfully reset all user quotas', {
      count: users.length
    });
  } catch (error) {
    await Logger.error('Error resetting quotas', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Schedule the reset to run at midnight (00:00) on the first day of each month
export async function initQuotaResetSchedule() {
  // '0 0 1 * *' = At 00:00 on day-of-month 1
  schedule.scheduleJob('0 0 1 * *', async () => {
    await srv_resetAllQuotas();
  });
}