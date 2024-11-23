'use server';

import { createClerkClient } from "@clerk/backend";
import { currentUser } from "@clerk/nextjs/server";
import { Logger } from '@/lib/logger';
import { plain } from "./plain";

import { UserRole, UserTier } from '@prisma/client';
import { prisma } from "./prisma";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export interface CompleteUserProfile {
  // Clerk data
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  lastSignInAt: Date | null;
  createdAt: Date | null;
  
  // Prisma data
  tier: UserTier;
  role: UserRole;
  about: string | null;
  onboardingComplete: boolean;
  stripeCustomerId?: string | null;
  subscriptionId?: string | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean | null;
  updatedAt: Date;
}

export async function srv_getCompleteUserProfile(userId: string): Promise<CompleteUserProfile | null> {
  try {
    // Fetch user data in parallel
    const [clerkUser, dbUser] = await Promise.all([
      clerkClient.users.getUser(userId).catch(async (error) => {
        await Logger.warning('Clerk user not found', { userId });
        return null;
      }),
      prisma.user.findUnique({ where: { id: userId } })
    ]);

    if (!clerkUser) {
      await Logger.warning('Clerk user not found', { userId });
      return null;
    }

    // If no DB user exists, create one
    const prismaUser = dbUser || await prisma.user.create({
      data: {
        id: userId,
        tier: 'free',
        role: 'user',
        onboardingComplete: false,
        about: ''
      }
    });

    return plain({
      // Clerk data
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      lastSignInAt: clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt) : null,
      createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt) : null,
      
      // Prisma data
      tier: prismaUser.tier,
      role: prismaUser.role,
      about: prismaUser.about,
      onboardingComplete: prismaUser.onboardingComplete,
      stripeCustomerId: prismaUser.stripeCustomerId,
      subscriptionId: prismaUser.subscriptionId,
      currentPeriodEnd: prismaUser.currentPeriodEnd,
      cancelAtPeriodEnd: prismaUser.cancelAtPeriodEnd,
      updatedAt: prismaUser.updatedAt
    });

  } catch (error) {
    await Logger.error('Error fetching complete user profile', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function srv_getAllCompleteUserProfiles(): Promise<CompleteUserProfile[]> {
  const users = await prisma.user.findMany();
  const userProfiles = await Promise.all(
    users.map(user => srv_getCompleteUserProfile(user.id))
  );
  return userProfiles.filter((profile): profile is CompleteUserProfile => profile !== null);
}

export async function srv_authAdminUser(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  return dbUser?.role === 'admin';
}