import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { CampaignModel } from '@/models/Campaign';
import { UserModel } from '@/models/User';

mongoose.connect(process.env.MONGODB_URI as string);

export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await UserModel.findOne({ userId });
  if (!user || user.role !== 'admin') {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const campaigns = await CampaignModel.find().sort({ dateCreated: -1 });
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return new NextResponse("Error fetching campaigns", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await UserModel.findOne({ userId });
  if (!user || user.role !== 'admin') {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const data = await request.json();
    const campaign = await CampaignModel.create({
      ...data,
      dateCreated: new Date(),
      dateUpdated: new Date()
    });
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return new NextResponse("Error creating campaign", { status: 500 });
  }
} 