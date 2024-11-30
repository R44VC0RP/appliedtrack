'use server'

import { revalidatePath } from 'next/cache';
import { Logger } from '@/lib/logger';
import { srv_authAdminUser } from '@/lib/useUser';
import { prisma } from '@/lib/prisma';

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

    // Check if ref already exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { ref: data.ref }
    });

    if (existingCampaign) {
      return {
        success: false,
        message: 'Campaign reference code already exists',
        error: 'Duplicate reference code'
      };
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        ref: data.ref,
        description: data.description,
        visits: 0,
        signups: 0,
        isActive: true
      }
    });

    await Logger.info('campaign_created', {
      campaignId: campaign.id,
      campaignName: campaign.name
    });

    revalidatePath('/admin/campaigns');

    return {
      success: true,
      message: 'Campaign created successfully',
      data: campaign
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

    const campaigns = await prisma.campaign.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      success: true,
      message: 'Campaigns fetched successfully',
      data: campaigns
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

    // Check if campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!existingCampaign) {
      return {
        success: false,
        message: 'Campaign not found',
        error: 'Invalid campaign ID'
      };
    }

    await prisma.campaign.delete({
      where: { id: campaignId }
    });

    await Logger.info('campaign_deleted', {
      campaignId
    });

    revalidatePath('/admin/campaigns');

    return {
      success: true,
      message: 'Campaign deleted successfully'
    };
  } catch (error) {
    await Logger.error('campaign_deletion_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      campaignId
    });

    return {
      success: false,
      message: 'Failed to delete campaign',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
