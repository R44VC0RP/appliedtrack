'use server';

import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import { Logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { UserTier } from '@/types/subscription';
import { srv_handleSubscriptionChange } from '@/app/actions/server/settings/primary';
import { v4 as uuidv4 } from 'uuid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Maximum number of retry attempts for webhook processing
const MAX_RETRY_ATTEMPTS = 3;

// Helper function to process webhook with idempotency
async function processWebhookEvent(event: Stripe.Event) {
  try {
    // Check if event was already processed
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId: event.id }
    });

    if (existingEvent?.processed) {
      await Logger.info('Webhook event already processed', { eventId: event.id });
      return true;
    }

    // Create or update webhook event record
    const webhookEvent = await prisma.webhookEvent.upsert({
      where: { eventId: event.id },
      update: {
        lastAttempt: new Date(),
        retryCount: { increment: 1 },
        metadata: event.data.object as any
      },
      create: {
        id: uuidv4(),
        eventId: event.id,
        type: event.type,
        lastAttempt: new Date(),
        retryCount: 1,
        metadata: event.data.object as any
      }
    });

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
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('Subscription webhook received:', {
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: subscription.current_period_end
        });

        // Find user by Stripe customer ID
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId }
        });

        if (!user) {
          await Logger.warning('User not found for subscription update', {
            customerId
          });
          break;
        }

        // If there's an existing subscription that's different from this one,
        // cancel it to avoid multiple active subscriptions
        if (user.subscriptionId && user.subscriptionId !== subscription.id) {
          try {
            await stripe.subscriptions.cancel(user.subscriptionId, {
              prorate: true
            });
            await Logger.info('Cancelled previous subscription during upgrade/downgrade', {
              userId: user.id,
              oldSubscriptionId: user.subscriptionId,
              newSubscriptionId: subscription.id
            });
          } catch (error) {
            // If the subscription doesn't exist anymore, that's fine
            if ((error as any).code !== 'resource_missing') {
              await Logger.error('Error cancelling previous subscription', {
                error,
                subscriptionId: user.subscriptionId
              });
            }
          }
        }

        // Determine new tier from price ID
        const priceId = subscription.items.data[0].price.id;
        let newTier: UserTier = 'free';
        
        if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
          newTier = 'pro';
        } else if (priceId === process.env.STRIPE_POWER_PRICE_ID) {
          newTier = 'power';
        }

        // If subscription is marked for cancellation but still active,
        // keep the current tier until the end of the period
        const isActive = subscription.status === 'active';
        const isCanceled = subscription.cancel_at_period_end;
        const periodEnd = new Date(subscription.current_period_end * 1000);

        // Only downgrade to free if subscription is actually ended
        const effectiveTier = isActive ? newTier : 'free';

        // Update user's subscription details
        await prisma.user.update({
          where: { id: user.id },
          data: {
            tier: effectiveTier,
            cancelAtPeriodEnd: isCanceled,
            currentPeriodEnd: periodEnd,
            subscriptionId: subscription.id,
            updatedAt: new Date()
          }
        });

        await Logger.info('Subscription updated', {
          userId: user.id,
          customerId,
          tier: effectiveTier,
          status: subscription.status,
          cancelAtPeriodEnd: isCanceled,
          currentPeriodEnd: periodEnd,
          subscriptionId: subscription.id
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId }
        });

        if (!user) {
          await Logger.warning('User not found for subscription cancellation', {
            customerId
          });
          break;
        }

        // When subscription is fully deleted (not just marked for cancellation),
        // immediately move to free tier and update end date
        const periodEnd = new Date(subscription.current_period_end * 1000);

        // Update user's subscription status
        await prisma.user.update({
          where: { id: user.id },
          data: {
            cancelAtPeriodEnd: false,
            currentPeriodEnd: periodEnd,
            updatedAt: new Date()
          }
        });

        // Handle subscription change with correct parameter order
        await srv_handleSubscriptionChange(
          user.id,
          customerId,
          'free',
          periodEnd
        );

        await Logger.info('Subscription cancelled', {
          userId: user.id,
          customerId,
          subscriptionId: subscription.id,
          currentPeriodEnd: periodEnd
        });
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

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, tier, previousTier } = session.metadata!;

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        // Get customer details
        const customer = await stripe.customers.retrieve(session.customer as string);
        const stripeCustomerId = customer.id;
        
        await srv_handleSubscriptionChange(
          userId,
          stripeCustomerId,
          tier as UserTier,
          new Date(subscription.current_period_end * 1000)
        );

        await Logger.info('Checkout completed', {
          userId,
          previousTier,
          newTier: tier,
          subscriptionId: subscription.id
        });
        break;
      }

      // Log other important events
      case 'invoice.payment_succeeded':
      case 'invoice.paid':
      case 'payment_intent.succeeded':
      case 'charge.succeeded': {
        await Logger.info('Payment successful', {
          eventType: event.type,
          eventId: event.id,
          metadata: event.data.object
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
    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: {
        processed: true
      }
    });
    
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
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
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
        { error: 'Failed to process webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    await Logger.error('Error processing webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
      'Access-Control-Max-Age': '86400'
    }
  });
}
