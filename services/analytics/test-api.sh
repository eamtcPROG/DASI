#!/bin/bash

# Simple script to test the Analytics Service API

BASE_URL="http://localhost:3002"

echo "🧪 Testing Analytics Service API"
echo "================================"
echo ""

echo "1️⃣  Testing /analytics/messages"
echo "--------------------------------"
curl -s "$BASE_URL/analytics/messages" | jq '.' || curl -s "$BASE_URL/analytics/messages"
echo ""
echo ""

echo "2️⃣  Testing /analytics/users"
echo "-----------------------------"
curl -s "$BASE_URL/analytics/users" | jq '.' || curl -s "$BASE_URL/analytics/users"
echo ""
echo ""

echo "3️⃣  Testing /analytics/general"
echo "------------------------------"
curl -s "$BASE_URL/analytics/general" | jq '.' || curl -s "$BASE_URL/analytics/general"
echo ""
echo ""

echo "✅ API Tests Complete!"
echo ""
echo "💡 Tip: Visit http://localhost:3002/api for Swagger UI"


