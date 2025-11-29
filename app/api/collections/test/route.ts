import { NextRequest, NextResponse } from 'next/server';

const TYPESENSE_URL = process.env.TYPESENSE_URL || 
                      process.env.NEXT_PUBLIC_TYPESENSE_URL || 
                      '';
const TYPESENSE_API_KEY = process.env.TYPESENSE_SEARCH_X_TYPESENSE_API_KEY ||
                          process.env.TYPESENSE_SEARCH_API_KEY ||
                          process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY || 
                          '';

export async function GET(request: NextRequest) {
  try {
    if (!TYPESENSE_URL || !TYPESENSE_API_KEY) {
      return NextResponse.json({
        error: 'Missing configuration',
        hasUrl: !!TYPESENSE_URL,
        hasKey: !!TYPESENSE_API_KEY,
      });
    }

    // Test the Typesense API call with detailed logging
    const testUrl = `${TYPESENSE_URL}/collections`;
    
    console.log('Testing Typesense API call:', {
      url: testUrl,
      hasKey: !!TYPESENSE_API_KEY,
      keyLength: TYPESENSE_API_KEY.length,
      keyPrefix: TYPESENSE_API_KEY.substring(0, 8),
    });

    // Make the request
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'x-typesense-api-key': TYPESENSE_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: testUrl,
      headersSent: {
        'x-typesense-api-key': TYPESENSE_API_KEY ? `${TYPESENSE_API_KEY.substring(0, 8)}...` : 'MISSING',
        'Content-Type': 'application/json',
      },
      response: responseData,
      rawResponse: responseText,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

