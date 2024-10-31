'use server';

import { clerkClient } from "@clerk/nextjs/server";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { UserModel } from "@/models/User";
import mongoose from 'mongoose';

// Ensure MongoDB connection
mongoose.connect(process.env.MONGODB_URI as string);

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const { userId } = getAuth(request);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get current user and verify admin role
    const currentUser = await UserModel.findOne({ userId });
    if (!currentUser || currentUser.role !== 'admin') {
      return new NextResponse("Forbidden", { status: 403 });
    }

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

    return NextResponse.json(combinedUsers);

  } catch (error) {
    console.error("Error fetching users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentUser = await UserModel.findOne({ userId });
    if (!currentUser || currentUser.role !== 'admin') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { userId: targetUserId, role, tier } = body;

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

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error updating user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
