'use server';

import { clerkClient } from "@clerk/nextjs/server";
import { Logger } from '@/lib/logger';

/**
 * Retrieves a user from Clerk by their user ID
 * @param {string} userId - The Clerk user ID
 * @returns {Promise<import('@clerk/nextjs').User>} The user object from Clerk
 * @throws {Error} If the user cannot be found or there's an API error
 */
export async function getUser(userId) {
  try {
    const user = await clerkClient().users.getUser(userId);
    await Logger.info('Retrieved user from Clerk', { userId });
    return user;
  } catch (error) {
    await Logger.error('Failed to retrieve user from Clerk', {
      userId,
      errorMessage: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Retrieves a user from Clerk by their email address
 * @param {string} email - The email address to look up
 * @returns {Promise<import('@clerk/nextjs').User>} The user object from Clerk
 * @throws {Error} If the user cannot be found or there's an API error
 */
export async function getUserByEmail(email) {
  try {
    const user = await clerkClient().users.getUserByEmailAddress({ email });
    await Logger.info('Retrieved user by email from Clerk', { email });
    return user;
  } catch (error) {
    await Logger.error('Failed to retrieve user by email from Clerk', {
      email,
      errorMessage: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Gets the primary email address for a user
 * @param {string} userId - The Clerk user ID
 * @returns {Promise<string>} The user's primary email address
 * @throws {Error} If the user cannot be found or has no email addresses
 */
export async function getUserEmail(userId) {
  try {
    const user = await getUser(userId);
    if (!user.emailAddresses?.length) {
      throw new Error('User has no email addresses');
    }
    const email = user.emailAddresses[0].emailAddress;
    await Logger.info('Retrieved user email address', { userId, email });
    return email;
  } catch (error) {
    await Logger.error('Failed to retrieve user email', {
      userId,
      errorMessage: error.message,
      stack: error.stack
    });
    throw error;
  }
}

