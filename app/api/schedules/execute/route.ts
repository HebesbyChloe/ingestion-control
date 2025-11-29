import { NextRequest, NextResponse } from 'next/server';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'https://api-gateway-dfcflow.fly.dev';
const API_KEY = process.env.GATEWAY_API_KEY || process.env.NEXT_PUBLIC_GATEWAY_API_KEY || '';

// Track in-flight executions to prevent duplicates (simple in-memory cache)
// In production, consider using Redis or database locks for distributed systems
const executingSchedules = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
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
    
    // First, fetch the schedule to get its payload
    const scheduleResponse = await fetch(`${API_GATEWAY_URL}/rest/sys_schedules?id=eq.${id}`, {
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!scheduleResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch schedule' },
        { status: scheduleResponse.status }
      );
    }

    const schedules = await scheduleResponse.json();
    if (!schedules || schedules.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    const schedule = schedules[0];
    
    // Modify payload for manual execution: override reason to "manual-execution"
    let modifiedPayload: Record<string, any> = {};
    
    // Start with existing payload if it exists
    if (schedule.payload && typeof schedule.payload === 'object') {
      modifiedPayload = { ...schedule.payload };
    }
    
    // Override reason for manual execution
    modifiedPayload.reason = 'manual-execution';
    
    // Gateway now correctly routes /scheduler/schedules/{id}/execute to scheduler service
    // Send the modified payload with reason="manual-execution"
    // The scheduler service may accept payload override in the request body
    const response = await fetch(`${API_GATEWAY_URL}/scheduler/schedules/${id}/execute`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        payload: modifiedPayload,
        payloadOverride: true, // Flag to indicate this is a manual execution with payload override
      }),
    });

    if (!response.ok) {
      const error = await response.text();
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

