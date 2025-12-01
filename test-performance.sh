#!/bin/bash

# Performance Testing Script
# Tests various endpoints to identify bottlenecks

API_GATEWAY_URL="${NEXT_PUBLIC_API_GATEWAY_URL}"
GATEWAY_API_KEY="${NEXT_PUBLIC_GATEWAY_API_KEY}"
BASE_URL="${BASE_URL:-http://localhost:3000}"  # Change to your Vercel URL if testing production

echo "=========================================="
echo "Performance Testing Script"
echo "=========================================="
echo ""

# Test 1: Next.js API - Collections
echo "Test 1: Next.js API - Collections"
echo "-----------------------------------"
curl -w "@curl-format.txt" -o /dev/null -s "$BASE_URL/api/collections"
echo ""

# Test 2: Gateway API - Collections (Direct)
echo "Test 2: Gateway API - Collections (Direct)"
echo "-----------------------------------"
if [ -n "$GATEWAY_API_KEY" ]; then
    curl -w "@curl-format.txt" -o /dev/null -s \
        -H "X-API-Key: $GATEWAY_API_KEY" \
        -H "Content-Type: application/json" \
        "$API_GATEWAY_URL/typesense/collections"
else
    echo "Skipped: GATEWAY_API_KEY not set"
fi
echo ""

# Test 3: Next.js API - Feeds
echo "Test 3: Next.js API - Feeds"
echo "-----------------------------------"
curl -w "@curl-format.txt" -o /dev/null -s "$BASE_URL/api/feeds"
echo ""

# Test 4: Next.js Page - Collections Page
echo "Test 4: Next.js Page - Collections Page"
echo "-----------------------------------"
curl -w "@curl-format.txt" -o /dev/null -s "$BASE_URL/collections"
echo ""

# Test 5: Next.js API - Schema Columns
echo "Test 5: Next.js API - Schema Columns"
echo "-----------------------------------"
curl -w "@curl-format.txt" -o /dev/null -s "$BASE_URL/api/schema/columns"
echo ""

# Test 6: Next.js API - Schema Columns with module
echo "Test 6: Next.js API - Schema Columns (with module)"
echo "-----------------------------------"
curl -w "@curl-format.txt" -o /dev/null -s "$BASE_URL/api/schema/columns?modules=inventory"
echo ""

echo "=========================================="
echo "Performance Test Complete"
echo "=========================================="

