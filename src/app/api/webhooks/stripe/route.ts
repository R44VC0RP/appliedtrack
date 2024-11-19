'use server';

import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import { UserModel } from '@/models/User';
import { Logger } from '@/lib/logger';
import { UserQuotaModel, resetQuota, createInitialQuota } from '@/models/UserQuota';
import { WebhookEventModel } from '@/models/WebhookEvent';
import mongoose from 'mongoose';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Maximum number of retry attempts for webhook processing
const MAX_RETRY_ATTEMPTS = 3;

// Helper function to update user subscription status
async function updateUserSubscription(
  stripeCustomerId: string,
  updates: {
    tier?: 'free' | 'pro' | 'power';
    subscriptionId?: string | null;
    subscriptionStatus?: string;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: Date;
  }
) {
  try {
    const user = await UserModel.findOneAndUpdate(
      { stripeCustomerId },
      {
        ...updates,
        dateUpdated: new Date(),
      },
      { new: true }
    );

    if (user && updates.currentPeriodEnd) {
      // Handle quota reset
      const quota = await UserQuotaModel.findOne({ userId: user.userId });
      if (quota) {
        await resetQuota(user.userId, updates.currentPeriodEnd);
      } else {
        await createInitialQuota(user.userId, updates.currentPeriodEnd);
      }

      await Logger.info('User quota reset for new billing period', {
        userId: user.userId,
        newResetDate: updates.currentPeriodEnd
      });
    }

    await Logger.info('User subscription updated', {
      stripeCustomerId,
      updates,
      success: !!user
    });

    return user;
  } catch (error) {
    await Logger.error('Failed to update user subscription', {
      stripeCustomerId,
      updates,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Helper function to handle subscription cancellation
async function handleSubscriptionCancellation(
  stripeCustomerId: string,
  immediateReset: boolean = false
) {
  try {
    const user = await UserModel.findOne({ stripeCustomerId });
    if (!user) {
      await Logger.warning('User not found for subscription cancellation', {
        stripeCustomerId
      });
      return;
    }

    // If immediate cancellation or subscription expired, reset quota and update user tier
    if (immediateReset) {
      // Update user to free tier
      await UserModel.findByIdAndUpdate(user._id, {
        tier: 'free',
        dateUpdated: new Date()
      });

      // Reset quota
      const quota = await UserQuotaModel.findOne({ userId: user.userId });
      if (quota) {
        await resetQuota(user.userId, new Date(new Date().setDate(new Date().getDate() + 30)));
        await Logger.info('User quota reset to free tier', {
          userId: user.userId,
          oldTier: user.tier,
          newTier: 'free'
        });
      }
    }
  } catch (error) {
    await Logger.error('Failed to handle subscription cancellation', {
      stripeCustomerId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Helper function to process webhook with idempotency but without transactions
async function processWebhookEvent(event: Stripe.Event) {
  try {
    // Check if event was already processed
    const existingEvent = await WebhookEventModel.findOne({ eventId: event.id });
    if (existingEvent?.processed) {
      await Logger.info('Webhook event already processed', { eventId: event.id });
      return true;
    }

    // Create or update webhook event record
    const webhookEvent = await WebhookEventModel.findOneAndUpdate(
      { eventId: event.id },
      {
        eventId: event.id,
        type: event.type,
        lastAttempt: new Date(),
        $inc: { retryCount: 1 },
        metadata: event.data.object
      },
      { upsert: true, new: true }
    );

    if (webhookEvent.retryCount > MAX_RETRY_ATTEMPTS) {
      await Logger.error('Max retry attempts exceeded for webhook event', {
        eventId: event.id,
        type: event.type,
        retryCount: webhookEvent.retryCount
      });
      return false;
    }

    // Process the webhook based on event type
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const updates: {
          tier?: 'free' | 'pro' | 'power';
          subscriptionId: string;
          subscriptionStatus: string;
          cancelAtPeriodEnd: boolean;
          currentPeriodEnd: Date;
        } = {
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        };

        // Determine tier from price ID
        const priceId = subscription.items.data[0].price.id;
        if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
          updates.tier = 'pro';
        } else if (priceId === process.env.STRIPE_POWER_PRICE_ID) {
          updates.tier = 'power';
        }

        await updateUserSubscription(subscription.customer as string, updates);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.trial_end) {
          await Logger.info('Trial period ending soon', {
            customerId: subscription.customer,
            subscriptionId: subscription.id,
            trialEnd: new Date(subscription.trial_end * 1000)
          });
        }
        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.paid':
      case 'payment_intent.succeeded':
      case 'charge.succeeded': {
        // These events indicate successful payment, log them
        await Logger.info('Payment successful', {
          eventType: event.type,
          eventId: event.id
        });
        break;
      }

      case 'customer.created':
      case 'customer.updated':
      case 'payment_method.attached': {
        // Customer-related events, log them
        await Logger.info('Customer event processed', {
          eventType: event.type,
          eventId: event.id
        });
        break;
      }

      case 'billing_portal.session.created': {
        await Logger.info('Billing portal session created', {
          customerId: (event.data.object as any).customer
        });
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, tier } = session.metadata!;

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        await updateUserSubscription(session.customer as string, {
          tier: tier as 'free' | 'pro' | 'power',
          subscriptionId: session.subscription as string,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        });
        break;
      }

      default:
        await Logger.info('Unhandled webhook event type', { 
          type: event.type,
          details: { eventId: event.id }
        });
        break;
    }

    // Mark event as processed
    webhookEvent.processed = true;
    await webhookEvent.save();
    
    await Logger.info('Successfully processed webhook event', {
      eventId: event.id,
      type: event.type,
      attempt: webhookEvent.retryCount
    });
    
    return true;
  } catch (error) {
    await Logger.error('Failed to process webhook event', {
      eventId: event.id,
      type: event.type,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      await Logger.error('Missing Stripe signature', {
        error: 'Missing stripe-signature header'
      });
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      await Logger.error('Invalid webhook signature', {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    // Process the webhook event with retries and idempotency
    const success = await processWebhookEvent(event);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to process webhook event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    await Logger.error('Webhook processing error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'POST',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    },
  });
}
