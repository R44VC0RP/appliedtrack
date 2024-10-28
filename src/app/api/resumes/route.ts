'use server';

import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { ResumeModel } from '@/models/Resume';

mongoose.connect(process.env.MONGODB_URI as string);

export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const resumes = await ResumeModel.find({ userId });
    return NextResponse.json(resumes);
  } catch (error) {
    console.error("Error fetching resumes:", error);
    return new NextResponse("Error fetching resumes", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }


  const resumeData = await request.json();
  const { fileUrl, fileId, resumeId, fileName } = resumeData;

  if (!fileUrl || !fileId || !resumeId || !fileName) {
    return new NextResponse("Missing required fields", { status: 400 });
  }

  try {
    const newResume = new ResumeModel({
      userId,
      fileUrl,
      fileId,
      fileName,
      resumeId,
      dateCreated: new Date(),
      dateUpdated: new Date(),
    });

    const savedResume = await newResume.save();
    return NextResponse.json(savedResume);
  } catch (error) {
    console.error("Error saving resume:", error);
    return new NextResponse("Error saving resume", { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const resumeId = searchParams.get('resumeId');

  if (!resumeId) {
    return new NextResponse("Missing resumeId", { status: 400 });
  }

  try {
    const deletedResume = await ResumeModel.findOneAndDelete({ userId, resumeId });
    
    if (!deletedResume) {
      return new NextResponse("Resume not found", { status: 404 });
    }
    
    return NextResponse.json({ message: "Resume deleted successfully" });
  } catch (error) {
    console.error("Error deleting resume:", error);
    return new NextResponse("Error deleting resume", { status: 500 });
  }
}
