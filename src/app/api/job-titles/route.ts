import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Load the prefix map once when the server starts
const prefixMap = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'src/data/job-titles-map.json'),
    'utf-8'
  )
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query')?.toLowerCase() || '';

  if (!query) {
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

  return NextResponse.json(allSuggestions);
} 