import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { CampaignModel } from '@/models/Campaign';
import { UserModel } from '@/models/User';
import { Logger } from '@/lib/logger';

/**
 * Interface for campaign creation data
 * @interface CreateCampaignData
 * @property {string} name - The name of the campaign
 * @property {any} [key: string] - Additional campaign properties
 */
interface CreateCampaignData {
  name: string;
  [key: string]: any;
}

/**
 * Validates if the user has admin access
 * @param {string | null} userId - The ID of the user to validate
 * @throws {Error} Throws 'Unauthorized' if no userId provided
 * @throws {Error} Throws 'Forbidden' if user is not an admin
 */
async function validateAdminAccess(userId: string | null): Promise<void> {
  if (!userId) {
    await Logger.warning('Unauthorized access attempt to admin campaigns', {
      path: '/api/admin/campaigns',
      userId: 'null',
      timestamp: new Date().toISOString(),
      severity: 'HIGH'
    });
    throw new Error('Unauthorized');
  }

  const user = await UserModel.findOne({ userId });
  if (!user || user.role !== 'admin') {
    await Logger.warning('Non-admin user attempted to access admin campaigns', {
      userId,
      userRole: user?.role,
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
      attemptedAction: 'ADMIN_ACCESS'
    });
    throw new Error('Forbidden');
  }

  await Logger.info('Admin access validated successfully', {
    userId,
    userRole: 'admin',
    timestamp: new Date().toISOString()
  });
}

/**
 * GET handler for admin campaigns
 * @route GET /api/admin/campaigns
 * @access Private (Admin only)
 * @returns {Promise<NextResponse>} JSON response containing all campaigns
 * @throws {NextResponse} 401 if unauthorized
 * @throws {NextResponse} 403 if forbidden
 * @throws {NextResponse} 500 if server error
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
 * POST handler for creating new campaigns
 * @route POST /api/admin/campaigns
 * @access Private (Admin only)
 * @param {NextRequest} request - The incoming request object
 * @body {CreateCampaignData} Campaign data
 * @returns {Promise<NextResponse>} JSON response with created campaign
 * @throws {NextResponse} 400 if invalid input
 * @throws {NextResponse} 401 if unauthorized
 * @throws {NextResponse} 403 if forbidden
 * @throws {NextResponse} 500 if server error
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    await validateAdminAccess(userId);

    const data = await request.json() as CreateCampaignData;
    
    // Enhanced validation with detailed logging
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      await Logger.warning('Invalid campaign creation attempt', {
        userId,
        invalidData: data,
        validationErrors: {
          name: !data.name ? 'missing' : 
                typeof data.name !== 'string' ? 'not_string' : 
                'empty_string'
        },
        timestamp: new Date().toISOString(),
        severity: 'MEDIUM'
      });
      return new NextResponse('Invalid campaign name', { status: 400 });
    }

    const campaign = await CampaignModel.create({
      ...data,
      name: data.name.trim(),
      dateCreated: new Date(),
      dateUpdated: new Date(),
      createdBy: userId
    });

    await Logger.info('New campaign created successfully', {
      userId,
      campaignId: campaign._id,
      campaignName: campaign.name,
      timestamp: new Date().toISOString(),
      metadata: {
        fields: Object.keys(data),
        creationTime: campaign.dateCreated
      }
    });

    return NextResponse.json(campaign);
  } catch (error) {
    await Logger.error('Error in POST /api/admin/campaigns', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: getAuth(request).userId,
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
      context: {
        endpoint: '/api/admin/campaigns',
        method: 'POST',
        headers: Object.fromEntries(request.headers)
      }
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