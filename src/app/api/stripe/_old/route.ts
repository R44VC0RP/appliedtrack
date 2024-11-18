'use server';

import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { UserModel } from '@/models/User';
import { User } from '@/models/User';
import { getUserEmail } from '@/app/api/clerk/helper';
import { Logger } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  power: process.env.STRIPE_POWER_PRICE_ID!
};

/**
 * Handles Stripe checkout session creation for subscription purchases
 * @param {NextRequest} request - The incoming request object containing tier information
 * @returns {Promise<NextResponse>} JSON response with checkout URL or error message
 * @throws Will throw an error if stripe session creation fails
 */
export async function POST(request: NextRequest) {
  try {
    await Logger.info('Starting Stripe checkout process', {
      service: 'Stripe',
      action: 'CREATE_CHECKOUT_SESSION'
    });
    
    const { userId } = getAuth(request);
    if (!userId) {
      await Logger.warning('Unauthorized stripe checkout attempt', {
        path: request.url,
        method: request.method
      });
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { tier } = await request.json();
    await Logger.info('Stripe checkout tier requested', {
      userId,
      tier,
      path: request.url
    });
    
    const priceId = PRICE_IDS[tier as keyof typeof PRICE_IDS];
    if (!priceId) {
      await Logger.warning('Invalid subscription tier requested', {
        userId,
        invalidTier: tier,
        availableTiers: Object.keys(PRICE_IDS)
      });
      return new NextResponse("Invalid tier", { status: 400 });
    }

    const user = await UserModel.findOne({ userId }) as User;
    if (!user) {
      await Logger.error('User not found during stripe checkout', {
        userId,
        tier,
        action: 'STRIPE_CHECKOUT'
      });
      return new NextResponse("User not found", { status: 404 });
    } 

    const email = await getUserEmail(userId);
    await Logger.info('Processing stripe checkout', {
      userId,
      tier,
      email: email // Only logging email for tracking purposes
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&tier=${tier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      metadata: {
        userId,
        tier,
      },
    });

    await Logger.info('Stripe checkout session created', {
      userId,
      tier,
      sessionId: session.id
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    await Logger.error('Stripe checkout session creation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      service: 'Stripe',
      action: 'CREATE_CHECKOUT_SESSION'
    });
    
    return new NextResponse("Error creating checkout session", { status: 500 });
  }
}
