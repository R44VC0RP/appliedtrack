'use server';

import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import { UserModel } from '@/models/User';
import { Logger } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    Logger.info('Stripe webhook received for ' + event.type, {
      body,
      signature,
      webhookSecret
    });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, tier } = session.metadata!;

        await UserModel.findOneAndUpdate(
          { userId },
          { 
            tier,
            dateUpdated: new Date(),
            stripeCustomerId: session.customer as string,
            subscriptionId: session.subscription as string
          }
        );
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await UserModel.findOneAndUpdate(
          { stripeCustomerId: subscription.customer as string },
          { 
            tier: 'free',
            dateUpdated: new Date(),
            subscriptionId: null
          }
        );
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Webhook error', { status: 400 });
  }
}
