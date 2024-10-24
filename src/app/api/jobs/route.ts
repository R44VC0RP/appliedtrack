"use server"

import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { User, UserModel } from '@/models/User';
import { JobModel } from '@/models/Job';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI as string);

async function getOrCreateUser(userId: string): Promise<User> {
  let user = await UserModel.findOne({ userId });
  
  if (!user) {
    user = new UserModel({
      userId,
      tier: 'free',
      role: 'user',
      dateCreated: new Date(),
      dateUpdated: new Date()
    });
    await user.save();
  }
  
  return user;
}

export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await getOrCreateUser(userId);
  
  let limit = 10; // Default limit for free tier
  if (user.tier === 'premium') {
    limit = 50;
  } else if (user.tier === 'enterprise') {
    limit = 0; // No limit
  }
  
  const jobs = await JobModel.find({ userId })
    .limit(limit)
    .lean()
    .exec();
  
  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await getOrCreateUser(userId);
  
  const jobData = await request.json();

  if (!jobData.company || !jobData.position) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  const job = new JobModel({
    ...jobData,
    userId,
    id: new mongoose.Types.ObjectId().toString(), // Generate a custom id
    dateCreated: new Date(),
    dateUpdated: new Date(),
    status: jobData.status || "Yet to Apply", // Default to "Yet to Apply" if not provided
  });
  
  try {
    const savedJob = await job.save();
    console.log("Saved job:", savedJob);
    return NextResponse.json(savedJob);
  } catch (error) {
    console.error("Error saving job:", error);
    return new NextResponse("Error saving job", { status: 500 });
  }
}

// Add TypeScript interfaces for Hunter.io data
interface HunterEmail {
  value: string;
  type: string;
  confidence: number;
  sources: any[];
  first_name?: string;
  last_name?: string;
  position?: string;
  seniority?: string;
  department?: string;
  linkedin?: string;
  twitter?: string;
  phone_number?: string;
  verification?: {
    date: string;
    status: string;
  };
}


// Update the PUT function to handle Hunter data
export async function PUT(request: NextRequest) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const jobData = await request.json();

  if (!jobData.id) {
    return new NextResponse("Missing job id", { status: 400 });
  }

  // Process Hunter data if present
  if (jobData.hunterData) {
    jobData.hunterData = {
      domain: jobData.hunterData.data.domain,
      pattern: jobData.hunterData.data.pattern,
      organization: jobData.hunterData.data.organization,
      emails: jobData.hunterData.data.emails,
      dateUpdated: new Date().toISOString()
    };
  }

  try {
    const updatedJob = await JobModel.findOneAndUpdate(
      { id: jobData.id, userId },
      { 
        ...jobData, 
        dateUpdated: new Date(),
        status: jobData.status || "Yet to Apply"
      },
      { new: true, runValidators: true }
    );

    if (!updatedJob) {
      return new NextResponse("Job not found", { status: 404 });
    }

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error("Error updating job:", error);
    return new NextResponse("Error updating job", { status: 500 });
  }
}
