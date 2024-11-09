"use server"

import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { User, UserModel } from '@/models/User';
import { JobModel } from '@/models/Job';
import { Logger } from '@/lib/logger';
import { fetchTierLimits } from '@/lib/tierlimits';
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI as string);

/**
 * Gets or creates a user in the database
 * @param userId - The Clerk user ID
 * @returns Promise<User> The user object
 */
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

/**
 * GET endpoint to retrieve jobs for a user
 * @param request - Next.js request object
 * @returns Jobs list with processed cover letter fields
 */
export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    await Logger.warning('Unauthorized GET jobs attempt', {
      path: request.url,
      method: 'GET'
    });
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const user = await getOrCreateUser(userId);

    const tierLimits = await fetchTierLimits();

    console.log('new tierLimits', tierLimits)

    let limit = tierLimits.tierLimits?.free?.jobs || 10; // Default limit for free tier
    if (user.tier === 'pro') {
      limit = tierLimits.tierLimits?.pro?.jobs || 50;
    } else if (user.tier === 'power') {
      limit = tierLimits.tierLimits?.power?.jobs || 0; // No limit
    }
    const jobs = await JobModel.find({ userId })
      .limit(limit)
      .lean()
      .exec();

    await Logger.info('Jobs retrieved successfully', {
      userId,
      jobCount: jobs.length,
      tier: user.tier
    });

    // Ensure all jobs have the required cover letter fields
    const processedJobs = jobs.map(job => ({
      ...job,
      coverLetter: job.coverLetter || {
        url: '',
        status: 'not_started',
        dateGenerated: null
      }
    }));
    
    return NextResponse.json(processedJobs);
  } catch (error) {
    await Logger.error('Error retrieving jobs', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new NextResponse("Error retrieving jobs", { status: 500 });
  }
}

/**
 * POST endpoint to create a new job
 * @param request - Next.js request object containing job data
 * @returns Created job object
 */
export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    await Logger.warning('Unauthorized POST job attempt', {
      path: request.url,
      method: 'POST'
    });
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    await getOrCreateUser(userId);
    
    const jobData = await request.json();

    if (!jobData.company || !jobData.position) {
      await Logger.warning('Invalid job data submitted', {
        userId,
        jobData
      });
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if the user has reached the limit for their tier
    const tierLimits = await fetchTierLimits();

    const job = new JobModel({
      ...jobData,
      userId,
      id: new mongoose.Types.ObjectId().toString(), // Generate a custom id
      dateCreated: new Date(),
      dateUpdated: new Date(),
      status: jobData.status || "Yet to Apply", // Default to "Yet to Apply" if not provided
      coverLetter: {
        url: '',  // or null
        status: 'not_started',
        dateGenerated: null
      }
    });
    
    const savedJob = await job.save();

    

    await Logger.info('Job created successfully', {
      userId,
      jobId: job.id,
      company: jobData.company,
      position: jobData.position
    });

    return NextResponse.json(savedJob);
  } catch (error) {
    await Logger.error('Error creating job', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
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

/**
 * PUT endpoint to update an existing job
 * @param request - Next.js request object containing updated job data
 * @returns Updated job object
 */
export async function PUT(request: NextRequest) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    await Logger.warning('Unauthorized PUT job attempt', {
      path: request.url,
      method: 'PUT'
    });
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const jobData = await request.json();

    if (!jobData.id) {
      await Logger.warning('Missing job ID in update request', {
        userId,
        jobData
      });
      return new NextResponse("Missing job id", { status: 400 });
    }

    // Verify job ownership before update
    const existingJob = await JobModel.findOne({ id: jobData.id });
    if (!existingJob) {
      await Logger.warning('Attempted to update non-existent job', {
        userId,
        jobId: jobData.id
      });
      return new NextResponse("Job not found", { status: 404 });
    }

    if (existingJob.userId !== userId) {
      await Logger.warning('Unauthorized job modification attempt', {
        userId,
        jobId: jobData.id,
        ownerUserId: existingJob.userId
      });
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Process Hunter data if present
    if (jobData.hunterData) {
      jobData.hunterData = {
        ...jobData.hunterData,
        dateUpdated: new Date().toISOString()
      };
    }

    // Handle coverLetter update
    if (jobData.coverLetter) {
      jobData.coverLetter = {
        url: jobData.coverLetter.url,
        status: jobData.coverLetter.status,
        dateGenerated: jobData.coverLetter.dateGenerated,
        dateUpdated: new Date().toISOString()
      };
    }

    const updatedJob = await JobModel.findOneAndUpdate(
      { id: jobData.id, userId },
      { 
        ...jobData, 
        dateUpdated: new Date(),
        status: jobData.status || "Yet to Apply"
      },
      { new: true, runValidators: true }
    );

    await Logger.info('Job updated successfully', {
      userId,
      jobId: jobData.id,
      updates: {
        status: jobData.status,
        hasHunterData: !!jobData.hunterData,
        hasCoverLetter: !!jobData.coverLetter
      }
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    await Logger.error('Error updating job', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new NextResponse("Error updating job", { status: 500 });
  }
}
