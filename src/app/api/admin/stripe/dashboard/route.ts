import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import { Logger } from '@/lib/logger';
import { checkRole } from '@/middleware/checkRole';

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia' // Explicitly specify API version
});

/**
 * GET /api/admin/stripe/dashboard
 * 
 * Fetches Stripe dashboard data including account mode and subscription information.
 * Restricted to admin users only.
 * 
 * @param request - Next.js request object
 * @returns Stripe dashboard data or error response
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const authError = await checkRole(request, ['admin']);
    if (authError) {
      await Logger.warning('Unauthorized access attempt to Stripe dashboard', {
        path: request.url,
        ip: request.ip
      });
      return authError;
    }

    // Get Stripe account info
    const account = await stripe.accounts.retrieve();
    const mode = account.charges_enabled ? 'live' : 'test';

    // Get subscriptions with pagination
    const subscriptions = await stripe.subscriptions.list({
      limit: 100, // Consider making this configurable
      expand: ['data.customer'],
      status: 'all' // Explicitly fetch all subscription statuses
    });

    // Format subscription data
    const formattedSubscriptions = subscriptions.data.map(sub => ({
      id: sub.id,
      customer: {
        email: (sub.customer as Stripe.Customer).email,
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

    return NextResponse.json({
      mode,
      subscriptions: formattedSubscriptions,
    });

  } catch (error) {
    await Logger.error('Error fetching Stripe dashboard data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch Stripe dashboard data' },
      { status: 500 }
    );
  }
}
