import { NextRequest, NextResponse } from 'next/server';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://api-gateway-dfcflow.fly.dev';
const API_KEY = process.env.GATEWAY_API_KEY || process.env.NEXT_PUBLIC_GATEWAY_API_KEY || '';

// Track in-flight executions to prevent duplicates (simple in-memory cache)
// In production, consider using Redis or database locks for distributed systems
const executingSchedules = new Map<string, number>();

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json(
      { error: 'Schedule ID is required' },
      { status: 400 }
    );
  }
  
  // Prevent duplicate execution: check if this schedule is already being executed
  const executionKey = `schedule-${id}`;
  const now = Date.now();
  const lastExecution = executingSchedules.get(executionKey);
  
  // If executed within last 2 seconds, reject as duplicate
  if (lastExecution && (now - lastExecution) < 2000) {
    return NextResponse.json(
      { error: 'Schedule execution already in progress. Please wait...' },
      { status: 429 } // Too Many Requests
    );
  }
  
  // Mark as executing
  executingSchedules.set(executionKey, now);
  
  // Clean up old entries (older than 30 seconds)
  for (const [key, timestamp] of executingSchedules.entries()) {
    if (now - timestamp > 30000) {
      executingSchedules.delete(key);
    }
  }
  
  try {
    // Call scheduler service execute endpoint directly
    const response = await fetch(`${API_GATEWAY_URL}/scheduler/schedules/${id}/execute`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // Scheduler handles payload/reason override internally
    });

    if (!response.ok) {
      const error = await response.text();
      executingSchedules.delete(executionKey);
      return NextResponse.json(
        { error: 'Failed to execute schedule', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Clear execution flag on success
    executingSchedules.delete(executionKey);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error executing schedule:', error);
    
    // Clear execution flag on error
    executingSchedules.delete(executionKey);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

