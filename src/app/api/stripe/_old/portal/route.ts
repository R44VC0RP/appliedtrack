import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { UserModel } from '@/models/User';
import { Logger } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST handler for creating a Stripe billing portal session
 * @description Creates a customer portal session for managing subscriptions
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response with portal URL or error
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      await Logger.warning('Unauthorized portal access attempt', {
        path: request.url,
        method: request.method,
      });
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user's Stripe customer ID from your database
    const user = await UserModel.findOne({ userId });
    if (!user?.stripeCustomerId) {
      await Logger.warning('No subscription found for user', {
        userId,
        path: request.url,
        method: request.method,
      });
      return new NextResponse("No subscription found", { status: 404 });
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    await Logger.info('Stripe portal session created', {
      userId,
      stripeCustomerId: user.stripeCustomerId,
      sessionId: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    await Logger.error('Error creating Stripe portal session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: getAuth(request).userId ?? 'unknown',
      path: request.url,
      method: request.method,
    });
    
    return new NextResponse("Error creating portal session", { status: 500 });
  }
}
