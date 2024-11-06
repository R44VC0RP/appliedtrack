import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { ConfigModel } from '@/models/Config';
import { UserModel } from '@/models/User';
import { Logger } from '@/lib/logger';

/**
 * Validates if the user has admin access
 * @param userId - The Clerk user ID to validate
 * @returns The user document if admin access is granted, null otherwise
 */
async function validateAdminAccess(userId: string | null) {
  if (!userId) {
    await Logger.warning('Config access attempted without user ID', {
      action: 'ADMIN_ACCESS_VALIDATION',
      status: 'FAILED',
      reason: 'NO_USER_ID'
    });
    return null;
  }

  const user = await UserModel.findOne({ userId });
  if (!user) {
    await Logger.warning('Config access attempted with invalid user', {
      action: 'ADMIN_ACCESS_VALIDATION',
      status: 'FAILED',
      reason: 'USER_NOT_FOUND',
      userId
    });
    return null;
  }

  if (user.role !== 'admin') {
    await Logger.warning('Non-admin user attempted config access', {
      action: 'ADMIN_ACCESS_VALIDATION',
      status: 'FAILED',
      reason: 'INSUFFICIENT_PERMISSIONS',
      userId,
      userRole: user.role
    });
    return null;
  }

  await Logger.info('Admin access validated successfully', {
    action: 'ADMIN_ACCESS_VALIDATION',
    status: 'SUCCESS',
    userId,
    userRole: user.role
  });
  return user;
}

/**
 * GET endpoint to retrieve system configuration
 * @param request - The incoming request object
 * @returns Configuration object or error response
 */
export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);
  
  const adminUser = await validateAdminAccess(userId);
  if (!adminUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    let config = await ConfigModel.findOne();
    
    if (!config) {
      await Logger.info('Initializing default system configuration', {
        action: 'CONFIG_CREATION',
        adminUserId: userId,
        timestamp: new Date()
      });
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

    await Logger.info('System configuration retrieved', {
      action: 'CONFIG_FETCH',
      status: 'SUCCESS',
      adminUserId: userId,
      configId: config._id,
      timestamp: new Date()
    });
    return NextResponse.json(config);
  } catch (error) {
    await Logger.error('Failed to fetch system configuration', {
      action: 'CONFIG_FETCH',
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      adminUserId: userId,
      timestamp: new Date()
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * PUT endpoint to update system configuration
 * @param request - The incoming request object containing updated configuration
 * @returns Updated configuration object or error response
 */
export async function PUT(request: NextRequest) {
  const { userId } = getAuth(request);
  
  const adminUser = await validateAdminAccess(userId);
  if (!adminUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const updates = await request.json();
    
    if (!updates.tierLimits || typeof updates.tierLimits !== 'object') {
      await Logger.warning('Invalid configuration update attempted', {
        action: 'CONFIG_UPDATE',
        status: 'FAILED',
        reason: 'INVALID_PAYLOAD',
        adminUserId: userId,
        payload: updates,
        timestamp: new Date()
      });
      return new NextResponse("Invalid request payload", { status: 400 });
    }

    await Logger.info('Processing configuration update', {
      action: 'CONFIG_UPDATE',
      status: 'IN_PROGRESS',
      adminUserId: userId,
      updates: updates.tierLimits,
      timestamp: new Date()
    });

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

    await Logger.info('System configuration updated successfully', {
      action: 'CONFIG_UPDATE',
      status: 'SUCCESS',
      adminUserId: userId,
      configId: config._id,
      updates: updates.tierLimits,
      timestamp: new Date()
    });
    return NextResponse.json(config);
  } catch (error) {
    await Logger.error('Failed to update system configuration', {
      action: 'CONFIG_UPDATE',
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      adminUserId: userId,
      timestamp: new Date()
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 