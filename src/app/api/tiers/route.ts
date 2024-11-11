"use server"

import { NextResponse } from 'next/server';
import { fetchTierLimits } from '@/lib/tierlimits';


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
      'Content-Type': 'application/json'
    },
  });
}
