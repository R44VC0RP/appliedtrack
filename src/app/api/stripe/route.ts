'use server';

import { NextResponse, NextRequest } from 'next/server';
import { Logger } from '@/lib/logger';
import Stripe from 'stripe';
import { prisma } from "@/lib/prisma";
import { UserTier } from '@prisma/client';

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
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const user = await currentUser();

    if (!user) {
      await Logger.warning('No authenticated user found in Stripe callback', {
        sessionId
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session metadata
    if (session.metadata?.userId !== user.id) {
      await Logger.warning('User ID mismatch in Stripe callback', {
        sessionUserId: session.metadata?.userId,
        currentUserId: user.id
      });
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    // Update user with new subscription details
    const updateData = {
      tier: session.metadata.tier as UserTier,
      stripeCustomerId: session.customer as string,
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date()
    };

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    await Logger.info('Subscription updated successfully', {
      userId: user.id,
      tier: session.metadata.tier,
      stripeSessionId: sessionId,
      isUpgrade: session.metadata.isUpgrade === 'true',
      subscriptionId: subscription.id
    });

    return NextResponse.redirect(new URL('/dashboard?celebrate=true', request.url), {
      status: 303
    });
  } catch (error) {
    await Logger.error('Error processing Stripe success callback', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
