import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { JobModel } from '@/models/Job';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI as string);

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const jobId = params.id;
  if (!jobId) {
    return new NextResponse("Missing job id", { status: 400 });
  }

  const jobData = await request.json();

  try {
    const updatedJob = await JobModel.findOneAndUpdate(
      { id: jobId, userId },
      { 
        ...jobData,
        isArchived: true,
        dateUpdated: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedJob) {
      return new NextResponse("Job not found", { status: 404 });
    }

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error("Error archiving job:", error);
    return new NextResponse("Error archiving job", { status: 500 });
  }
}