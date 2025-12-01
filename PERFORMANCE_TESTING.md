# Performance Testing Guide

This guide helps you identify performance bottlenecks in your application by testing various endpoints and measuring response times.

## Files Created

1. **`curl-format.txt`** - Curl format file for detailed timing information
2. **`test-performance-node.js`** - Node.js script (recommended, works cross-platform)
3. **`test-performance.sh`** - Bash script for Linux/Mac
4. **`test-performance.ps1`** - PowerShell script for Windows

## Quick Start

### Using Node.js (Recommended)

```bash
# Test local development server
npm run test:perf

# Test production (Vercel)
npm run test:perf:prod
# Or set BASE_URL manually:
BASE_URL=https://your-app.vercel.app npm run test:perf
```

### Using curl (Linux/Mac)

```bash
# Make script executable
chmod +x test-performance.sh

# Run tests
./test-performance.sh

# Or test a specific endpoint
curl -w "@curl-format.txt" -o /dev/null https://your-app.vercel.app/api/collections
```

### Using PowerShell (Windows)

```powershell
# Run tests
powershell -ExecutionPolicy Bypass -File test-performance.ps1
```

## What Gets Tested

The script tests:

1. **Next.js API - Collections** (`/api/collections`)
   - Tests the Next.js API route that proxies to Gateway
   - Measures: Next.js processing + Gateway response time

2. **Gateway API - Collections (Direct)** (`/typesense/collections`)
   - Tests Gateway directly (bypasses Next.js)
   - Measures: Gateway response time only
   - **Compare with #1 to see Next.js overhead**

3. **Next.js API - Feeds** (`/api/feeds`)
   - Tests feeds API endpoint

4. **Next.js Page - Collections Page** (`/collections`)
   - Tests full page render (SSR/SSG)
   - Measures: Complete page load time

5. **Next.js API - Schema Columns** (`/api/schema/columns`)
   - Tests schema API endpoint

6. **Next.js API - Schema Columns (with module)** (`/api/schema/columns?modules=inventory`)
   - Tests schema API with parameters

## Understanding the Results

### Timing Breakdown (from curl-format.txt)

- **time_namelookup**: DNS lookup time
- **time_connect**: Time to establish TCP connection
- **time_starttransfer**: Time until first byte received
- **time_total**: Total request time

### Performance Thresholds

- **< 200ms**: Excellent
- **200-500ms**: Good
- **500-1000ms**: Acceptable
- **> 1000ms**: Slow (needs optimization)

### Identifying Bottlenecks

1. **If Gateway direct is fast but Next.js API is slow:**
   - Issue is in Next.js layer (API route processing)
   - Check: API route code, middleware, authentication

2. **If both Gateway and Next.js API are slow:**
   - Issue is in Gateway or backend
   - Check: Gateway logs, database queries, external API calls

3. **If page load is slow but API is fast:**
   - Issue is in frontend rendering
   - Check: React components, data fetching, bundle size

4. **If DNS lookup is slow:**
   - Network/DNS issue
   - Check: DNS configuration, CDN setup

## Example Output

```
Test 1: Next.js API - Collections
-----------------------------------
Status: 200 OK
Time: 450 ms
Size: 15234 bytes
Speed: 33853.33 bytes/sec

Test 2: Gateway API - Collections (Direct)
-----------------------------------
Status: 200 OK
Time: 320 ms
Size: 15234 bytes
Speed: 47543.75 bytes/sec

Performance Summary
==========================================
Average Response Time: 385.00 ms
Fastest: 320 ms
Slowest: 450 ms
```

## Troubleshooting

### Slow API Routes

1. Check if queries are being made sequentially instead of in parallel
2. Look for N+1 query problems
3. Check if data is being fetched unnecessarily
4. Verify caching is working (React Query staleTime)

### Slow Gateway Responses

1. Check Gateway logs for slow database queries
2. Verify database indexes are optimized
3. Check if external API calls are slow
4. Look for rate limiting or throttling

### Slow Page Loads

1. Check bundle size: `npm run build` and look at output
2. Verify images are optimized
3. Check if too much data is being fetched on initial load
4. Look for blocking JavaScript

## Next Steps After Testing

1. **Identify the slowest endpoint** - Focus optimization there first
2. **Compare Gateway direct vs Next.js API** - See if Next.js is adding overhead
3. **Check for sequential API calls** - Convert to parallel where possible
4. **Review database queries** - Add indexes, optimize queries
5. **Implement caching** - Use React Query staleTime, Next.js caching
6. **Optimize bundle size** - Code splitting, lazy loading

## Advanced Testing

### Test with Authentication

Add authentication headers to the scripts:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_TOKEN',
  'X-API-Key': GATEWAY_API_KEY,
}
```

### Test Specific Scenarios

Modify the scripts to test:
- Large collections (many documents)
- Complex queries
- Multiple concurrent requests
- Error scenarios

### Continuous Monitoring

Consider setting up:
- Vercel Analytics for production monitoring
- Custom logging for API response times
- Alerts for slow endpoints

