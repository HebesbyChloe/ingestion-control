import { NextRequest, NextResponse } from 'next/server';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://api-gateway-dfcflow.fly.dev';
const API_KEY = process.env.GATEWAY_API_KEY || process.env.NEXT_PUBLIC_GATEWAY_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const feedKey = searchParams.get('feedKey');
    const tenantId = searchParams.get('tenant_id');
    const save = searchParams.get('save') === 'true';

    if (!feedKey) {
      return NextResponse.json(
        { error: 'feedKey parameter is required' },
        { status: 400 }
      );
    }

    // Build query parameters for gateway
    const gatewayParams = new URLSearchParams({
      feedKey,
    });
    if (tenantId) {
      gatewayParams.append('tenant_id', tenantId);
    }
    if (save) {
      gatewayParams.append('save', 'true');
    }

    const url = `${API_GATEWAY_URL}/worker/ingestion/headers?${gatewayParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch header schema', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching header schema:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

