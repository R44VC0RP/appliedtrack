'use server';

import { NextResponse, NextRequest } from 'next/server';
import { Logger } from '@/lib/logger';
import Stripe from 'stripe';
import { UserModel } from '@/models/User';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      await Logger.warning('Missing session_id in Stripe callback', {
        url: request.url
      });
      return redirect('/settings?tab=subscription&error=missing_session');
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const user = await currentUser();

    if (!user) {
      await Logger.warning('No authenticated user found in Stripe callback', {
        sessionId
      });
      return redirect('/settings?tab=subscription&error=unauthorized');
    }

    // Verify session metadata
    if (session.metadata?.userId !== user.id) {
      await Logger.warning('User ID mismatch in Stripe callback', {
        sessionUserId: session.metadata?.userId,
        currentUserId: user.id
      });
      return redirect('/settings?tab=subscription&error=invalid_session');
    }

    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    // Update user with new subscription details
    const updateData = {
      tier: session.metadata.tier,
      stripeCustomerId: session.customer as string,
      subscriptionDetails: {
        status: subscription.status,
        tier: session.metadata.tier,
        startDate: new Date(subscription.current_period_start * 1000).toISOString(),
        endDate: new Date(subscription.current_period_end * 1000).toISOString(),
        subscriptionId: subscription.id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      },
      dateUpdated: new Date().toISOString()
    };

    const updatedUser = await UserModel.findOneAndUpdate(
      { userId: user.id },
      updateData,
      { new: true }
    );

    await Logger.info('Subscription updated successfully', {
      userId: user.id,
      tier: session.metadata.tier,
      stripeSessionId: sessionId,
      isUpgrade: session.metadata.isUpgrade === 'true',
      subscriptionId: subscription.id
    });

    return redirect(`/settings?tab=subscription&success=true&tier=${session.metadata.tier}`);
  } catch (error) {
    await Logger.error('Error processing Stripe success callback', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return redirect('/settings?tab=subscription&error=processing_failed');
  }
}
