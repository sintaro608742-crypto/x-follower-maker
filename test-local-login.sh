#!/bin/bash

echo "Waiting for server..."
sleep 30

echo "=== Testing local login ==="
CSRF=$(curl -s http://localhost:8432/api/auth/csrf | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "CSRF Token: $CSRF"

curl -s -X POST "http://localhost:8432/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=demo@example.com&password=demo123&csrfToken=${CSRF}&redirect=false&json=true"
