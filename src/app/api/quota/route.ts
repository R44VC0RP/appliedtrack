import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getUserQuota } from '@/utils/quota-manager';
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';

// Define the expected response type
interface QuotaResponse {
  jobs: {
    used: number;
    limit: number;
    remaining: number;
  };
  coverLetters: {
    used: number;
    limit: number;
    remaining: number;
  };
  emails: {
    used: number;
    limit: number;
    remaining: number;
  };
  resetDate: Date;
}

export async function GET(request: Request) {
  try {
    // Ensure DB connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    const { userId } = getAuth(request as NextRequest);
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const quota = await getUserQuota(userId);

    // Validate the quota response
    const validatedQuota: QuotaResponse = {
      jobs: {
        used: Number(quota.jobs.used) || 0,
        limit: Number(quota.jobs.limit) || 0,
        remaining: Number(quota.jobs.remaining) || 0,
      },
      coverLetters: {
        used: Number(quota.coverLetters.used) || 0,
        limit: Number(quota.coverLetters.limit) || 0,
        remaining: Number(quota.coverLetters.remaining) || 0,
      },
      emails: {
        used: Number(quota.emails.used) || 0,
        limit: Number(quota.emails.limit) || 0,
        remaining: Number(quota.emails.remaining) || 0,
      },
      resetDate: new Date(quota.resetDate),
    };

    // Log the response for debugging
    console.log('Quota response for user:', userId, validatedQuota);

    // Verify all numbers are valid
    if (Object.values(validatedQuota).some(category => 
      category !== null && 
      typeof category === 'object' && 
      Object.values(category).some(val => 
        typeof val === 'number' && (isNaN(val) || !isFinite(val))
      )
    )) {
      throw new Error('Invalid quota values detected');
    }

    return new NextResponse(
      JSON.stringify(validatedQuota),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in quota route:', error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Error processing request', 
        details: error instanceof Error ? error.message : 'Unknown error',
        // Return a safe default quota in case of error
        fallbackQuota: {
          jobs: { used: 0, limit: 10, remaining: 10 },
          coverLetters: { used: 0, limit: 5, remaining: 5 },
          emails: { used: 0, limit: 5, remaining: 5 },
          resetDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
        }
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 