'use server'

import Stripe from 'stripe';
import { Logger } from '@/lib/logger';
import { srv_authAdminUser } from '@/lib/useUser';

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
});

interface StripeSubscription {
  id: string;
  customer: {
    email: string | null;
    id: string | Stripe.Customer | Stripe.DeletedCustomer;
  };
  plan: string;
  status: Stripe.Subscription.Status;
  amount: number;
  created: number;
}

interface StripeData {
  mode: 'test' | 'live';
  subscriptions: StripeSubscription[];
}

export async function srv_getStripeDashboardData(): Promise<StripeData> {
  try {
    // Verify admin access
    const authAdminUser = await srv_authAdminUser();
    if (!authAdminUser) {
      await Logger.warning('Non-admin user attempted to fetch stripe dashboard data', {
        error: "Forbidden"
      });
      throw new Error('Forbidden');
    }

    // Get Stripe account info
    const account = await stripe.accounts.retrieve();
    const mode = account.charges_enabled ? 'live' : 'test';

    // Get subscriptions with pagination
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      expand: ['data.customer'],
      status: 'all'
    });

    // Format subscription data with null checks
    const formattedSubscriptions = subscriptions.data.map(sub => ({
      id: sub.id,
      customer: {
        email: (sub.customer as Stripe.Customer).email || 'No email',
        id: sub.customer,
      },
      plan: sub.items.data[0].price.nickname || 'Unknown Plan',
      status: sub.status,
      amount: sub.items.data[0].price.unit_amount ? sub.items.data[0].price.unit_amount / 100 : 0,
      created: sub.created,
    }));

    await Logger.info('Stripe dashboard data fetched successfully', {
      subscriptionCount: formattedSubscriptions.length,
      mode
    });

    return {
      mode,
      subscriptions: formattedSubscriptions,
    };

  } catch (error) {
    await Logger.error('Error fetching Stripe dashboard data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}
