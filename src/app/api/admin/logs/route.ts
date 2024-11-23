import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { Logger } from '@/lib/logger';
import { Prisma, LogLevel } from '@prisma/client';
import { prisma } from '@/lib/prisma';


export async function GET(request: NextRequest) {
  try {
    // Auth check
    const { userId } = getAuth(request);
    if (!userId) {
      await Logger.warning('unauthorized_logs_access', { 
        message: 'Unauthorized attempt to access logs' 
      });
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Admin check
    const user = await prisma.user.findUnique({ 
      where: { id: userId }
    });
    if (!user?.role || user.role !== 'admin') {
      await Logger.warning('forbidden_logs_access', { 
        userId,
        message: 'Non-admin attempted to access logs' 
      });
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const level = searchParams.get('level') || '';
    const service = searchParams.get('service') || '';
    const ip = searchParams.get('ip') || '';
    const action = searchParams.get('action') || '';
    const timeRange = searchParams.get('timeRange') || '1h';
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause for Prisma
    const where: Prisma.LogWhereInput = {};
    
    if (level) where.level = level as LogLevel;
    if (service) where.service = service;
    if (ip) where.ip = ip;
    if (action) where.action = { contains: action };
    
    // Add search functionality across multiple fields
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { service: { contains: search } },
        { details: { path: 'message', string_contains: search } },
        { userId: { contains: search } }
      ];
    }

    // Handle time range
    if (timeRange === 'custom') {
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      if (startDate && endDate) {
        where.timestamp = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }
    } else {
      const now = new Date();
      const ranges: Record<string, number> = {
        '15m': 15 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      };
      
      if (ranges[timeRange]) {
        where.timestamp = {
          gte: new Date(now.getTime() - ranges[timeRange])
        };
      }
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const orderBy: Prisma.LogOrderByWithRelationInput = {
      [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc'
    };

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        orderBy,
        skip,
        take: limit
      }),
      prisma.log.count({ where })
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    await Logger.error('logs_fetch_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}