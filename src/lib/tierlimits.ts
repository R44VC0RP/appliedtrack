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
      action: 'GET_TIER_CONFIG',
      location: new Error().stack?.split('\n')[1]?.trim()
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
        error: 'User or config not found',
        location: new Error().stack?.split('\n')[1]?.trim()
      });
      return false;
    }

    const services = typeof config.services === 'string' ? JSON.parse(config.services) : config.services;
    
    if (!services || typeof services !== 'object') {
      console.error('Invalid services object:', services);
      return false;
    }
    
    const service = services[serviceKey];
    if (!service || service.active === false) {
      console.error('Invalid or inactive service', serviceKey, services);
      return false;
    }

    const tierLimitsJson = config.tierLimits;
    const tierLimits = typeof tierLimitsJson === 'string' ? JSON.parse(tierLimitsJson) : tierLimitsJson;
    
    if (!tierLimits || typeof tierLimits !== 'object') {
      console.error('Invalid tierLimits object:', tierLimitsJson);
      return false;
    }

    const userTier = user.tier || 'free';
    const tierConfig = tierLimits[userTier];
    
    if (!tierConfig || typeof tierConfig !== 'object') {
      console.error('Invalid tier configuration for tier:', userTier, 'available tiers:', Object.keys(tierLimits));
      return false;
    }

    const serviceLimit = tierConfig[serviceKey]?.limit ?? 0;

    const userQuota = await prisma.userQuota.findUnique({
      where: { userId },
      include: { quotaUsage: true }
    });

    const quotaUsage = userQuota?.quotaUsage.find(u => u.quotaKey === serviceKey);
    const currentUsage = quotaUsage?.usageCount || 0;

    console.log('Current usage:', currentUsage);
    console.log('Amount:', amount);
    
    if (serviceLimit !== -1 && (currentUsage + amount) > serviceLimit) {
      console.error(`Usage would exceed service limit for ${serviceKey}, current usage: ${currentUsage}, amount: ${amount}, service limit: ${serviceLimit}`);
      return false;
    }

    if (userQuota) {
      if (quotaUsage) {
        // Increment the user quota
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
            quotaKey: serviceKey,
            usageCount: amount,
            userQuotaId: userQuota.id
          }
        });
      }
    } else {
      await prisma.userQuota.create({
        data: {
          userId,
          quotaResetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          quotaUsage: {
            create: {
              quotaKey: serviceKey,
              usageCount: amount
            }
          }
        }
      });
    }
    
    return true;

  } catch (error) {
    await Logger.error('Error updating service usage', {
      userId,
      serviceKey,
      amount,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      location: new Error().stack?.split('\n')[1]?.trim()
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

    const tierLimitsJson = config.tierLimits;
    const tierLimits = typeof tierLimitsJson === 'string' ? JSON.parse(tierLimitsJson) : tierLimitsJson;
    
    if (!tierLimits || typeof tierLimits !== 'object') {
      console.error('Invalid tierLimits object:', tierLimitsJson);
      return null;
    }

    const userTier = user.tier || 'free';
    const tierConfig = tierLimits[userTier];
    
    if (!tierConfig || typeof tierConfig !== 'object') {
      console.error('Invalid tier configuration for tier:', userTier, 'available tiers:', Object.keys(tierLimits));
      return null;
    }

    const serviceLimit = tierConfig[serviceKey]?.limit ?? 0;
    
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
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      location: new Error().stack?.split('\n')[1]?.trim()
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
      count: users.length,
      location: new Error().stack?.split('\n')[1]?.trim()
    });
  } catch (error) {
    await Logger.error('Error resetting quotas', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      location: new Error().stack?.split('\n')[1]?.trim()
    });
  }
}

export async function srv_decrementServiceUsage(userId: string, serviceKey: string, amount: number = 1): Promise<boolean> {
  try {
    const userQuota = await prisma.userQuota.findUnique({
      where: { userId },
      include: { quotaUsage: true }
    });

    if (!userQuota) {
      await Logger.error('Failed to find user quota for decrement', {
        userId,
        serviceKey,
        error: 'User quota not found',
        location: new Error().stack?.split('\n')[1]?.trim()
      });
      return false;
    }

    const quotaUsage = userQuota.quotaUsage.find(u => u.quotaKey === serviceKey);
    
    if (!quotaUsage) {
      await Logger.warning('No quota usage found to decrement', {
        userId,
        serviceKey,
        location: new Error().stack?.split('\n')[1]?.trim()
      });
      return false;
    }

    const newUsage = Math.max(0, quotaUsage.usageCount - amount);

    await prisma.quotaUsage.update({
      where: { id: quotaUsage.id },
      data: {
        usageCount: newUsage,
        dateUpdated: new Date()
      }
    });

    await Logger.info('Service usage decremented', {
      userId,
      serviceKey,
      previousUsage: quotaUsage.usageCount,
      newUsage,
      amount,
      location: new Error().stack?.split('\n')[1]?.trim()
    });

    return true;
  } catch (error) {
    await Logger.error('Error decrementing service usage', {
      userId,
      serviceKey,
      amount,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      location: new Error().stack?.split('\n')[1]?.trim()
    });
    return false;
  }
}

// Schedule the reset to run at midnight (00:00) on the first day of each month
export async function initQuotaResetSchedule() {
  // '0 0 1 * *' = At 00:00 on day-of-month 1
  schedule.scheduleJob('0 0 1 * *', async () => {
    await srv_resetAllQuotas();
  });
}