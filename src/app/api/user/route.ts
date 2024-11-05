'use server';

import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { UserModel } from '@/models/User';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

mongoose.connect(process.env.MONGODB_URI as string);

export const PUT = async (request: NextRequest) => {
  const { userId } = getAuth(request);
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userData = await request.json();
  const { about, onBoardingComplete } = userData;

  try {
    const user = await UserModel.findOneAndUpdate(
      { userId },
      { $set: { about, dateUpdated: new Date(), onBoardingComplete } },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return new NextResponse("Error updating user", { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await UserModel.findOne({ userId });
    if (!user) return new NextResponse("User not found", { status: 404 });

    let subscriptionDetails = null;
    if (user.subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
      subscriptionDetails = {
        currentPeriodEnd: subscription.current_period_end,
        status: subscription.status,
        cancelAt: subscription.cancel_at || undefined
      };
    }

    return NextResponse.json({
      tier: user.tier,
      subscriptionDetails,
      role: user.role,
      onBoardingComplete: user.onBoardingComplete
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return new NextResponse("Error fetching user data", { status: 500 });
  }
}
