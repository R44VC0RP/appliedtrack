import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { CampaignModel } from '@/models/Campaign';
import { UserModel } from '@/models/User';

mongoose.connect(process.env.MONGODB_URI as string);

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await UserModel.findOne({ userId });
  if (!user || user.role !== 'admin') {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const deletedCampaign = await CampaignModel.findByIdAndDelete(params.id);
    
    if (!deletedCampaign) {
      return new NextResponse("Campaign not found", { status: 404 });
    }

    return NextResponse.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return new NextResponse("Error deleting campaign", { status: 500 });
  }
} 