import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { CampaignModel } from '@/models/Campaign';
import { UserModel } from '@/models/User';

// Move this to a separate database config file
mongoose.connect(process.env.MONGODB_URI as string);

/**
 * DELETE /api/admin/campaigns/[id]
 * 
 * Deletes a specific campaign by ID. Only accessible by admin users.
 * 
 * @param request - The incoming request object
 * @param params - Route parameters containing campaign ID
 * @returns NextResponse with success message or error
 * 
 * @throws 401 - If user is not authenticated
 * @throws 403 - If user is not an admin
 * @throws 404 - If campaign is not found
 * @throws 500 - If there's a server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate authentication
    const { userId } = getAuth(request);
    if (!userId) {
      return new NextResponse("Unauthorized: Authentication required", { status: 401 });
    }

    // Validate admin privileges
    const user = await UserModel.findOne({ userId });
    if (!user || user.role !== 'admin') {
      return new NextResponse("Forbidden: Admin access required", { status: 403 });
    }

    // Validate campaign ID format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return new NextResponse("Invalid campaign ID format", { status: 400 });
    }

    // Delete campaign
    const deletedCampaign = await CampaignModel.findByIdAndDelete(params.id);
    if (!deletedCampaign) {
      return new NextResponse("Campaign not found", { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Campaign deleted successfully",
      campaignId: params.id
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return new NextResponse(
      "Internal server error while deleting campaign", 
      { status: 500 }
    );
  }
} 