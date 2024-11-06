import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { LogModel } from '@/models/Log';
import { Logger } from '@/lib/logger';
import { UserModel } from '@/models/User';

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
    const user = await UserModel.findOne({ userId });
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

    // Build query
    const query: any = {};
    
    if (level) query.level = level;
    if (service) query.service = service;
    if (ip) query.ip = ip;
    if (action) query.action = { $regex: action, $options: 'i' };
    
    // Add search functionality across multiple fields
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { service: { $regex: search, $options: 'i' } },
        { 'details.message': { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } }
      ];
    }

    // Handle time range
    if (timeRange === 'custom') {
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      if (startDate && endDate) {
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
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
        query.timestamp = {
          $gte: new Date(now.getTime() - ranges[timeRange])
        };
      }
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [logs, total] = await Promise.all([
      LogModel.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      LogModel.countDocuments(query)
    ]);


    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    await Logger.error('Error in logs API route', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 