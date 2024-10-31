import { NextResponse, NextRequest } from 'next/server';
import { clerkClient } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";
import { UserModel } from '@/models/User';
import { WaitlistUserModel } from '@/models/WaitlistUser';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const { userId } = getAuth(request);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify admin role from database
    const currentUser = await UserModel.findOne({ userId });
    if (!currentUser || currentUser.role !== 'admin') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { email } = await request.json();

    // Check if user exists in waitlist
    const waitlistUser = await WaitlistUserModel.findOne({ email });
    if (!waitlistUser) {
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

    return NextResponse.json({ 
      success: true, 
      invitation,
      message: "Invitation sent successfully" 
    });

  } catch (error) {
    console.error("Error sending invitation:", error);
    return new NextResponse(
      JSON.stringify({ 
        message: error instanceof Error ? error.message : "Error sending invitation" 
      }), 
      { status: 500 }
    );
  }
} 