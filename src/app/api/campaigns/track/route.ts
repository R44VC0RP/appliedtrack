'use server';

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { CampaignModel } from '@/models/Campaign';
import { Logger } from '@/lib/logger';

mongoose.connect(process.env.MONGODB_URI as string);

/**
 * Track campaign visits and signups
 * @route POST /api/campaigns/track
 * @param request - NextRequest object containing ref and type in the body
 * @returns NextResponse with tracking confirmation or error message
 */
export async function POST(request: NextRequest) {
  try {
    const { ref, type } = await request.json();

    await Logger.info('Campaign tracking request received', {
      ref,
      type,
      timestamp: new Date()
    });

    if (!ref) {
      await Logger.warning('Campaign tracking failed: Missing ref', {
        type,
        timestamp: new Date()
      });
      return new NextResponse("Ref is required", { status: 400 });
    }

    if (!type) {
      await Logger.warning('Campaign tracking failed: Missing type', {
        ref,
        timestamp: new Date()
      });
      return new NextResponse("Type is required", { status: 400 });
    }

    let campaign;

    if (type === 'access') {
      campaign = await CampaignModel.findOneAndUpdate(
        { ref: ref },
        {
          $inc: { visits: 1 },
          dateUpdated: new Date()
        },
        { new: true }
      );
      
      await Logger.info('Campaign visit tracked', {
        ref,
        type,
        newVisitCount: campaign?.visits
      });
    } else if (type === 'signup') {
      campaign = await CampaignModel.findOneAndUpdate(
        { ref: ref },
        { $inc: { signups: 1 }, dateUpdated: new Date() },
        { new: true }
      );
      
      await Logger.info('Campaign signup tracked', {
        ref,
        type,
        newSignupCount: campaign?.signups
      });
    }

    if (!campaign) {
      await Logger.warning('Campaign not found during tracking', {
        ref,
        type,
        timestamp: new Date()
      });
      return new NextResponse("Campaign not found", { status: 404 });
    }

    return NextResponse.json({
      message: 'Campaign visit tracked',
      visits: campaign.visits
    });
  } catch (error) {
    await Logger.error('Error tracking campaign activity', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date()
    });
    return new NextResponse("Error tracking campaign visit", { status: 500 });
  }
}

