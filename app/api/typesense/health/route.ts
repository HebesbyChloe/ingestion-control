import { NextRequest, NextResponse } from 'next/server';

// Use Gateway instead of direct Typesense connection
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://api-gateway-dfcflow.fly.dev';
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || process.env.NEXT_PUBLIC_GATEWAY_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    if (!GATEWAY_API_KEY) {
      return NextResponse.json(
        { error: 'Gateway configuration missing' },
        { status: 500 }
      );
    }

    // Use Gateway endpoint: /typesense/health
    const gatewayUrl = `${API_GATEWAY_URL}/typesense/health`;
    
    const response = await fetch(gatewayUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': GATEWAY_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gateway health error:', {
        status: response.status,
        error: errorText,
      });
      
      return NextResponse.json(
        { error: 'Failed to fetch health from gateway', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching health:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

