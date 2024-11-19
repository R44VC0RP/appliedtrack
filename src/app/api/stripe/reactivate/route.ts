import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { stripe } from '@/lib/stripe';
import { UserModel } from '@/models/user';
import { Logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return new NextResponse('Subscription ID is required', { status: 400 });
    }

    // Find the user to verify ownership of the subscription
    const user = await UserModel.findOne({ userId });
    if (!user || user.subscriptionId !== subscriptionId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Reactivate the subscription in Stripe
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    // Update user record
    await UserModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          cancelAtPeriodEnd: false,
        },
      }
    );

    await Logger.info('Subscription reactivated', {
      userId,
      subscriptionId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await Logger.error('Error reactivating subscription', { error });
    return new NextResponse('Internal Error', { status: 500 });
  }
}
