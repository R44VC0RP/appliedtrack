'use server';

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { WaitlistUserModel } from '@/models/WaitlistUser';
import { sendWaitlistEmail } from '@/services/email';
import { sendAdminNotification } from '@/services/email';

import { CampaignModel } from '@/models/Campaign';

mongoose.connect(process.env.MONGODB_URI as string);

export async function POST(request: NextRequest) {
  try {
    const { email, ref } = await request.json();

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    

    // Check if email already exists
    const existingUser = await WaitlistUserModel.findOne({ email });
    if (existingUser) {
      return new NextResponse("Email already registered", { status: 409 });
    }

    if (ref) {
      console.log('Referral:', ref);
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/campaigns/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ref, type: 'signup' }),
        });
      } catch (error) {
        console.error('Error tracking campaign:', error);
        // Continue with waitlist signup even if campaign tracking fails
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
      console.error('Failed to send welcome email:', emailResult.error);
    }

    // Send notification to admin
    const adminNotification = await sendAdminNotification(email, totalUsers);
    if (!adminNotification.success) {
      console.error('Failed to send admin notification:', adminNotification.error);
    }

    return NextResponse.json({
      totalUsers,
      message: "Successfully joined waitlist",
      user: waitlistUser
    });

  } catch (error) {
    console.error("Error in waitlist signup:", error);
    return new NextResponse("Error processing waitlist signup", { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const waitlistUsers = await WaitlistUserModel.find()
      .select('email dateSignedUp isNotified dateUpdated')
      .sort({ dateSignedUp: -1 })
      .lean()
      .exec();

    return NextResponse.json(waitlistUsers);
  } catch (error) {
    console.error("Error fetching waitlist users:", error);
    return new NextResponse("Error fetching waitlist users", { status: 500 });
  }
}
