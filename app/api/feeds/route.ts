import { NextRequest, NextResponse } from 'next/server';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://api-gateway-dfcflow.fly.dev';
const API_KEY = process.env.GATEWAY_API_KEY || process.env.NEXT_PUBLIC_GATEWAY_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    const url = `${API_GATEWAY_URL}/rest/sys_feeds${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch feeds' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching feeds:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_GATEWAY_URL}/rest/sys_feeds`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to create feed', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating feed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    console.log('PATCH /api/feeds - Request body:', JSON.stringify(body, null, 2));
    console.log('PATCH /api/feeds - Update data:', JSON.stringify(updateData, null, 2));
    console.log('PATCH /api/feeds - Feed ID:', id);
    
    const url = `${API_GATEWAY_URL}/rest/sys_feeds?id=eq.${id}`;
    console.log('PATCH /api/feeds - Gateway URL:', url);
    
    const requestBody = JSON.stringify(updateData);
    console.log('PATCH /api/feeds - Request body to gateway:', requestBody);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: requestBody,
    });

    console.log('PATCH /api/feeds - Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PATCH /api/feeds - Error response:', errorText);
      return NextResponse.json(
        { error: 'Failed to update feed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('PATCH /api/feeds - Success response:', JSON.stringify(data, null, 2));
    return NextResponse.json(data);
  } catch (error) {
    console.error('PATCH /api/feeds - Exception:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Feed ID is required' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${API_GATEWAY_URL}/rest/sys_feeds?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to delete feed', details: error },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: 'Feed deleted successfully' });
  } catch (error) {
    console.error('Error deleting feed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

