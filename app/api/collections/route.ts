import { NextRequest, NextResponse } from 'next/server';

// Support multiple env variable naming conventions
const TYPESENSE_URL = process.env.TYPESENSE_URL || 
                      process.env.NEXT_PUBLIC_TYPESENSE_URL || 
                      '';
const TYPESENSE_API_KEY = process.env.TYPESENSE_SEARCH_X_TYPESENSE_API_KEY ||
                          process.env.TYPESENSE_SEARCH_API_KEY ||
                          process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY || 
                          '';

export async function GET(request: NextRequest) {
  try {
    // Always log in production to help debug Vercel issues
    console.log('Typesense Config Check:', {
      hasUrl: !!TYPESENSE_URL,
      urlLength: TYPESENSE_URL?.length || 0,
      urlPreview: TYPESENSE_URL ? `${TYPESENSE_URL.substring(0, 20)}...` : 'missing',
      hasKey: !!TYPESENSE_API_KEY,
      keyLength: TYPESENSE_API_KEY?.length || 0,
      keyPrefix: TYPESENSE_API_KEY ? TYPESENSE_API_KEY.substring(0, 8) + '...' : 'missing',
      envVarsChecked: [
        'TYPESENSE_URL',
        'NEXT_PUBLIC_TYPESENSE_URL',
        'TYPESENSE_SEARCH_X_TYPESENSE_API_KEY',
        'TYPESENSE_SEARCH_API_KEY',
        'NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY',
      ],
    });

    if (!TYPESENSE_URL || !TYPESENSE_API_KEY) {
      const missing = [];
      if (!TYPESENSE_URL) missing.push('TYPESENSE_URL');
      if (!TYPESENSE_API_KEY) missing.push('TYPESENSE_SEARCH_X_TYPESENSE_API_KEY');
      
      console.error('Typesense configuration missing:', missing);
      return NextResponse.json(
        { 
          error: 'Typesense configuration missing', 
          details: `Missing environment variables: ${missing.join(', ')}`,
          hint: 'Please set TYPESENSE_URL and TYPESENSE_SEARCH_X_TYPESENSE_API_KEY in your environment variables'
        },
        { status: 500 }
      );
    }

    const response = await fetch(`${TYPESENSE_URL}/collections`, {
      method: 'GET',
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Typesense API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: `${TYPESENSE_URL}/collections`,
      });
      
      // Provide more helpful error messages
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Typesense authentication failed', 
            details: 'Invalid or missing API key. Please check TYPESENSE_SEARCH_X_TYPESENSE_API_KEY environment variable.',
            hint: 'Make sure the API key is correct and has read permissions for collections'
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch collections from Typesense', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Typesense returns { collections: [...] }
    const collections = data.collections || data || [];
    
    return NextResponse.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

