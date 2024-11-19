"use server";

import { Logger } from './logger';
import { UserModel } from '@/models/User';
import { UserQuotaModel } from '@/models/UserQuota';
import { plain } from './plain';

interface TierLimits {
  maxApplications: number;
  maxNotes: number;
  maxDocuments: number;
}

const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    maxApplications: 25,
    maxNotes: 100,
    maxDocuments: 5
  },
  pro: {
    maxApplications: 100,
    maxNotes: 500,
    maxDocuments: 25
  },
  power: {
    maxApplications: 1000,
    maxNotes: 5000,
    maxDocuments: 100
  }
};

export async function canDowngradeTier(userId: string, newTier: 'free' | 'pro' | 'power'): Promise<{ 
  canDowngrade: boolean; 
  reason?: string;
  currentUsage?: {
    applications: number;
    notes: number;
    documents: number;
  }
}> {
  try {
    // Get current usage
    const quota = await UserQuotaModel.findOne({ userId });
    if (!quota) {
      await Logger.warning('No quota found for user during downgrade check', { userId });
      return { canDowngrade: true };
    }

    // Convert mongoose document to plain object
    const plainQuota = plain(quota);
    const usage = plainQuota.usage || {};

    const currentUsage = {
      applications: Number(usage.applications || 0),
      notes: Number(usage.notes || 0),
      documents: Number(usage.documents || 0)
    };

    const newLimits = TIER_LIMITS[newTier];

    // Check if current usage exceeds new tier limits
    if (currentUsage.applications > newLimits.maxApplications) {
      return {
        canDowngrade: false,
        reason: `You have ${currentUsage.applications} applications, but ${newTier} tier only allows ${newLimits.maxApplications}`,
        currentUsage
      };
    }

    if (currentUsage.notes > newLimits.maxNotes) {
      return {
        canDowngrade: false,
        reason: `You have ${currentUsage.notes} notes, but ${newTier} tier only allows ${newLimits.maxNotes}`,
        currentUsage
      };
    }

    if (currentUsage.documents > newLimits.maxDocuments) {
      return {
        canDowngrade: false,
        reason: `You have ${currentUsage.documents} documents, but ${newTier} tier only allows ${newLimits.maxDocuments}`,
        currentUsage
      };
    }

    await Logger.info('User can safely downgrade tier', {
      userId,
      newTier,
      currentUsage
    });

    return { 
      canDowngrade: true,
      currentUsage
    };
  } catch (error) {
    await Logger.error('Error checking tier downgrade eligibility', {
      userId,
      newTier,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export async function enforceQuotaLimits(userId: string): Promise<boolean> {
  try {
    const user = await UserModel.findOne({ userId });
    if (!user) {
      await Logger.error('User not found while enforcing quota limits', { userId });
      return false;
    }

    const quota = await UserQuotaModel.findOne({ userId });
    if (!quota) {
      await Logger.warning('No quota found while enforcing limits', { userId });
      return true;
    }

    // Convert mongoose document to plain object
    const plainQuota = plain(quota);
    const usage = plainQuota.usage || {};

    const currentUsage = {
      applications: Number(usage.applications || 0),
      notes: Number(usage.notes || 0),
      documents: Number(usage.documents || 0)
    };

    const limits = TIER_LIMITS[user.tier];

    // Log if any limits are exceeded
    if (currentUsage.applications > limits.maxApplications ||
        currentUsage.notes > limits.maxNotes ||
        currentUsage.documents > limits.maxDocuments) {
      await Logger.warning('User exceeding tier limits', {
        userId,
        tier: user.tier,
        limits,
        currentUsage
      });
      return false;
    }

    return true;
  } catch (error) {
    await Logger.error('Error enforcing quota limits', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

export interface SubscriptionStatus {
  tier: 'free' | 'pro' | 'power';
  isCanceled: boolean;
  currentPeriodEnd?: Date;
}

export async function getSubscriptionStatusDisplay(status: SubscriptionStatus): Promise<string> {
  if (status.tier === 'free') {
    return 'Free';
  }

  if (status.isCanceled && status.currentPeriodEnd) {
    const endDate = new Date(status.currentPeriodEnd);
    const formattedDate = endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    return `${status.tier.charAt(0).toUpperCase() + status.tier.slice(1)} (Cancels on ${formattedDate})`;
  }

  return status.tier.charAt(0).toUpperCase() + status.tier.slice(1);
}
