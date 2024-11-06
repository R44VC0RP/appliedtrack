import { NextResponse, NextRequest } from 'next/server';
import { clerkClient } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";
import { UserModel } from '@/models/User';
import { WaitlistUserModel } from '@/models/WaitlistUser';
import { Logger } from '@/lib/logger';

/**
 * POST /api/invitations
 * Creates an invitation for a waitlisted user and sends it via Clerk
 * @param request - Next.js request object containing email in the body
 * @returns NextResponse with invitation details or error message
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const { userId } = getAuth(request);
    if (!userId) {
      await Logger.warning('Unauthorized invitation attempt', {
        path: request.url,
        method: request.method
      });
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify admin role from database
    const currentUser = await UserModel.findOne({ userId });
    if (!currentUser || currentUser.role !== 'admin') {
      await Logger.warning('Non-admin user attempted to send invitation', {
        userId,
        userRole: currentUser?.role
      });
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { email } = await request.json();

    await Logger.info('Processing invitation request', {
      adminUserId: userId,
      targetEmail: email
    });

    // Check if user exists in waitlist
    const waitlistUser = await WaitlistUserModel.findOne({ email });
    if (!waitlistUser) {
      await Logger.warning('Invitation attempted for non-waitlisted user', {
        email,
        adminUserId: userId
      });
      return new NextResponse("User not found in waitlist", { status: 404 });
    }

    // Create invitation using Clerk
    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      publicMetadata: {
        fromWaitlist: true
      }
    });

    // Update waitlist user as notified
    await WaitlistUserModel.findOneAndUpdate(
      { email },
      { 
        isNotified: true,
        dateUpdated: new Date()
      }
    );

    await Logger.info('Invitation sent successfully', {
      adminUserId: userId,
      targetEmail: email,
      invitationId: invitation.id
    });

    return NextResponse.json({ 
      success: true, 
      invitation,
      message: "Invitation sent successfully" 
    });

  } catch (error) {
    await Logger.error('Failed to send invitation', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      path: request.url,
      method: request.method,
      userId: getAuth(request).userId
    });

    return new NextResponse(
      JSON.stringify({ 
        message: error instanceof Error ? error.message : "Error sending invitation" 
      }), 
      { status: 500 }
    );
  }
} 