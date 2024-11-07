'use server';

import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { UserModel } from '@/models/User';
import Stripe from 'stripe';
import { Logger } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

mongoose.connect(process.env.MONGODB_URI as string);

/**
 * Updates user profile information
 * @param request NextRequest containing user profile updates
 * @returns NextResponse with updated user data or error
 */
export const PUT = async (request: NextRequest) => {
  const { userId } = getAuth(request);
  
  if (!userId) {
    await Logger.warning('Unauthorized user update attempt', {
      path: request.url,
      method: 'PUT'
    });
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
      await Logger.warning('User not found during update', {
        userId,
        attempted_update: { about, onBoardingComplete }
      });
      return new NextResponse("User not found", { status: 404 });
    }
    
    await Logger.info('User profile updated successfully', {
      userId,
      updatedFields: ['about', 'onBoardingComplete']
    });
    return NextResponse.json(user);
  } catch (error) {
    await Logger.error('Error updating user profile', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new NextResponse("Error updating user", { status: 500 });
  }
}

/**
 * Retrieves user information including subscription details if available
 * @param request NextRequest for user data retrieval
 * @returns NextResponse with user data including subscription details
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      await Logger.warning('Unauthorized user data access attempt', {
        path: request.url,
        method: 'GET'
      });
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await UserModel.findOne({ userId });
    if (!user) {
      await Logger.warning('User not found during data retrieval', { userId });
      return new NextResponse("User not found", { status: 404 });
    }

    let subscriptionDetails = null;
    if (user.subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
      subscriptionDetails = {
        currentPeriodEnd: subscription.current_period_end,
        status: subscription.status,
        cancelAt: subscription.cancel_at || undefined
      };
      
      await Logger.info('Subscription details retrieved', {
        userId,
        subscriptionId: user.subscriptionId,
        status: subscription.status
      });
    }

    return NextResponse.json({
      tier: user.tier,
      subscriptionDetails,
      role: user.role,
      onBoardingComplete: user.onBoardingComplete,
      about: user.about

    });
  } catch (error) {
    await Logger.error('Error fetching user data', {
      userId: getAuth(request).userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new NextResponse("Error fetching user data", { status: 500 });
  }
}
