import { NextResponse, NextRequest } from 'next/server';
import { WaitlistUserModel } from '@/models/WaitlistUser';

export async function PUT(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email);
    
    const updatedUser = await WaitlistUserModel.findOneAndUpdate(
      { email },
      { 
        isNotified: true,
        dateUpdated: new Date()
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating waitlist user:", error);
    return new NextResponse("Error updating waitlist user", { status: 500 });
  }
} 