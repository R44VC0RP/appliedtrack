'use server';

import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { incrementQuota, getUserQuota } from '@/utils/quota-manager';
import { Logger } from '@/lib/logger';

const departments = ['executive', 'it', 'finance', 'management', 'sales', 'legal', 'support', 'hr', 'marketing', 'communication', 'education', 'design', 'health', 'operations'];

/**
 * Establishes connection to MongoDB if not already connected
 * @throws {Error} If connection fails
 */
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI as string);
      await Logger.info('MongoDB connection established', {
        service: 'hunter-api',
        connectionState: mongoose.connection.readyState
      });
    }
  } catch (error) {
    await Logger.error('MongoDB connection failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      service: 'hunter-api'
    });
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

/**
 * Searches for email addresses associated with a domain using Hunter.io API
 * @param domain - The domain to search
 * @param amount - Number of results to return (1-30)
 * @param department - Optional array of departments to filter by
 * @returns Promise containing email data and total results
 * @throws {Error} If API request fails or parameters are invalid
 */
async function hunterDomainSearch(domain: string, amount: number = 5, department: string[] = []) {
  if (department.length > 0 && !department.every(dep => departments.includes(dep))) {
    await Logger.warning('Invalid department specified in Hunter search', {
      domain,
      invalidDepartments: department.filter(dep => !departments.includes(dep))
    });
    throw new Error('Invalid department');
  }

  if (amount < 1 || amount > 30) {
    console.error('Invalid amount:', amount);
    throw new Error('Invalid amount');
  }

  const hunterApiKey = process.env.HUNTER_API_KEY;
  let allEmails: any[] = [];

  try {
    await Logger.info('Hunter domain search initiated', {
      domain,
      amount,
      department
    });
    
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
    

    await Logger.info('Hunter domain search completed', {
      domain,
      totalResults,
      resultsReturned: amount
    });

    return { data: dataResponse, total_results: totalResults };
  } catch (error) {
    await Logger.error('Hunter API request failed', {
      domain,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Searches for email address by name and domain using Hunter.io API
 * @param domain - The domain to search
 * @param firstName - First name of the person
 * @param lastName - Last name of the person
 * @param amount - Number of results to return (1-30)
 * @returns Promise containing email finder results
 * @throws {Error} If API request fails or parameters are invalid
 */
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

  await Logger.info('Hunter email-name search completed', {
    domain,
    firstName,
    lastName,
    found: !!dataResponse.data?.email
  });

  return dataResponse;
}

/**
 * GET handler for Hunter.io API endpoints
 * Supports domain search and email-name search operations
 */
export async function GET(request: NextRequest) {
  try {
    await Logger.info('Hunter API request received', {
      url: request.url,
      method: request.method
    });
    
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
        await Logger.info('Hunter API request completed', {
          action,
          domain,
          userId
        });
        // Increment quota after successful API call
        await incrementQuota(userId, 'emails');
        break;
    }

    

    return NextResponse.json({
      data: hunterData,
      source: 'hunter'
    });

  } catch (error: any) {
    await Logger.error('Hunter API request failed', {
      url: request.url,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: getAuth(request).userId
    });
    
    return new NextResponse(
      JSON.stringify({ error: 'Error processing request', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500 }
    );
  }
}
