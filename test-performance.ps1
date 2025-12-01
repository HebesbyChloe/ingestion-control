# Performance Testing Script
# Tests various endpoints to identify bottlenecks

$API_GATEWAY_URL = $env:NEXT_PUBLIC_API_GATEWAY_URL
$GATEWAY_API_KEY = $env:NEXT_PUBLIC_GATEWAY_API_KEY
$BASE_URL = "http://localhost:3000"  # Change to your Vercel URL if testing production

Write-Host "=========================================="
Write-Host "Performance Testing Script"
Write-Host "=========================================="
Write-Host ""

# Test 1: Next.js API - Collections
Write-Host "Test 1: Next.js API - Collections"
Write-Host "-----------------------------------"
$startTime = Get-Date
try {
    $response = Measure-Command {
        Invoke-WebRequest -Uri "$BASE_URL/api/collections" -Method GET -UseBasicParsing
    }
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Time: $([math]::Round($duration, 2)) ms"
    Write-Host "Size: $($response.Content.Length) bytes"
} catch {
    Write-Host "Error: $_"
}
Write-Host ""

# Test 2: Gateway API - Collections (Direct)
Write-Host "Test 2: Gateway API - Collections (Direct)"
Write-Host "-----------------------------------"
if ($GATEWAY_API_KEY) {
    $startTime = Get-Date
    try {
        $headers = @{
            "X-API-Key" = $GATEWAY_API_KEY
            "Content-Type" = "application/json"
        }
        $response = Measure-Command {
            Invoke-WebRequest -Uri "$API_GATEWAY_URL/typesense/collections" -Method GET -Headers $headers -UseBasicParsing
        }
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        Write-Host "Status: $($response.StatusCode)"
        Write-Host "Time: $([math]::Round($duration, 2)) ms"
        Write-Host "Size: $($response.Content.Length) bytes"
    } catch {
        Write-Host "Error: $_"
    }
} else {
    Write-Host "Skipped: GATEWAY_API_KEY not set"
}
Write-Host ""

# Test 3: Next.js API - Feeds
Write-Host "Test 3: Next.js API - Feeds"
Write-Host "-----------------------------------"
$startTime = Get-Date
try {
    $response = Measure-Command {
        Invoke-WebRequest -Uri "$BASE_URL/api/feeds" -Method GET -UseBasicParsing
    }
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Time: $([math]::Round($duration, 2)) ms"
    Write-Host "Size: $($response.Content.Length) bytes"
} catch {
    Write-Host "Error: $_"
}
Write-Host ""

# Test 4: Next.js Page - Collections Page
Write-Host "Test 4: Next.js Page - Collections Page"
Write-Host "-----------------------------------"
$startTime = Get-Date
try {
    $response = Measure-Command {
        Invoke-WebRequest -Uri "$BASE_URL/collections" -Method GET -UseBasicParsing
    }
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Time: $([math]::Round($duration, 2)) ms"
    Write-Host "Size: $($response.Content.Length) bytes"
} catch {
    Write-Host "Error: $_"
}
Write-Host ""

# Test 5: Next.js API - Schema Columns
Write-Host "Test 5: Next.js API - Schema Columns"
Write-Host "-----------------------------------"
$startTime = Get-Date
try {
    $response = Measure-Command {
        Invoke-WebRequest -Uri "$BASE_URL/api/schema/columns" -Method GET -UseBasicParsing
    }
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Time: $([math]::Round($duration, 2)) ms"
    Write-Host "Size: $($response.Content.Length) bytes"
} catch {
    Write-Host "Error: $_"
}
Write-Host ""

Write-Host "=========================================="
Write-Host "Performance Test Complete"
Write-Host "=========================================="

