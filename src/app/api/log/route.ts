import { Logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const headersList = headers();
    const body = await request.json();
    const { level, action, details, timestamp } = body;

    // Add additional context
    const context = {
      ip: headersList.get('x-forwarded-for') || 'unknown',
      userAgent: headersList.get('user-agent'),
      timestamp: new Date(timestamp),
    };

    await Logger.log(level, action, {
      ...details,
      context,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing log:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
} 