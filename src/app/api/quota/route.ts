import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { getUserQuota } from '@/utils/quota-manager';

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const quota = await getUserQuota(userId);
    return NextResponse.json(quota);
  } catch (error) {
    console.error('Error fetching quota:', error);
    return new NextResponse("Error fetching quota", { status: 500 });
  }
} 