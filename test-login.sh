#!/bin/bash

echo "=== CSRFトークン取得 ==="
CSRF_RESPONSE=$(curl -s -c /tmp/cookies.txt https://xfollowermaker.vercel.app/api/auth/csrf)
echo "$CSRF_RESPONSE"

CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "CSRF Token: $CSRF_TOKEN"

echo -e "\n=== ログイン試行 ==="
LOGIN_RESPONSE=$(curl -s -b /tmp/cookies.txt -c /tmp/cookies.txt \
  -X POST "https://xfollowermaker.vercel.app/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=demo@example.com&password=demo123&csrfToken=${CSRF_TOKEN}&redirect=false&json=true")
echo "$LOGIN_RESPONSE"

echo -e "\n=== セッション確認 ==="
SESSION_RESPONSE=$(curl -s -b /tmp/cookies.txt https://xfollowermaker.vercel.app/api/auth/session)
echo "$SESSION_RESPONSE"
