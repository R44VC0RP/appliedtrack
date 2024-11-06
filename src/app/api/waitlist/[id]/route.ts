'use server';

import { NextResponse, NextRequest } from 'next/server';
import { WaitlistUserModel } from '@/models/WaitlistUser';
import { Logger } from '@/lib/logger';

/**
 * Deletes a user from the waitlist by their ID
 * 
 * @param request - The incoming Next.js request object
 * @param params - Route parameters containing the user ID
 * @returns NextResponse with success message or error status
 * 
 * @throws {Error} When database operation fails
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    await Logger.info('Attempting to delete waitlist user', {
      userId: id,
      action: 'DELETE_WAITLIST_USER'
    });

    const deletedUser = await WaitlistUserModel.findByIdAndDelete(id);
    
    if (!deletedUser) {
      await Logger.warning('Waitlist user not found for deletion', {
        attemptedUserId: id,
        action: 'DELETE_WAITLIST_USER'
      });
      return new NextResponse("User not found", { status: 404 });
    }

    await Logger.info('Waitlist user deleted successfully', {
      userId: id,
      email: deletedUser.email, // Assuming email exists in the model
      action: 'DELETE_WAITLIST_USER'
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    await Logger.error('Error deleting waitlist user', {
      userId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'DELETE_WAITLIST_USER'
    });
    
    return new NextResponse("Error deleting waitlist user", { status: 500 });
  }
}
