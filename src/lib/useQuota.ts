import { UserTier, UserQuota } from '@prisma/client';
import { Logger } from './logger';
import { prisma } from './prisma';



interface QuotaNotification {
  type: 'warning' | 'exceeded';
  quotaKey: string;
  currentUsage: number;
  limit: number;
  message: string;
}

interface QuotaResetOptions {
  userId: string;
  tier: UserTier;
  resetDate?: Date;
}

export async function notifyQuotaStatus(notifications: QuotaNotification[]): Promise<void> {
  // TODO: Implement notification system (email, in-app, etc.)
  console.log('Quota notifications:', notifications);
}

export async function checkQuotaLimits(userId: string, tier: UserTier): Promise<QuotaNotification[]> {
  try {
    // Get user quota and config in parallel
    const [userQuota, config] = await Promise.all([
      prisma.userQuota.findUnique({
        where: { userId },
        include: { quotaUsage: true }
      }),
      prisma.config.findFirst()
    ]);

    if (!userQuota || !config?.tierLimits) {
      return [];
    }

    // Type assertion for the JSON field
    const tierLimits = config.tierLimits as Record<string, Record<string, { limit: number }>>;
    const limits = tierLimits[tier];

    if (!limits) {
      return [];
    }

    const notifications: QuotaNotification[] = [];

    // Check each quota usage against limits
    for (const usage of userQuota.quotaUsage) {
      const limit = limits[usage.quotaKey]?.limit;
      if (!limit) continue;

      const usagePercent = (usage.usageCount / limit) * 100;
      
      if (usage.usageCount >= limit) {
        notifications.push({
          type: 'exceeded',
          quotaKey: usage.quotaKey,
          currentUsage: usage.usageCount,
          limit,
          message: `You have exceeded your ${usage.quotaKey} quota limit.`
        });
      } else if (usagePercent >= 80) {
        notifications.push({
          type: 'warning',
          quotaKey: usage.quotaKey,
          currentUsage: usage.usageCount,
          limit,
          message: `You are approaching your ${usage.quotaKey} quota limit (${usagePercent.toFixed(1)}% used).`
        });
      }
    }

    // Update notifications in the database
    if (notifications.length > 0) {
      await prisma.userQuota.update({
        where: { userId },
        data: {
          notifications: {
            createMany: {
              data: notifications.map(notification => ({
                type: notification.type,
                quotaKey: notification.quotaKey,
                currentUsage: notification.currentUsage,
                limit: notification.limit,
                message: notification.message
              }))
            }
          }
        }
      });
    }

    return notifications;
  } catch (error) {
    console.error('Error checking quota limits:', error);
    throw error;
  }
}

export async function createInitialQuota(userId: string, periodEnd?: Date) {
  try {
    // Get config to determine initial quotas
    const config = await prisma.config.findFirst();
    if (!config) {
      throw new Error('Config not found');
    }

    // Get user to determine their tier
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Parse tier limits from config
    const tierLimits = config.tierLimits as Record<string, Record<string, { limit: number }>>;
    const userTierLimits = tierLimits[user.tier];
    
    if (!userTierLimits) {
      throw new Error(`No tier limits found for tier: ${user.tier}`);
    }

    // Create quota with initial usage entries for all services
    const quota = await prisma.userQuota.create({
      data: {
        userId,
        quotaResetDate: periodEnd || new Date(new Date().setDate(new Date().getDate() + 30)),
        stripeCurrentPeriodEnd: periodEnd,
        quotaUsage: {
          create: Object.keys(userTierLimits).map(quotaKey => ({
            quotaKey,
            usageCount: 0
          }))
        }
      },
      include: {
        quotaUsage: true,
        notifications: true
      }
    });

    await Logger.info('Created initial quota', {
      userId,
      quotaId: quota.id,
      tier: user.tier,
      services: Object.keys(userTierLimits)
    });

    return quota;
  } catch (error) {
    await Logger.error('Failed to create initial quota', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function resetQuota({ userId, tier, resetDate }: QuotaResetOptions): Promise<UserQuota> {
  try {
    // Get current quota to preserve JOBS_COUNT
    const currentQuota = await prisma.userQuota.findUnique({
      where: { userId },
      include: { quotaUsage: true }
    });

    if (!currentQuota) {
      throw new Error('User quota not found');
    }

    // Find the JOBS_COUNT usage if it exists
    const jobsCountUsage = currentQuota.quotaUsage.find(usage => usage.quotaKey === 'JOBS_COUNT');

    // Delete all existing quota usage except JOBS_COUNT
    await prisma.quotaUsage.deleteMany({
      where: {
        userQuotaId: currentQuota.id,
        quotaKey: { not: 'JOBS_COUNT' }
      }
    });

    // Update the quota with new reset date
    const updatedQuota = await prisma.userQuota.update({
      where: { userId },
      data: {
        quotaResetDate: resetDate || new Date(new Date().setDate(new Date().getDate() + 30)),
        quotaUsage: {
          create: jobsCountUsage ? [{ quotaKey: 'JOBS_COUNT', usageCount: jobsCountUsage.usageCount }] : []
        }
      },
      include: {
        quotaUsage: true,
        notifications: true
      }
    });

    await Logger.info('Reset quota successfully', {
      userId,
      quotaId: updatedQuota.id,
      resetDate: updatedQuota.quotaResetDate,
      preservedJobsCount: jobsCountUsage?.usageCount
    });

    return updatedQuota;
  } catch (error) {
    await Logger.error('Failed to reset quota', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}