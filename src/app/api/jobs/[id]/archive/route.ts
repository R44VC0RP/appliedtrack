import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { JobModel } from '@/models/Job';
import { Logger } from '@/lib/logger';

/**
 * Archives a job for a specific user
 * @param request - The incoming request object
 * @param params - Route parameters containing the job ID
 * @returns NextResponse with the updated job or error message
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    await Logger.warning('Unauthorized archive job attempt', {
      jobId: params.id,
      path: request.url,
    });
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const jobData = await request.json();
  const jobId = params.id;

  // Make sure the user is the owner of the job
  const job = await JobModel.findOne({ id: jobId, userId });
  if (!job) {
    await Logger.warning('Job not found or unauthorized access', {
      jobId,
      userId,
      action: 'ARCHIVE_JOB',
    });
    return new NextResponse("Job not found", { status: 404 });
  }

  try {
    await Logger.info('Attempting to archive job', {
      jobId,
      userId,
      action: 'ARCHIVE_JOB',
    });

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
      await Logger.error('Failed to archive job after validation', {
        jobId,
        userId,
        action: 'ARCHIVE_JOB',
      });
      return new NextResponse("Job not found", { status: 404 });
    }

    await Logger.info('Job archived successfully', {
      jobId,
      userId,
      action: 'ARCHIVE_JOB',
    });
    return NextResponse.json(updatedJob);
  } catch (error) {
    await Logger.error('Error archiving job', {
      jobId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'ARCHIVE_JOB',
    });
    return new NextResponse("Error archiving job", { status: 500 });
  }
}