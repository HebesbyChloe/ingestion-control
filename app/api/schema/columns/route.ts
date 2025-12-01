import { NextRequest, NextResponse } from 'next/server';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://api-gateway-dfcflow.fly.dev';
const API_KEY = process.env.GATEWAY_API_KEY || process.env.NEXT_PUBLIC_GATEWAY_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const modules = searchParams.get('modules');

    // Build query parameters for gateway
    const gatewayParams = new URLSearchParams();
    if (modules) {
      gatewayParams.append('modules', modules);
    }

    const url = `${API_GATEWAY_URL}/schema/columns${gatewayParams.toString() ? `?${gatewayParams.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes (schema changes rarely)
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch schema columns', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Log the actual response for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 Schema columns API response:', JSON.stringify(data, null, 2));
      console.log('📊 Response type:', typeof data, Array.isArray(data) ? 'array' : 'object');
      if (data && typeof data === 'object') {
        console.log('📊 Response keys:', Object.keys(data));
        if (modules) {
          console.log(`📊 Module "${modules}" data:`, data[modules]);
        }
      }
    }
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching schema columns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

