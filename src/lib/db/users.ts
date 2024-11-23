import { UserModel } from '@/models/User';
import { createClerkClient } from '@clerk/backend';
import { User } from '@/models/User';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export async function getUser(userId: string): Promise<User & { email: string; name: string }> {
  try {
    // Get user data from MongoDB
    const dbUser = await UserModel.findOne({ userId: userId });
    
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
      ...dbUser.toObject(),
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
    };

    return combinedUser as User & { email: string; name: string };
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Helper function to create a new user in MongoDB if they don't exist
export async function createUserIfNotExists(userId: string): Promise<User> {
  try {
    let user = await UserModel.findOne({ userId });

    if (!user) {
      user = await UserModel.create({
        userId,
        tier: 'free',
        role: 'user',
        about: '',
        dateCreated: new Date(),
        dateUpdated: new Date(),
        onboardingComplete: false
      });
    }

    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
} 