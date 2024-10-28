import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not available in production', { status: 403 });
  }

  try {
    const { eventType } = await request.json();

    // Create a test customer
    const customer = await stripe.customers.create({
      email: 'test@example.com',
    });

    // Create a test subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRO_PRICE_ID }],
    });

    // Construct the webhook event
    const event = {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      data: {
        object: subscription,
      },
    } as unknown as Stripe.Event;

    // Forward to your webhook handler
    const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'test_signature',
      },
      body: JSON.stringify(event),
    });

    if (!webhookResponse.ok) {
      throw new Error('Webhook handling failed');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error simulating webhook:', error);
    return new NextResponse('Error simulating webhook', { status: 500 });
  }
}
