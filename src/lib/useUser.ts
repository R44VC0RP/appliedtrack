'use server';

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { UserModel, User } from "@/models/User";
import { Logger } from '@/lib/logger';

export interface CompleteUserProfile {
  // Clerk data
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  lastSignInAt: Date | null;
  createdAt: Date | null;
  
  // MongoDB data
  tier: User['tier'];
  role: User['role'];
  about: string;
  onBoardingComplete: boolean;
  dateCreated: Date;
  dateUpdated: Date;
  stripeCustomerId?: string;
  subscriptionId?: string;
}

export async function srv_getCompleteUserProfile(userId: string): Promise<CompleteUserProfile | null> {
  try {
    // Fetch user data in parallel
    const [clerkUser, dbUser] = await Promise.all([
      clerkClient.users.getUser(userId),
      UserModel.findOne({ userId })
    ]);

    if (!clerkUser) {
      await Logger.warning('Clerk user not found', { userId });
      return null;
    }

    // If no DB user exists, create one
    const mongoUser = dbUser || await UserModel.create({
      userId,
      tier: 'free',
      role: 'user',
      dateCreated: new Date(),
      dateUpdated: new Date(),
      onBoardingComplete: false,
      about: ''
    });

    await Logger.info('Complete user profile fetched', {
      userId,
      hasDbRecord: !!dbUser
    });

    return {
      // Clerk data
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      lastSignInAt: clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt) : null,
      createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt) : null,
      // MongoDB data
      tier: mongoUser.tier,
      role: mongoUser.role,
      about: mongoUser.about,
      onBoardingComplete: mongoUser.onBoardingComplete,
      dateCreated: mongoUser.dateCreated,
      dateUpdated: mongoUser.dateUpdated,
      stripeCustomerId: mongoUser.stripeCustomerId,
      subscriptionId: mongoUser.subscriptionId
    };

  } catch (error) {
    await Logger.error('Error fetching complete user profile', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function srv_authAdminUser(): Promise<boolean> {
  const user = await currentUser();
  const authUser = await UserModel.findOne({ userId: user?.id });
  return authUser?.role === 'admin';
}