import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { JobModel } from '@/models/Job';
import { Logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    await Logger.warning('Unauthorized GET job details attempt', {
      jobId: params.id,
      path: request.url,
    });
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const job = await JobModel.findOne({
      id: params.id,
      userId
    });

    if (!job) {
      await Logger.warning('Job not found or unauthorized access', {
        jobId: params.id,
        userId,
        action: 'GET_JOB_DETAILS',
      });
      return new NextResponse("Job not found", { status: 404 });
    }

    await Logger.info('Job details retrieved successfully', {
      jobId: params.id,
      userId,
      action: 'GET_JOB_DETAILS',
    });

    return NextResponse.json(job);
  } catch (error) {
    await Logger.error('Error fetching job details', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      jobId: params.id,
      userId,
      action: 'GET_JOB_DETAILS',
    });
    return new NextResponse("Internal error", { status: 500 });
  }
} 