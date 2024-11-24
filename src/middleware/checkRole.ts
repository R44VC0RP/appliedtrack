import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function checkRole(request: NextRequest, allowedRoles: UserRole[]) {
  const { userId } = getAuth(request);
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (!allowedRoles.includes(user.role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return null; // No error, proceed with the request
  } catch (error) {
    console.error("Error checking role:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
