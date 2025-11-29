import { NextRequest, NextResponse } from 'next/server';

// Use Gateway instead of direct Typesense connection
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://api-gateway-dfcflow.fly.dev';
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || process.env.NEXT_PUBLIC_GATEWAY_API_KEY || '';

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

    if (!GATEWAY_API_KEY) {
      return NextResponse.json(
        { error: 'Gateway configuration missing' },
        { status: 500 }
      );
    }

    // Use Gateway search endpoints for known collections
    // Gateway supports query parameters: q, sort_by, per_page
    let searchUrl: string;
    if (collectionName === 'natural') {
      searchUrl = `${API_GATEWAY_URL}/search/natural?q=*&sort_by=updated_at:desc&per_page=1`;
    } else if (collectionName === 'lab-grown') {
      searchUrl = `${API_GATEWAY_URL}/search/labgrown?q=*&sort_by=updated_at:desc&per_page=1`;
    } else {
      // For other collections (like external_feed), return null
      // TODO: Add gateway route for generic collection search if needed
      console.warn(`Collection ${collectionName} not mapped to gateway search route`);
      return NextResponse.json({ last_updated_at: null });
    }
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': GATEWAY_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If collection has no documents (404) or is empty, return null
      if (response.status === 404 || response.status === 400) {
        return NextResponse.json({ last_updated_at: null });
      }
      
      const errorText = await response.text();
      console.error('Gateway search error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch last update', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Gateway returns normalized format: { hits: [...], total: number, page: number }
    // Each hit has: { id, updated_at, ... } or { document: { updated_at, ... } }
    if (data.hits && data.hits.length > 0) {
      const hit = data.hits[0];
      
      // Gateway normalizes the response, so updated_at might be directly on the hit
      // or in a document field, or in raw field
      let updatedAt: any = null;
      
      if (hit.updated_at !== undefined) {
        updatedAt = hit.updated_at;
      } else if (hit.document && hit.document.updated_at !== undefined) {
        updatedAt = hit.document.updated_at;
      } else if (hit.raw && hit.raw.updated_at !== undefined) {
        updatedAt = hit.raw.updated_at;
      }
      
      // Convert to Unix timestamp
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
      
      if (timestamp !== null) {
        return NextResponse.json({ last_updated_at: timestamp });
      }
    }

    // No documents found or no updated_at field
    return NextResponse.json({ last_updated_at: null });
  } catch (error) {
    console.error('Error fetching last update:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

