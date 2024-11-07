import { NextResponse } from 'next/server';
import { ConfigModel } from '@/models/Config';

import { Logger } from '@/lib/logger';

// Cache duration in seconds (24 hours)
const CACHE_MAX_AGE = 86400;

interface TierResponse {
  tierLimits?: Record<string, any>;
  error?: string;
}

export async function fetchTierLimits(): Promise<TierResponse> {
  try {
    const config = await ConfigModel.findOne({}, { 
      tierLimits: 1, 
      _id: 0
    }).lean();

    if (!config) {
      await Logger.warning('Tier config not found in database', {
        action: 'GET_TIER_CONFIG',
        timestamp: new Date()
      });
      
      return { error: 'Tier configuration not found' };
    }

    await Logger.info('Tier config retrieved successfully', {
      action: 'GET_TIER_CONFIG',
      timestamp: new Date()
    });

    return { tierLimits: config.tierLimits };

  } catch (error) {
    await Logger.error('Error fetching tier configuration', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action: 'GET_TIER_CONFIG'
    });

    return { error: 'Internal server error' };
  }
}

export async function GET() {
  const response = await fetchTierLimits();
  
  if (response.error) {
    return NextResponse.json(
      { error: response.error },
      { status: response.error === 'Tier configuration not found' ? 404 : 500 }
    );
  }

  return NextResponse.json(response.tierLimits, {
    headers: {
      'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate`,
      'Content-Type': 'application/json',
    },
  });
}
