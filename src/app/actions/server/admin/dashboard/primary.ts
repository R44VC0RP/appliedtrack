"use server"

import { createClerkClient } from "@clerk/backend";
import { Logger } from '@/lib/logger';
import { srv_authAdminUser } from "@/lib/useUser";
import { prisma } from "@/lib/prisma";
import { UserTier } from "@prisma/client";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

interface UserStats {
  totalUsers: number;
  tierDistribution: {
    free: number;
    pro: number;
    power: number;
  };
  userGrowth: {
    date: string;
    count: number;
  }[];
}

export async function srv_getDashboardStats(): Promise<UserStats> {
  try {
    const authAdminUser = await srv_authAdminUser();
    if (!authAdminUser) {
      throw new Error("Forbidden");
    }

    // Get all users from Clerk
    const clerkUsers = await clerkClient.users.getUserList();
    
    // Get user profiles from database
    const dbUsers = await prisma.user.findMany({
      select: {
        tier: true,
      }
    });

    // Calculate tier distribution
    const tierDistribution = {
      free: dbUsers.filter(user => user.tier === UserTier.free).length,
      pro: dbUsers.filter(user => user.tier === UserTier.pro).length,
      power: dbUsers.filter(user => user.tier === UserTier.power).length,
    };

    // Calculate user growth over time
    const usersByDate = clerkUsers.data.reduce((acc: { [key: string]: number }, user) => {
      const date = new Date(user.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const userGrowth = Object.entries(usersByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalUsers: clerkUsers.data.length,
      tierDistribution,
      userGrowth,
    };
  } catch (error) {
    await Logger.error('Error fetching dashboard stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}
