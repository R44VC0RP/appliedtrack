'use server';

import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { UserModel } from '@/models/User';
import { User } from '@/models/User';
import { getUserEmail } from '@/app/api/clerk/helper';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  power: process.env.STRIPE_POWER_PRICE_ID!
};

export async function POST(request: NextRequest) {
  try {
    console.log('Starting Stripe checkout process...');
    
    const { userId } = getAuth(request);
    if (!userId) {
      console.log('Authentication failed - no userId found');
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.log(`Authenticated user: ${userId}`);

    const { tier } = await request.json();
    console.log(`Requested subscription tier: ${tier}`);
    
    const priceId = PRICE_IDS[tier as keyof typeof PRICE_IDS];
    if (!priceId) {
      console.log(`Invalid tier requested: ${tier}`);
      return new NextResponse("Invalid tier", { status: 400 });
    }
    console.log(`Using Stripe price ID: ${priceId}`);

    const user = await UserModel.findOne({ userId }) as User;
    if (!user) {
      console.log(`User not found for userId: ${userId}`);
      return new NextResponse("User not found", { status: 404 });
    } 
    const email = await getUserEmail(userId);
    console.log(`Found user with email: ${email}`);

    // Create Stripe checkout session
    console.log('Creating Stripe checkout session...');
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
    console.log(`Checkout session created successfully. Session ID: ${session.id}`);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    return new NextResponse("Error creating checkout session", { status: 500 });
  }
}
