import { NextRequest, NextResponse } from 'next/server';

// Support multiple env variable naming conventions
const TYPESENSE_URL = process.env.TYPESENSE_URL || 
                      process.env.NEXT_PUBLIC_TYPESENSE_URL || 
                      '';
const TYPESENSE_API_KEY = process.env['TYPESENSE-SEARCH-X-TYPESENSE-API-KEY'] || 
                          process.env.TYPESENSE_SEARCH_API_KEY ||
                          process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY || 
                          '';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name: collectionName } = await params;

    if (!collectionName) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      );
    }

    if (!TYPESENSE_URL || !TYPESENSE_API_KEY) {
      return NextResponse.json(
        { error: 'Typesense configuration missing' },
        { status: 500 }
      );
    }

    // Search for the most recent document sorted by updated_at
    const searchUrl = `${TYPESENSE_URL}/collections/${collectionName}/documents/search?q=*&sort_by=updated_at:desc&per_page=1`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If collection has no documents (404) or is empty, return null
      if (response.status === 404 || response.status === 400) {
        return NextResponse.json({ last_updated_at: null });
      }
      
      const errorText = await response.text();
      console.error('Typesense search error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch last update', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract updated_at from the first document
    if (data.hits && data.hits.length > 0 && data.hits[0].document) {
      const document = data.hits[0].document;
      const updatedAt = document.updated_at;
      
      // Convert to Unix timestamp if it's a string or Date
      let timestamp: number | null = null;
      
      if (typeof updatedAt === 'number') {
        timestamp = updatedAt;
      } else if (typeof updatedAt === 'string') {
        // Try parsing as ISO string or Unix timestamp
        const parsed = Date.parse(updatedAt);
        if (!isNaN(parsed)) {
          timestamp = Math.floor(parsed / 1000); // Convert to Unix timestamp
        } else {
          const numParsed = parseInt(updatedAt, 10);
          if (!isNaN(numParsed)) {
            timestamp = numParsed;
          }
        }
      }
      
      return NextResponse.json({ last_updated_at: timestamp });
    }

    // No documents found
    return NextResponse.json({ last_updated_at: null });
  } catch (error) {
    console.error('Error fetching last update:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

