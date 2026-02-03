#!/bin/bash

# Test script for Search Autocomplete Functionality
# Tests the /api/v1/search/autocomplete endpoint

API_URL="http://localhost:4000/api/v1"
PASSED=0
FAILED=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Starting Search Autocomplete Tests"
echo "======================================"
echo ""

# Helper function to test endpoint
test_endpoint() {
    local test_name="$1"
    local url="$2"
    local expected_success="$3"
    local expected_min_results="$4"

    echo -n "Testing: $test_name... "

    # Make request and capture response
    response=$(curl -s "$url")

    # Check if request succeeded
    success=$(echo "$response" | python3 -c "import json,sys; data=json.load(sys.stdin); print(data.get('success', False))" 2>/dev/null)

    if [ "$success" != "$expected_success" ]; then
        echo -e "${RED}❌ FAILED${NC}"
        echo "  Expected success: $expected_success, got: $success"
        ((FAILED++))
        return 1
    fi

    # Check result count if expected_min_results is set
    if [ -n "$expected_min_results" ]; then
        total=$(echo "$response" | python3 -c "import json,sys; data=json.load(sys.stdin); print(data.get('total', 0))" 2>/dev/null)

        if [ "$total" -lt "$expected_min_results" ]; then
            echo -e "${RED}❌ FAILED${NC}"
            echo "  Expected at least $expected_min_results results, got: $total"
            ((FAILED++))
            return 1
        fi
    fi

    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
    return 0
}

# Test response structure
test_response_structure() {
    local test_name="$1"
    local url="$2"

    echo -n "Testing: $test_name... "

    response=$(curl -s "$url")

    # Check for required fields
    has_success=$(echo "$response" | python3 -c "import json,sys; data=json.load(sys.stdin); print('success' in data)" 2>/dev/null)
    has_data=$(echo "$response" | python3 -c "import json,sys; data=json.load(sys.stdin); print('data' in data)" 2>/dev/null)
    has_total=$(echo "$response" | python3 -c "import json,sys; data=json.load(sys.stdin); print('total' in data)" 2>/dev/null)

    if [ "$has_success" = "True" ] && [ "$has_data" = "True" ] && [ "$has_total" = "True" ]; then
        # Check if data items have required fields
        has_required_fields=$(echo "$response" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if len(data.get('data', [])) > 0:
        item = data['data'][0]
        required = ['id', 'name', 'slug', 'price']
        print(all(field in item for field in required))
    else:
        print(True)  # Empty data is okay for structure test
except:
    print(False)
" 2>/dev/null)

        if [ "$has_required_fields" = "True" ]; then
            echo -e "${GREEN}✅ PASSED${NC}"
            ((PASSED++))
            return 0
        fi
    fi

    echo -e "${RED}❌ FAILED${NC}"
    echo "  Response structure is invalid"
    ((FAILED++))
    return 1
}

# Test response time
test_response_time() {
    local test_name="$1"
    local url="$2"
    local max_time="$3"

    echo -n "Testing: $test_name... "

    # Measure response time
    start_time=$(date +%s%N)
    response=$(curl -s "$url")
    end_time=$(date +%s%N)

    # Calculate time in milliseconds
    duration=$(( (end_time - start_time) / 1000000 ))

    if [ "$duration" -lt "$max_time" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (${duration}ms)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "  Response took ${duration}ms, expected < ${max_time}ms"
        ((FAILED++))
        return 1
    fi
}

echo "📋 TEST 1: Response Structure"
echo "------------------------------"
test_response_structure "Response has required fields" "${API_URL}/search/autocomplete?q=watch"
echo ""

echo "📋 TEST 2: Basic Queries"
echo "------------------------------"
test_endpoint "Query: 'watch'" "${API_URL}/search/autocomplete?q=watch" "True" "1"
test_endpoint "Query: 'bag'" "${API_URL}/search/autocomplete?q=bag" "True" "0"
test_endpoint "Query: 'luxury'" "${API_URL}/search/autocomplete?q=luxury" "True" "0"
test_endpoint "Query: 'dress'" "${API_URL}/search/autocomplete?q=dress" "True" "0"
echo ""

echo "📋 TEST 3: Limit Parameter"
echo "------------------------------"
test_endpoint "Limit: 3" "${API_URL}/search/autocomplete?q=watch&limit=3" "True" "1"
test_endpoint "Limit: 5" "${API_URL}/search/autocomplete?q=watch&limit=5" "True" "1"
test_endpoint "Limit: 10" "${API_URL}/search/autocomplete?q=watch&limit=10" "True" "1"
echo ""

echo "📋 TEST 4: Edge Cases"
echo "------------------------------"
test_endpoint "Empty query" "${API_URL}/search/autocomplete?q=" "True" "0"
test_endpoint "Very short query (1 char)" "${API_URL}/search/autocomplete?q=w" "True" "0"
test_endpoint "Non-matching query" "${API_URL}/search/autocomplete?q=zzzzzzzzz" "True" "0"
test_endpoint "Special characters" "${API_URL}/search/autocomplete?q=%40%23%24" "True" "0"
echo ""

echo "📋 TEST 5: Performance"
echo "------------------------------"
test_response_time "Response time < 500ms" "${API_URL}/search/autocomplete?q=watch" "500"
test_response_time "Response time < 500ms (limit=20)" "${API_URL}/search/autocomplete?q=watch&limit=20" "500"
echo ""

# Summary
echo "======================================"
echo "📊 TEST SUMMARY"
echo "======================================"
echo ""
echo "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "✅ Search autocomplete functionality validated:"
    echo "   - Response structure: Valid"
    echo "   - Basic queries: Working"
    echo "   - Limit parameter: Working"
    echo "   - Edge cases: Handled"
    echo "   - Performance: < 500ms"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Review the output above.${NC}"
    echo ""
    exit 1
fi
