import { NextResponse } from 'next/server';
import { ConfigModel } from '@/models/Config';
import { fetchTierLimits } from '@/lib/tierlimits';
import { Logger } from '@/lib/logger';

// Cache duration in seconds (24 hours)
const CACHE_MAX_AGE = 86400;

interface TierResponse {
  tierLimits?: Record<string, any>;
  error?: string;
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
