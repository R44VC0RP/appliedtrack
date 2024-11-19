'use server';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Logger } from '@/lib/logger';
import Stripe from 'stripe';
import { UserModel } from '@/models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      await Logger.error('Webhook signature verification failed', {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Log the event for debugging
    console.log('Received webhook event:', {
      type: event.type,
      data: event.data.object
    });

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get the tier from metadata or default to 'free'
        const tier = subscription.status === 'active' 
          ? (subscription.metadata.tier || 'free')
          : 'free';

        // Log the update data for debugging
        console.log('Updating subscription with:', {
          customerId,
          tier,
          status: subscription.status
        });

        // Update user with new subscription details
        const updateData = {
          tier,
          subscriptionDetails: {
            status: subscription.status,
            tier,
            startDate: new Date(subscription.current_period_start * 1000).toISOString(),
            endDate: new Date(subscription.current_period_end * 1000).toISOString(),
            subscriptionId: subscription.id,
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          },
          dateUpdated: new Date().toISOString()
        };

        // First try to find the user by stripeCustomerId
        let user = await UserModel.findOne({ stripeCustomerId: customerId });
        
        if (!user) {
          // If not found, try to find by subscriptionId
          user = await UserModel.findOne({ 'subscriptionDetails.subscriptionId': subscription.id });
        }

        if (!user) {
          await Logger.warning('User not found for subscription update', {
            customerId,
            subscriptionId: subscription.id,
            updateData
          });
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update the user
        const updatedUser = await UserModel.findOneAndUpdate(
          { _id: user._id },
          updateData,
          { new: true }
        );

        await Logger.info(`Subscription ${event.type} processed`, {
          userId: user.userId,
          customerId,
          subscriptionId: subscription.id,
          newTier: tier,
          status: subscription.status,
          updateData
        });

        break;
      }

      // Add more webhook event handlers as needed
      default:
        await Logger.info(`Unhandled Stripe webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    await Logger.error('Error processing Stripe webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
