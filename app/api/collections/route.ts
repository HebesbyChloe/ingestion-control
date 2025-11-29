import { NextRequest, NextResponse } from 'next/server';

// Support multiple env variable naming conventions
const TYPESENSE_URL = process.env.TYPESENSE_URL || 
                      process.env.NEXT_PUBLIC_TYPESENSE_URL || 
                      '';
const TYPESENSE_API_KEY = process.env['TYPESENSE-SEARCH-X-TYPESENSE-API-KEY'] || 
                          process.env.TYPESENSE_SEARCH_API_KEY ||
                          process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY || 
                          '';

export async function GET(request: NextRequest) {
  try {
    if (!TYPESENSE_URL || !TYPESENSE_API_KEY) {
      return NextResponse.json(
        { error: 'Typesense configuration missing. Please set TYPESENSE_URL and TYPESENSE-SEARCH-X-TYPESENSE-API-KEY' },
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
      console.error('Typesense API error:', errorText);
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

