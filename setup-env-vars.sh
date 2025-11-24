#!/bin/bash
set -e

echo "🔧 Vercel環境変数を設定中..."

# .env.localから環境変数を抽出（grepとsedで）
get_env_value() {
  grep "^$1=" .env.local | sed 's/^[^=]*=//' | sed 's/"//g'
}

# TWITTER_CLIENT_ID
VAL=$(get_env_value "TWITTER_CLIENT_ID")
echo "$VAL" > /tmp/env.txt
vercel env add TWITTER_CLIENT_ID production < /tmp/env.txt
echo "✅ TWITTER_CLIENT_ID"

# TWITTER_CLIENT_SECRET
VAL=$(get_env_value "TWITTER_CLIENT_SECRET")
echo "$VAL" > /tmp/env.txt
vercel env add TWITTER_CLIENT_SECRET production < /tmp/env.txt
echo "✅ TWITTER_CLIENT_SECRET"

# TWITTER_BEARER_TOKEN
VAL=$(get_env_value "TWITTER_BEARER_TOKEN")
echo "$VAL" > /tmp/env.txt
vercel env add TWITTER_BEARER_TOKEN production < /tmp/env.txt
echo "✅ TWITTER_BEARER_TOKEN"

# GEMINI_API_KEY
VAL=$(get_env_value "GEMINI_API_KEY")
echo "$VAL" > /tmp/env.txt
vercel env add GEMINI_API_KEY production < /tmp/env.txt
echo "✅ GEMINI_API_KEY"

# NEXTAUTH_SECRET
VAL=$(get_env_value "NEXTAUTH_SECRET")
echo "$VAL" > /tmp/env.txt
vercel env add NEXTAUTH_SECRET production < /tmp/env.txt
echo "✅ NEXTAUTH_SECRET"

# ENCRYPTION_KEY
VAL=$(get_env_value "ENCRYPTION_KEY")
echo "$VAL" > /tmp/env.txt
vercel env add ENCRYPTION_KEY production < /tmp/env.txt
echo "✅ ENCRYPTION_KEY"

# QSTASH
VAL=$(get_env_value "QSTASH_URL")
echo "$VAL" > /tmp/env.txt
vercel env add QSTASH_URL production < /tmp/env.txt
echo "✅ QSTASH_URL"

VAL=$(get_env_value "QSTASH_TOKEN")
echo "$VAL" > /tmp/env.txt
vercel env add QSTASH_TOKEN production < /tmp/env.txt
echo "✅ QSTASH_TOKEN"

VAL=$(get_env_value "QSTASH_CURRENT_SIGNING_KEY")
echo "$VAL" > /tmp/env.txt
vercel env add QSTASH_CURRENT_SIGNING_KEY production < /tmp/env.txt
echo "✅ QSTASH_CURRENT_SIGNING_KEY"

VAL=$(get_env_value "QSTASH_NEXT_SIGNING_KEY")
echo "$VAL" > /tmp/env.txt
vercel env add QSTASH_NEXT_SIGNING_KEY production < /tmp/env.txt
echo "✅ QSTASH_NEXT_SIGNING_KEY"

rm /tmp/env.txt
echo ""
echo "🎉 環境変数設定完了！"
