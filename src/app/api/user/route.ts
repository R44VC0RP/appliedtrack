import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { UserModel } from '@/models/User';

mongoose.connect(process.env.MONGODB_URI as string);

export const PUT = async (request: NextRequest) => {
  const { userId } = getAuth(request);
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userData = await request.json();
  const { about } = userData;

  try {
    const user = await UserModel.findOneAndUpdate(
      { userId },
      { $set: { about, dateUpdated: new Date() } },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return new NextResponse("Error updating user", { status: 500 });
  }
}

export const GET = async (request: NextRequest) => {
  const { userId } = getAuth(request);
  const user = await UserModel.findOne({ userId });
  return NextResponse.json(user);
}
