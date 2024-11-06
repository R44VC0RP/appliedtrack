import { NextResponse, NextRequest } from 'next/server';
import { WaitlistUserModel } from '@/models/WaitlistUser';
import { Logger } from '@/lib/logger';

/**
 * Updates a waitlist user's notification status
 * @param request - The incoming request object
 * @param params - Route parameters containing the user's email
 * @returns NextResponse with success status or error message
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email);
    
    await Logger.info('Attempting to update waitlist user notification status', {
      email,
      action: 'WAITLIST_NOTIFY_UPDATE'
    });

    const updatedUser = await WaitlistUserModel.findOneAndUpdate(
      { email },
      { 
        isNotified: true,
        dateUpdated: new Date()
      },
      { new: true }
    );
    
    if (!updatedUser) {
      await Logger.warning('Waitlist user not found for notification update', {
        email,
        action: 'WAITLIST_NOTIFY_NOT_FOUND'
      });
      return new NextResponse("User not found", { status: 404 });
    }

    await Logger.info('Successfully updated waitlist user notification status', {
      email,
      userId: updatedUser._id,
      action: 'WAITLIST_NOTIFY_SUCCESS'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await Logger.error('Error updating waitlist user notification status', {
      email: params.email,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'WAITLIST_NOTIFY_ERROR'
    });
    
    return new NextResponse("Error updating waitlist user", { status: 500 });
  }
} 