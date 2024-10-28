import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { checkRole } from '@/middleware/checkRole';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const authError = await checkRole(request, ['admin']);
    if (authError) return authError;

    // Get Stripe account info
    const account = await stripe.accounts.retrieve();
    const mode = account.charges_enabled ? 'live' : 'test';

    // Get subscriptions
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      expand: ['data.customer'],
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

    return NextResponse.json({
      mode,
      subscriptions: formattedSubscriptions,
    });

  } catch (error) {
    console.error('Error fetching Stripe dashboard data:', error);
    return new NextResponse('Error fetching Stripe dashboard data', { status: 500 });
  }
}
