import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { CampaignModel } from '@/models/Campaign';
import { UserModel } from '@/models/User';
import { Logger } from '@/lib/logger';


// Add proper type for campaign data
interface CreateCampaignData {
  name: string;
  [key: string]: any; // for additional fields
}

// Improved utility function with better error handling
async function validateAdminAccess(userId: string | null): Promise<void> {
  if (!userId) {
    await Logger.warning('Unauthorized access attempt to admin campaigns', {
      path: '/api/admin/campaigns',
      userId: 'null'
    });
    throw new Error('Unauthorized');
  }

  const user = await UserModel.findOne({ userId });
  if (!user || user.role !== 'admin') {
    await Logger.warning('Non-admin user attempted to access admin campaigns', {
      userId,
      userRole: user?.role
    });
    throw new Error('Forbidden');
  }
}

/**
 * GET /api/admin/campaigns
 * Retrieves all campaigns sorted by creation date
 * @requires Admin authentication
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    await validateAdminAccess(userId);

    await Logger.info('Admin retrieving all campaigns', {
      userId,
      action: 'GET_ALL_CAMPAIGNS'
    });

    const campaigns = await CampaignModel.find()
      .sort({ dateCreated: -1 })
      .lean()
      .exec();

    return NextResponse.json(campaigns);
  } catch (error) {
    await Logger.error('Error in GET /api/admin/campaigns', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: getAuth(request).userId
    });
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return new NextResponse('Unauthorized', { status: 401 });
      }
      if (error.message === 'Forbidden') {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
    
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * POST /api/admin/campaigns
 * Creates a new campaign
 * @requires Admin authentication
 * @body Campaign data object
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    await validateAdminAccess(userId);

    const data = await request.json() as CreateCampaignData;
    
    // Enhanced validation
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      await Logger.warning('Invalid campaign creation attempt', {
        userId,
        invalidData: data
      });
      return new NextResponse('Invalid campaign name', { status: 400 });
    }

    const campaign = await CampaignModel.create({
      ...data,
      name: data.name.trim(), // Sanitize input
      dateCreated: new Date(),
      dateUpdated: new Date(),
      createdBy: userId
    });

    await Logger.info('New campaign created', {
      userId,
      campaignId: campaign._id,
      campaignName: campaign.name
    });

    return NextResponse.json(campaign);
  } catch (error) {
    await Logger.error('Error in POST /api/admin/campaigns', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: getAuth(request).userId
    });
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return new NextResponse('Unauthorized', { status: 401 });
      }
      if (error.message === 'Forbidden') {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
    
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 