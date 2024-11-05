import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { ConfigModel } from '@/models/Config';
import { UserModel } from '@/models/User';
import { Logger } from '@/lib/logger';

// Helper function to validate admin access
async function validateAdminAccess(userId: string | null) {
  if (!userId) {
    await Logger.warning('Unauthorized config access attempt', { userId });
    return null;
  }

  const user = await UserModel.findOne({ userId });
  if (!user || user.role !== 'admin') {
    await Logger.warning('Non-admin attempted to access config', { 
      userId,
      userRole: user?.role 
    });
    return null;
  }

  return user;
}

export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);
  
  const adminUser = await validateAdminAccess(userId);
  if (!adminUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    let config = await ConfigModel.findOne();
    
    if (!config) {
      await Logger.info('Creating default config', { adminUserId: userId });
      config = await ConfigModel.create({
        tierLimits: {
          free: { jobs: 10, coverLetters: 5, contactEmails: 2 },
          pro: { jobs: 50, coverLetters: 25, contactEmails: 50 },
          power: { jobs: -1, coverLetters: -1, contactEmails: 100 }
        },
        dateCreated: new Date(),
        dateUpdated: new Date()
      });
    }

    await Logger.info('Config fetched successfully', { 
      adminUserId: userId,
      configId: config._id 
    });
    return NextResponse.json(config);
  } catch (error) {
    await Logger.error('Error fetching config', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      adminUserId: userId
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { userId } = getAuth(request);
  
  const adminUser = await validateAdminAccess(userId);
  if (!adminUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const updates = await request.json();
    
    // Validate the update payload
    if (!updates.tierLimits || typeof updates.tierLimits !== 'object') {
      await Logger.warning('Invalid config update payload', { 
        adminUserId: userId,
        payload: updates 
      });
      return new NextResponse("Invalid request payload", { status: 400 });
    }

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

    await Logger.info('Config updated successfully', {
      adminUserId: userId,
      configId: config._id,
      updates: updates.tierLimits
    });
    return NextResponse.json(config);
  } catch (error) {
    await Logger.error('Error updating config', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      adminUserId: userId
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 