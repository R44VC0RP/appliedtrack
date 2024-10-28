import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { UserModel } from '@/models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user's Stripe customer ID from your database
    const user = await UserModel.findOne({ userId });
    if (!user?.stripeCustomerId) {
      return new NextResponse("No subscription found", { status: 404 });
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return new NextResponse("Error creating portal session", { status: 500 });
  }
}
