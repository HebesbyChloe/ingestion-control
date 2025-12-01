import { NextRequest, NextResponse } from 'next/server';

// Use Gateway instead of direct Typesense connection
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://api-gateway-dfcflow.fly.dev';
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || process.env.NEXT_PUBLIC_GATEWAY_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    if (!GATEWAY_API_KEY) {
      console.error('Gateway API key missing');
      return NextResponse.json(
        { 
          error: 'Gateway configuration missing', 
          details: 'Missing GATEWAY_API_KEY or NEXT_PUBLIC_GATEWAY_API_KEY environment variable',
          hint: 'Please set the gateway API key in your environment variables'
        },
        { status: 500 }
      );
    }

    // Use Gateway endpoint: /typesense/collections
    const gatewayUrl = `${API_GATEWAY_URL}/typesense/collections`;
    
    if (process.env.NODE_ENV === 'development') {
    console.log('Fetching collections through Gateway:', {
      url: gatewayUrl,
      hasApiKey: !!GATEWAY_API_KEY,
    });
    }

    const response = await fetch(gatewayUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': GATEWAY_API_KEY,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gateway API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: gatewayUrl,
      });
      
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Gateway authentication failed', 
            details: 'Invalid or missing gateway API key',
            hint: 'Please check GATEWAY_API_KEY environment variable'
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch collections from gateway', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Gateway returns array of collections directly
    const collections = Array.isArray(data) ? data : (data.collections || []);
    
    return NextResponse.json(collections, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

