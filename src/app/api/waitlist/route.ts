'use server';

import { NextResponse, NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { WaitlistUserModel } from '@/models/WaitlistUser';
import { sendWaitlistEmail } from '@/services/email';
import { sendAdminNotification } from '@/services/email';

mongoose.connect(process.env.MONGODB_URI as string);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    // Check if email already exists
    const existingUser = await WaitlistUserModel.findOne({ email });
    if (existingUser) {
      return new NextResponse("Email already registered", { status: 409 });
    }

    // Create new waitlist user
    const waitlistUser = new WaitlistUserModel({
      email,
      dateSignedUp: new Date(),
    });

    await waitlistUser.save();

    let totalUsers = await WaitlistUserModel.countDocuments();

    totalUsers += 130

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
      .sort({ dateSignedUp: -1 })
      .lean()
      .exec();

    return NextResponse.json(waitlistUsers);
  } catch (error) {
    console.error("Error fetching waitlist users:", error);
    return new NextResponse("Error fetching waitlist users", { status: 500 });
  }
}
