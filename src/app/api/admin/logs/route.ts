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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { service: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } }
      ];
    }

    if (level) {
      query.level = level;
    }

    if (service) {
      query.service = service;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Execute query
    const totalLogs = await LogModel.countDocuments(query);
    const logs = await LogModel.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // await Logger.info('logs_accessed', {
    //   userId,
    //   query: { page, limit, search, level, service }
    // });

    return NextResponse.json({
      logs,
      pagination: {
        total: totalLogs,
        page,
        limit,
        pages: Math.ceil(totalLogs / limit)
      }
    });

  } catch (error) {
    await Logger.error('logs_fetch_error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 