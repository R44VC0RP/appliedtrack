import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { Logger } from '@/lib/logger';

// Load the prefix map once when the server starts
const prefixMap = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'src/data/job-titles-map.json'),
    'utf-8'
  )
);

/**
 * GET handler for job title suggestions
 * @description Provides autocomplete suggestions for job titles based on user input
 * @param {NextRequest} request - The incoming request object containing search query
 * @returns {Promise<NextResponse>} JSON response with an array of job title suggestions
 * @throws {Error} If there's an error reading the prefix map or processing the request
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query')?.toLowerCase() || '';

    await Logger.info('Job titles search initiated', {
      query,
      timestamp: new Date(),
      path: request.nextUrl.pathname
    });

    if (!query) {
      await Logger.info('Empty query received for job titles search', {
        path: request.nextUrl.pathname
      });
      return NextResponse.json([]);
    }

    // Get suggestions for the full query and the last word
    const words = query.split(' ');
    const lastWord = words[words.length - 1];
    
    const fullQuerySuggestions = prefixMap[query] || [];
    const lastWordSuggestions = lastWord ? (prefixMap[lastWord] || []) : [];
    
    // Combine and deduplicate suggestions
    const allSuggestions = Array.from(new Set([...fullQuerySuggestions, ...lastWordSuggestions]))
      .filter((suggestion: string) => 
        suggestion.toLowerCase().includes(query)
      )
      .map((suggestion: string) =>
        suggestion.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      )
      .slice(0, 10);

    await Logger.info('Job titles suggestions generated', {
      query,
      resultCount: allSuggestions.length,
      timestamp: new Date()
    });

    return NextResponse.json(allSuggestions);
  } catch (error) {
    await Logger.error('Error in job titles search API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      query: request.nextUrl.searchParams.get('query'),
      path: request.nextUrl.pathname
    });

    return NextResponse.json(
      { error: 'Failed to process job titles search' },
      { status: 500 }
    );
  }
} 