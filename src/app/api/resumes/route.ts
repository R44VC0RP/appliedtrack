'use server';

import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { ResumeModel } from '@/models/Resume';
import { Logger } from '@/lib/logger';

mongoose.connect(process.env.MONGODB_URI as string);

/**
 * GET /api/resumes
 * Retrieves all resumes for the authenticated user
 * @param request - The incoming request object
 * @returns NextResponse containing the user's resumes or error response
 */
export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    await Logger.warning('Unauthorized resume fetch attempt', {
      path: request.url,
      method: 'GET'
    });
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const resumes = await ResumeModel.find({ userId });
    await Logger.info('Resumes fetched successfully', {
      userId,
      count: resumes.length
    });
    return NextResponse.json(resumes);
  } catch (error) {
    await Logger.error('Error fetching resumes', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new NextResponse("Error fetching resumes", { status: 500 });
  }
}

/**
 * POST /api/resumes
 * Creates a new resume for the authenticated user
 * @param request - The incoming request object containing resume data
 * @returns NextResponse containing the saved resume or error response
 */
export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    await Logger.warning('Unauthorized resume creation attempt', {
      path: request.url,
      method: 'POST'
    });
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const resumeData = await request.json();
  const { fileUrl, fileId, resumeId, fileName } = resumeData;

  if (!fileUrl || !fileId || !resumeId || !fileName) {
    await Logger.warning('Invalid resume creation attempt - missing fields', {
      userId,
      providedFields: { fileUrl, fileId, resumeId, fileName }
    });
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
    await Logger.info('Resume created successfully', {
      userId,
      resumeId: savedResume.resumeId
    });
    return NextResponse.json(savedResume);
  } catch (error) {
    await Logger.error('Error saving resume', {
      userId,
      resumeData,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new NextResponse("Error saving resume", { status: 500 });
  }
}

/**
 * DELETE /api/resumes
 * Deletes a specific resume for the authenticated user
 * @param request - The incoming request object with resumeId query parameter
 * @returns NextResponse indicating success or error response
 */
export async function DELETE(request: NextRequest) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    await Logger.warning('Unauthorized resume deletion attempt', {
      path: request.url,
      method: 'DELETE'
    });
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const resumeId = searchParams.get('resumeId');

  if (!resumeId) {
    await Logger.warning('Invalid resume deletion attempt - missing resumeId', {
      userId
    });
    return new NextResponse("Missing resumeId", { status: 400 });
  }

  try {
    const deletedResume = await ResumeModel.findOneAndDelete({ userId, resumeId });
    
    if (!deletedResume) {
      await Logger.warning('Resume not found for deletion', {
        userId,
        resumeId
      });
      return new NextResponse("Resume not found", { status: 404 });
    }
    
    await Logger.info('Resume deleted successfully', {
      userId,
      resumeId
    });
    return NextResponse.json({ message: "Resume deleted successfully" });
  } catch (error) {
    await Logger.error('Error deleting resume', {
      userId,
      resumeId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new NextResponse("Error deleting resume", { status: 500 });
  }
}
