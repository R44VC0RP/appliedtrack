import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { ConfigModel } from '@/models/Config';
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
    let config = await ConfigModel.findOne();
    
    if (!config) {
      // Create default config if none exists
      config = await ConfigModel.create({
        tierLimits: {
          free: { jobs: 10, coverLetters: 5, contactEmails: 2 },
          pro: { jobs: 50, coverLetters: 25, contactEmails: 50 },
          power: { jobs: -1, coverLetters: -1, contactEmails: 100 } // -1 means unlimited
        }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    return new NextResponse("Error fetching config", { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await UserModel.findOne({ userId });
  if (!user || user.role !== 'admin') {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const updates = await request.json();
    
    const config = await ConfigModel.findOneAndUpdate(
      {},
      { 
        $set: {
          tierLimits: updates.tierLimits,
          dateUpdated: new Date()
        }
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating config:', error);
    return new NextResponse("Error updating config", { status: 500 });
  }
} 