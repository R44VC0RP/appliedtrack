'use server';

import { clerkClient } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { UserModel } from "@/models/User";
import mongoose from 'mongoose';
import { Logger } from '@/lib/logger';

// Ensure MongoDB connection
mongoose.connect(process.env.MONGODB_URI as string);

/**
 * GET endpoint to fetch all users with combined data from Clerk and MongoDB
 * @param request - The incoming request object
 * @returns NextResponse with combined user data or error response
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      await Logger.warning('Unauthorized access attempt to admin users endpoint', {
        path: request.url,
        method: 'GET'
      });
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await UserModel.findOne({ userId });
    if (!currentUser || currentUser.role !== 'admin') {
      await Logger.warning('Non-admin user attempted to access admin users endpoint', {
        userId,
        userRole: currentUser?.role,
        path: request.url
      });
      return new NextResponse("Forbidden", { status: 403 });
    }

    await Logger.info('Admin fetching all users', {
      adminUserId: userId
    });

    // Get all users from Clerk
    const clerkUsers = await clerkClient.users.getUserList();

    // Get all users from MongoDB
    const dbUsers = await UserModel.find({});

    // Combine the data
    const combinedUsers = clerkUsers.data.map(clerkUser => {
      const dbUser = dbUsers.find(du => du.userId === clerkUser.id);
      
      return {
        userId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        tier: dbUser?.tier || "free",
        role: dbUser?.role || "user",
        lastSignIn: clerkUser.lastSignInAt,
        dateCreated: dbUser?.dateCreated || clerkUser.createdAt
      };
    });

    await Logger.info('Successfully fetched combined user data', {
      adminUserId: userId,
      userCount: combinedUsers.length
    });

    return NextResponse.json(combinedUsers);

  } catch (error) {
    await Logger.error('Error fetching users in admin endpoint', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      path: request.url
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * PUT endpoint to update user roles and tiers
 * @param request - The incoming request object containing userId, role, and/or tier
 * @returns NextResponse indicating success or error
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      await Logger.warning('Unauthorized access attempt to update user', {
        path: request.url,
        method: 'PUT'
      });
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await UserModel.findOne({ userId });
    if (!currentUser || currentUser.role !== 'admin') {
      await Logger.warning('Non-admin user attempted to update user', {
        userId,
        userRole: currentUser?.role,
        path: request.url
      });
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { userId: targetUserId, role, tier } = body;

    await Logger.info('Admin attempting to update user', {
      adminUserId: userId,
      targetUserId,
      updatedRole: role,
      updatedTier: tier
    });

    // Create update object with only provided fields
    const updateFields: any = {
      dateUpdated: new Date()
    };
    if (role) updateFields.role = role;
    if (tier) updateFields.tier = tier;

    // Update in MongoDB
    await UserModel.findOneAndUpdate(
      { userId: targetUserId },
      { 
        $set: updateFields,
        $setOnInsert: {
          dateCreated: new Date()
        }
      },
      { upsert: true, new: true }
    );

    // Update metadata in Clerk if role is changed
    if (role) {
      await clerkClient.users.updateUser(targetUserId, {
        privateMetadata: { role },
      });
    }

    await Logger.info('Successfully updated user', {
      adminUserId: userId,
      targetUserId,
      updatedFields: updateFields
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    await Logger.error('Error updating user in admin endpoint', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      path: request.url
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
