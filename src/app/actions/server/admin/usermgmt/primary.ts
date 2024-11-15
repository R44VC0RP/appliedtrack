"use server"

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { UserModel } from "@/models/User";
import { Logger } from '@/lib/logger';
import { srv_getCompleteUserProfile, CompleteUserProfile, srv_authAdminUser } from "@/lib/useUser";

// Types
interface UpdateUserParams {
  targetUserId: string;
  role?: string;
  tier?: string;
  onBoardingComplete?: boolean;
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

    const tenantUsers = await clerkClient.users.getUserList();

    const combinedUsers: (CompleteUserProfile | null)[] = await Promise.all(
      tenantUsers.data.map(async (user) => {
        return await srv_getCompleteUserProfile(user.id);
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

    const { targetUserId, role, tier, onBoardingComplete } = params;

    await Logger.info('Admin attempting to update user', {
      adminUserId,
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
    if (onBoardingComplete !== undefined) updateFields.onBoardingComplete = onBoardingComplete;

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
      adminUserId,
      targetUserId,
      updatedFields: updateFields
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