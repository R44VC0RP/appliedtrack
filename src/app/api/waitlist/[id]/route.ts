'use server';

import { NextResponse, NextRequest } from 'next/server';
import { WaitlistUserModel } from '@/models/WaitlistUser';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const deletedUser = await WaitlistUserModel.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting waitlist user:", error);
    return new NextResponse("Error deleting waitlist user", { status: 500 });
  }
}
