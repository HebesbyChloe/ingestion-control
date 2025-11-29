import { NextRequest, NextResponse } from 'next/server';

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://api-gateway-dfcflow.fly.dev';
const API_KEY = process.env.GATEWAY_API_KEY || process.env.NEXT_PUBLIC_GATEWAY_API_KEY || '';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.toString();

  const url = `${API_GATEWAY_URL}/scheduler/monitoring${query ? `?${query}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': API_KEY,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch monitoring snapshot:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url,
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch monitoring snapshot',
          details: errorText || response.statusText,
        },
        { status: response.status },
      );
    }

    const payload = await response.json();
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Monitoring proxy error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}


