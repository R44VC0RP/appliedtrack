'use server'

import { revalidatePath } from 'next/cache';
import { CampaignModel } from '@/models/Campaign';
import { UserModel } from '@/models/User';
import { Logger } from '@/lib/logger';
import { currentUser } from '@clerk/nextjs/server';
import { srv_authAdminUser } from '@/lib/useUser';
import { plain } from '@/lib/plain';

interface CreateCampaignInput {
  name: string;
  ref: string;
  description?: string;
}

interface CampaignResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export async function srv_createCampaign(data: CreateCampaignInput): Promise<CampaignResponse> {
  try {
    const isAdmin = await srv_authAdminUser();

    if (!isAdmin) {
      return {
        success: false,
        message: 'Unauthorized access',
        error: 'Admin access required'
      };
    }

    if (!data.name || !data.ref) {
      return {
        success: false,
        message: 'Invalid input',
        error: 'Name and reference code are required'
      };
    }

    const campaign = await CampaignModel.create({
      ...data,
      dateCreated: new Date(),
      dateUpdated: new Date(),
      visits: 0,
      signups: 0,
      isActive: true
    });

    await Logger.info('campaign_created', {
      campaignId: campaign._id,
      campaignName: campaign.name
    });

    revalidatePath('/admin/campaigns');

    return {
      success: true,
      message: 'Campaign created successfully',
      data: plain(campaign)
    };
  } catch (error) {
    await Logger.error('campaign_creation_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      message: 'Failed to create campaign',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function srv_getCampaigns(): Promise<CampaignResponse> {
  try {
    const isAdmin = await srv_authAdminUser();

    if (!isAdmin) {
      return {
        success: false,
        message: 'Unauthorized access',
        error: 'Admin access required'
      };
    }

    const campaigns = await CampaignModel.find()
      .sort({ dateCreated: -1 })
      .lean()
      .exec();

    return {
      success: true,
      message: 'Campaigns fetched successfully',
      data: campaigns.map(campaign => plain(campaign))
    };
  } catch (error) {
    await Logger.error('campaign_fetch_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      message: 'Failed to fetch campaigns',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function srv_deleteCampaign(campaignId: string): Promise<CampaignResponse> {
  try {
    const isAdmin = await srv_authAdminUser();

    if (!isAdmin) {
      return {
        success: false,
        message: 'Unauthorized access',
        error: 'Admin access required'
      };
    }

    const deletedCampaign = await CampaignModel.findByIdAndDelete(campaignId);

    if (!deletedCampaign) {
      return {
        success: false,
        message: 'Campaign not found',
        error: 'Invalid campaign ID'
      };
    }

    await Logger.info('campaign_deleted', {
      campaignId,
      campaignName: deletedCampaign.name
    });

    revalidatePath('/admin/campaigns');

    return {
      success: true,
      message: 'Campaign deleted successfully',
      data: plain(campaignId)
    };
  } catch (error) {
    await Logger.error('campaign_deletion_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      message: 'Failed to delete campaign',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
