import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';

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

async function getDomainFromHunter(domain: string) {
  const hunterApiKey = process.env.HUNTER_API_KEY;
  const limit = 100;
  let allEmails: any[] = [];
  
  try {
    // First request to get total results
    const initialUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterApiKey}&limit=${limit}`;
    const initialResponse = await fetch(initialUrl);
    if (!initialResponse.ok) {
      throw new Error(`Hunter API error: ${initialResponse.statusText}`);
    }
    const initialData = await initialResponse.json();
    const totalResults = initialData.meta.results;
    
    // Add first batch of emails
    allEmails = [...initialData.data.emails];
    
    // Calculate number of additional requests needed
    const remainingRequests = Math.ceil(totalResults / limit) - 1;
    
    // Fetch remaining results
    for (let offset = limit; offset < totalResults; offset += limit) {
      const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterApiKey}&limit=${limit}&offset=${offset}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Hunter API error: ${response.statusText}`);
      }
      const data = await response.json();
      allEmails = [...allEmails, ...data.data.emails];
    }
    
    // Sanitize all emails
    const sanitizedEmails = allEmails.map((email: {
      sources: { uri: string | null }[];
      [key: string]: any;
    }) => ({
      ...email,
      sources: email.sources.map(source => ({
        ...source,
        uri: source.uri ? encodeURI(source.uri) : null
      }))
    }));

    // Construct final data object
    const sanitizedData = {
      ...initialData,
      data: {
        ...initialData.data,
        emails: sanitizedEmails
      }
    };

    return { data: sanitizedData, total_results: totalResults };
  } catch (error) {
    console.error('Error fetching from Hunter:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB(); // Ensure DB connection is established

    const { userId } = getAuth(request);
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    let domain = url.searchParams.get('domain');

    console.log('Performing search for:', domain, 'from user:', userId);

    if (!domain) {
      return new NextResponse("Domain parameter is required", { status: 400 });
    }

    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

    if (!isValidDomain(domain)) {
      return new NextResponse("Invalid domain format", { status: 400 });
    }

    // Fetch from Hunter.io
    const { data: hunterData, total_results } = await getDomainFromHunter(domain);

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
