'use server';

import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { incrementQuota, getUserQuota } from '@/utils/quota-manager';

const departments = ['executive', 'it', 'finance', 'management', 'sales', 'legal', 'support', 'hr', 'marketing', 'communication', 'education', 'design', 'health', 'operations'];

// Ensure connection is established
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI as string);
      console.log('MongoDB connected successfully');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error('Failed to connect to database');
  }
};

// Helper function to validate domain format
function isValidDomain(domain: string): boolean {
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  return domainPattern.test(cleanDomain);
}

// department: [executive, it, finance, management, sales, legal, support, hr, marketing, communication, education, design, health, operations]

async function hunterDomainSearch(domain: string, amount: number = 5, department: string[] = []) {

  if (department.length > 0 && !department.every(dep => departments.includes(dep))) {
    console.error('Invalid department:', department);
    throw new Error('Invalid department');
  }

  if (amount < 1 || amount > 30) {
    console.error('Invalid amount:', amount);
    throw new Error('Invalid amount');
  }

  const hunterApiKey = process.env.HUNTER_API_KEY;
  let allEmails: any[] = [];

  try {
    // First request to get total results
    const initialUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterApiKey}&limit=${amount}`;
    console.log('Initial URL:', initialUrl);
    const initialResponse = await fetch(initialUrl);
    if (!initialResponse.ok) {
      throw new Error(`Hunter API error: ${initialResponse.statusText}`);
    }
    const dataResponse = await initialResponse.json();
    const totalResults = dataResponse.meta.results;

    // Sanitize all emails
    

    return { data: dataResponse, total_results: totalResults };
  } catch (error) {
    console.error('Error fetching from Hunter:', error);
    throw error;
  }
}

async function hunterEmailNameSearch(domain: string, firstName: string, lastName: string, amount: number = 5) {

  if (amount < 1 || amount > 30) {
    console.error('Invalid amount:', amount);
    throw new Error('Invalid amount');
  }

  const hunterApiKey = process.env.HUNTER_API_KEY;

  const initialUrl = `https://api.hunter.io/v2/email-finder?domain=${domain}&first_name=${firstName}&last_name=${lastName}&api_key=${hunterApiKey}&limit=${amount}`;
  const initialResponse = await fetch(initialUrl);
  if (!initialResponse.ok) {
    throw new Error(`Hunter API error: ${initialResponse.statusText}`);
  }
  const dataResponse = await initialResponse.json();

  return dataResponse;

}

export async function GET(request: NextRequest) {
  try {
    await connectDB(); // Ensure DB connection is established

    const { userId } = getAuth(request);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check quota before proceeding
    const quota = await getUserQuota(userId);
    if (quota.emails.remaining === 0) {
      return new NextResponse("Email quota exceeded", { status: 403 });
    }

    const url = new URL(request.url);

    let action = url.searchParams.get('action');

    let hunterData: any;
    let domain: string;
    let firstName: string;
    let lastName: string;
    let limit: string;
    let departments: string[];

    switch (action) {
      case 'domainSearch':
        domain = url.searchParams.get('domain') || '';
        limit = url.searchParams.get('limit') || '5';
        departments = url.searchParams.get('departments')?.split(',') || [];

        domain = domain?.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || '';
        console.log('Performing search for:', domain, 'from user:', userId);


        if (!domain) {
          return new NextResponse("Domain parameter is required", { status: 400 });
        }

        if (!isValidDomain(domain)) {
          return new NextResponse("Invalid domain format", { status: 400 });
        }

        hunterData = await hunterDomainSearch(domain, parseInt(limit), departments);
        console.log('Hunter data:', hunterData);
        // Increment quota after successful API call
        await incrementQuota(userId, 'emails');
        break;
      case 'emailNameSearch':
        domain = url.searchParams.get('domain') || '';
        firstName = url.searchParams.get('firstName') || '';
        lastName = url.searchParams.get('lastName') || '';
        limit = url.searchParams.get('limit') || '5';

        hunterData = await hunterEmailNameSearch(domain, firstName, lastName, parseInt(limit));
        // Increment quota after successful API call
        await incrementQuota(userId, 'emails');
        break;
    }



    // Fetch from Hunter.io
    

    return NextResponse.json({
      data: hunterData,
      source: 'hunter'
    });

  } catch (error: any) {
    console.error('Error in hunter route:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error processing request', details: error.message || 'Unknown error' }),
      { status: 500 }
    );
  }
}
