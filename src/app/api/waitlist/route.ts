'use server';

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { WaitlistUserModel } from '@/models/WaitlistUser';
import { sendWaitlistEmail } from '@/services/email';
import { sendAdminNotification } from '@/services/email';
import { Logger } from '@/lib/logger';

import { CampaignModel } from '@/models/Campaign';

mongoose.connect(process.env.MONGODB_URI as string);

/**
 * POST handler for waitlist signup
 * @param request NextRequest containing email and optional ref parameter
 * @returns NextResponse with signup status and user data
 */
export async function POST(request: NextRequest) {
  try {
    const { email, ref } = await request.json();

    if (!email) {
      await Logger.warning('Waitlist signup attempted without email', {
        timestamp: new Date()
      });
      return new NextResponse("Email is required", { status: 400 });
    }

    // Check if email already exists
    const existingUser = await WaitlistUserModel.findOne({ email });
    if (existingUser) {
      await Logger.info('Duplicate waitlist signup attempt', {
        email,
        timestamp: new Date()
      });
      return new NextResponse("Email already registered", { status: 409 });
    }

    if (ref) {
      await Logger.info('Waitlist signup with referral', {
        ref,
        email,
        timestamp: new Date()
      });
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/campaigns/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ref, type: 'signup' }),
        });
      } catch (error) {
        await Logger.error('Campaign tracking failed', {
          ref,
          email,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }

    // Create new waitlist user
    const waitlistUser = new WaitlistUserModel({
      email,
      dateSignedUp: new Date(),
      isNotified: false,
      dateUpdated: new Date()
    });

    await waitlistUser.save();

    let totalUsers = await WaitlistUserModel.countDocuments();

    totalUsers += 1300

    // Send welcome email to user
    const emailResult = await sendWaitlistEmail(email);
    if (!emailResult.success) {
      await Logger.error('Welcome email sending failed', {
        email,
        error: emailResult.error,
        timestamp: new Date()
      });
    }

    // Send notification to admin
    const adminNotification = await sendAdminNotification(email, totalUsers);
    if (!adminNotification.success) {
      await Logger.error('Admin notification failed', {
        email,
        totalUsers,
        error: adminNotification.error,
        timestamp: new Date()
      });
    }

    await Logger.info('Successful waitlist signup', {
      email,
      totalUsers,
      timestamp: new Date()
    });

    return NextResponse.json({
      totalUsers,
      message: "Successfully joined waitlist",
      user: waitlistUser
    });

  } catch (error) {
    await Logger.error('Waitlist signup failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date()
    });
    return new NextResponse("Error processing waitlist signup", { status: 500 });
  }
}

/**
 * GET handler to retrieve all waitlist users
 * @param request NextRequest
 * @returns NextResponse containing array of waitlist users
 */
export async function GET(request: NextRequest) {
  try {
    const waitlistUsers = await WaitlistUserModel.find()
      .select('email dateSignedUp isNotified dateUpdated')
      .sort({ dateSignedUp: -1 })
      .lean()
      .exec();

    await Logger.info('Waitlist users fetched', {
      count: waitlistUsers.length,
      timestamp: new Date()
    });

    return NextResponse.json(waitlistUsers);
  } catch (error) {
    await Logger.error('Failed to fetch waitlist users', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date()
    });
    return new NextResponse("Error fetching waitlist users", { status: 500 });
  }
}
