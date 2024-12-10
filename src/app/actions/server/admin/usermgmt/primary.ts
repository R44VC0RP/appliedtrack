"use server"

import { createClerkClient } from "@clerk/backend";
import { currentUser } from "@clerk/nextjs/server";

import { Logger } from '@/lib/logger';
import { srv_getCompleteUserProfile, CompleteUserProfile, srv_authAdminUser } from "@/lib/useUser";
import { prisma } from "@/lib/prisma";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

// Types
interface UpdateUserParams {
  targetUserId: string;
  role?: string;
  tier?: string;
  onboardingComplete?: boolean;
}

/**
 * Server action to fetch all users with combined data
 */
export async function srv_getUsers(adminUserId: string) {
  try {
    const authAdminUser = await srv_authAdminUser();
    const userAuth = await srv_getCompleteUserProfile(adminUserId);

    if (!authAdminUser || userAuth?.role !== 'admin') {
      await Logger.warning('Non-admin user attempted to fetch users', {
        userId: adminUserId,
        userRole: userAuth?.role
      });
      throw new Error("Forbidden");
    }

    const tenantUsers = await clerkClient.users.getUserList({
      limit: 500,
    });



    const combinedUsers: (CompleteUserProfile | null)[] = await Promise.all(
      tenantUsers.data.map(async (user) => {
        if (process.env.NODE_ENV === 'development') {
          await prisma.user.update({
            where: { id: user.id },
            data: { userType: "dev" }
          });
        }
        const userData = await srv_getCompleteUserProfile(user.id);
        return userData;
      })
    );

    return combinedUsers.filter((user): user is NonNullable<typeof user> => user !== null);

  } catch (error) {
    await Logger.error('Error fetching users in admin action', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Server action to update user roles and tiers
 */
export async function srv_updateUser(adminUserId: string, params: UpdateUserParams) {
  try {
    const authAdminUser = await srv_authAdminUser();
    const userAuth = await srv_getCompleteUserProfile(adminUserId);

    if (!authAdminUser || userAuth?.role !== 'admin') {
      await Logger.warning('Non-admin user attempted to update user', {
        userId: adminUserId,
        userRole: userAuth?.role
      });
      throw new Error("Forbidden");
    }

    const { targetUserId, role, tier, onboardingComplete } = params;

    await Logger.info('Admin attempting to update user', {
      adminUserId,
      targetUserId,
      updatedRole: role,
      updatedTier: tier
    });

    // Create update data with only provided fields
    const updateData: any = {
      updatedAt: new Date()
    };
    if (role) updateData.role = role;
    if (tier) updateData.tier = tier;
    if (onboardingComplete !== undefined) updateData.onboardingComplete = onboardingComplete;

    // Update in Prisma
    await prisma.user.upsert({
      where: { id: targetUserId },
      create: {
        id: targetUserId,
        ...updateData,
        createdAt: new Date()
      },
      update: updateData
    });

    // Update metadata in Clerk if role is changed
    if (role) {
      await clerkClient.users.updateUser(targetUserId, {
        privateMetadata: { role },
      });
    }

    await Logger.info('Successfully updated user', {
      adminUserId,
      targetUserId,
      updatedFields: updateData
    });

    return { success: true };

  } catch (error) {
    await Logger.error('Error updating user in admin action', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}