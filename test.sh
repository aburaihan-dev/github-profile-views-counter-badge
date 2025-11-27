#!/bin/bash

# GitHub Profile Counter API Test Script

BASE_URL="http://localhost:8787"

echo "=================================="
echo "GitHub Profile Counter API Tests"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Root endpoint
echo -e "${YELLOW}Test 1: Root Endpoint${NC}"
echo "GET $BASE_URL/"
curl -s "$BASE_URL/" | jq '.' || echo "Response received"
echo ""
echo ""

# Test 2: Profile count with valid username
echo -e "${YELLOW}Test 2: Profile Count (Valid Username)${NC}"
echo "GET $BASE_URL/count/octocat"
curl -s "$BASE_URL/count/octocat" | jq '.'
echo ""
echo ""

# Test 3: Profile count again (should increment)
echo -e "${YELLOW}Test 3: Profile Count Again (Should Increment)${NC}"
echo "GET $BASE_URL/count/octocat"
curl -s "$BASE_URL/count/octocat" | jq '.'
echo ""
echo ""

# Test 4: Stats endpoint (should not increment)
echo -e "${YELLOW}Test 4: Stats Endpoint (Should NOT Increment)${NC}"
echo "GET $BASE_URL/stats/octocat"
curl -s "$BASE_URL/stats/octocat" | jq '.'
echo ""
echo ""

# Test 5: Stats endpoint again (count should be same)
echo -e "${YELLOW}Test 5: Stats Again (Count Should Be Same)${NC}"
echo "GET $BASE_URL/stats/octocat"
curl -s "$BASE_URL/stats/octocat" | jq '.'
echo ""
echo ""

# Test 6: Invalid profile name (too long)
echo -e "${YELLOW}Test 6: Invalid Profile (Too Long)${NC}"
echo "GET $BASE_URL/count/this_is_a_very_long_username_that_exceeds_the_limit"
curl -s "$BASE_URL/count/this_is_a_very_long_username_that_exceeds_the_limit" | jq '.'
echo ""
echo ""

# Test 7: Invalid profile name (special chars)
echo -e "${YELLOW}Test 7: Invalid Profile (Special Characters)${NC}"
echo "GET $BASE_URL/count/user@name"
curl -s "$BASE_URL/count/user@name" | jq '.'
echo ""
echo ""

# Test 8: Website counter
echo -e "${YELLOW}Test 8: Website Counter${NC}"
echo "GET $BASE_URL/website/example.com"
curl -s "$BASE_URL/website/example.com" | jq '.'
echo ""
echo ""

# Test 9: Website stats
echo -e "${YELLOW}Test 9: Website Stats${NC}"
echo "GET $BASE_URL/stats/website/example.com"
curl -s "$BASE_URL/stats/website/example.com" | jq '.'
echo ""
echo ""

# Test 10: Badge endpoint (flat style)
echo -e "${YELLOW}Test 10: Badge Endpoint (Flat Style)${NC}"
echo "GET $BASE_URL/badge/testuser"
curl -s "$BASE_URL/badge/testuser" | head -c 200
echo "..."
echo ""
echo ""

# Test 11: Badge endpoint (flat-square style, blue)
echo -e "${YELLOW}Test 11: Badge (Flat-Square, Blue)${NC}"
echo "GET $BASE_URL/badge/testuser?style=flat-square&color=blue"
curl -s "$BASE_URL/badge/testuser?style=flat-square&color=blue" | head -c 200
echo "..."
echo ""
echo ""

# Test 12: Badge endpoint (for-the-badge style, orange)
echo -e "${YELLOW}Test 12: Badge (For-The-Badge, Orange)${NC}"
echo "GET $BASE_URL/badge/testuser?style=for-the-badge&color=orange"
curl -s "$BASE_URL/badge/testuser?style=for-the-badge&color=orange" | head -c 200
echo "..."
echo ""
echo ""

# Test 13: Invalid badge (should return error badge)
echo -e "${YELLOW}Test 13: Invalid Badge (Error State)${NC}"
echo "GET $BASE_URL/badge/invalid@user"
curl -s "$BASE_URL/badge/invalid@user" | head -c 200
echo "..."
echo ""
echo ""

echo -e "${GREEN}=================================="
echo "All Tests Completed!"
echo "==================================${NC}"
