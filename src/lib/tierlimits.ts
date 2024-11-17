import { ConfigModel } from '@/models/Config';
import { Logger } from '@/lib/logger';
import { UserModel } from '@/models/User';
import { UserQuotaModel } from '@/models/UserQuota';

interface TierResponse {
  tierLimits?: Record<string, any>;
  error?: string;
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

export async function srv_addUsage(userId: string, action: "AIRESUMERATING" | "HUNTERDOMAINSEARCH" | "AIRESUMEGENERATION" | "AICOVERLETTERGENERATION", amount: number) {
  try {
    // Get user's tier and tier limits
    const user = await UserModel.findById(userId).lean();
    const tierConfig = await ConfigModel.findOne({}).lean();
    
    if (!user || !tierConfig) {
      await Logger.error('Failed to fetch user or tier config', {
        userId,
        action,
        error: 'User or config not found'
      });
      return false;
    }

    const tierLimits = tierConfig.tierLimits[user.tier || 'free'];
    
    // Get or create user quota
    let userQuota = await UserQuotaModel.findOne({ userId });
    if (!userQuota) {
      userQuota = await UserQuotaModel.create({ 
        userId, 
        aiCoverLettersUsed: 0, 
        aiResumesUsed: 0, 
        aiResumeRatingsUsed: 0, 
        emailsUsed: 0,
        quotaResetDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
      });
    }

    // Check limits and increment if allowed
    let canIncrement = false;
    switch (action) {
      case "AIRESUMERATING":
      case "AIRESUMEGENERATION":
        canIncrement = (userQuota.aiResumesUsed + amount) <= tierLimits.jobs;
        break;
      case "HUNTERDOMAINSEARCH":
        canIncrement = (userQuota.emailsUsed + amount) <= tierLimits.contactEmails;
        break;
      case "AICOVERLETTERGENERATION":
        canIncrement = (userQuota.aiCoverLettersUsed + amount) <= tierLimits.coverLetters;
        break;
    }

    if (!canIncrement) {
      await Logger.warning('Usage limit reached', {
        userId,
        action,
        currentUsage: userQuota.toJSON(),
        tierLimits
      });
      return false;
    }

    // Increment usage
    if (action === "AIRESUMERATING" || action === "AIRESUMEGENERATION") {
      userQuota.aiResumesUsed += amount;
    } else if (action === "HUNTERDOMAINSEARCH") {
      userQuota.emailsUsed += amount;
    } else if (action === "AICOVERLETTERGENERATION") {
      userQuota.aiCoverLettersUsed += amount;
    }

    await userQuota.save();
    return true;

  } catch (error) {
    await Logger.error('Error updating usage quota', {
      userId,
      action,
      amount,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}