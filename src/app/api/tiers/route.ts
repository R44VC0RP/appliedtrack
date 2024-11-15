"use server"

import { NextResponse, NextRequest } from 'next/server';
import { fetchTierLimits } from '@/lib/tierlimits';
import { Logger } from '@/lib/logger';

/**
 * GET endpoint to retrieve tier limits configuration
 * @async
 * @param {NextRequest} request - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response containing tier limits or error
 */
export async function GET(request: NextRequest) {
  try {
    const response = await fetchTierLimits();
    
    if (response.error) {
      await Logger.error('Error fetching tier limits', {
        error: response.error,
        path: '/api/tiers',
        method: 'GET'
      });

      return new NextResponse(
        JSON.stringify({ error: response.error }),
        { 
          status: response.error === 'Tier configuration not found' ? 404 : 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    await Logger.info('Tier limits retrieved successfully', {
      tierLimits: response.tierLimits
    });

    return new NextResponse(
      JSON.stringify(response.tierLimits),
      {
        status: 200,
        headers: {
        'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    await Logger.error('Unexpected error in tiers route', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      path: '/api/tiers',
      method: 'GET'
    });

    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
