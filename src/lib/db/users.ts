import { createClerkClient } from '@clerk/backend';
import { prisma } from '@/lib/prisma';
import { User, UserRole, UserTier } from '@prisma/client';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export async function getUser(userId: string): Promise<User & { email: string; name: string }> {
  try {
    // Get user data from Prisma
    const dbUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    // Get user data from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    
    if (!dbUser) {
      throw new Error('User not found in database');
    }

    if (!clerkUser) {
      throw new Error('User not found in Clerk');
    }

    // Combine the data from both sources
    const combinedUser = {
      ...dbUser,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
    };

    return combinedUser;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Helper function to create a new user in Prisma if they don't exist
export async function createUserIfNotExists(userId: string): Promise<User> {
  try {
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        tier: UserTier.free,
        role: UserRole.user,
        about: '',
        onboardingComplete: false
      }
    });

    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}