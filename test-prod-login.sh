#!/bin/bash

echo "=== 1. CSRF取得 ==="
rm -f /tmp/cookies-prod.txt
CSRF_RESPONSE=$(curl -s -c /tmp/cookies-prod.txt https://xfollowermaker.vercel.app/api/auth/csrf)
echo "$CSRF_RESPONSE"

CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "CSRF Token: $CSRF_TOKEN"
echo ""

echo "=== 2. ログイン試行 ==="
LOGIN_RESPONSE=$(curl -s -i -b /tmp/cookies-prod.txt -c /tmp/cookies-prod.txt \
  -X POST "https://xfollowermaker.vercel.app/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=demo@example.com&password=demo123&csrfToken=${CSRF_TOKEN}&redirect=false&json=true")

echo "$LOGIN_RESPONSE" | head -30

echo ""
echo "=== 3. セッション確認 ==="
curl -s -b /tmp/cookies-prod.txt https://xfollowermaker.vercel.app/api/auth/session
echo ""
