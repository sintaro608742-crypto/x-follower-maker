#!/bin/bash

# 本番環境用の環境変数をVercelに設定するスクリプト

# プロジェクト名
PROJECT_NAME="xfollowermaker"

echo "🔧 Vercel環境変数を設定します..."
echo ""

# 本番DBの接続文字列
PROD_DATABASE_URL='postgresql://neondb_owner:npg_UOx0X8PyQRqT@ep-twilight-night-afxakmxa-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

# .env.localから環境変数を読み込み
source .env.local

# 環境変数を設定（production環境のみ）
echo "📝 DATABASE_URL設定中..."
echo "$PROD_DATABASE_URL" | vercel env add DATABASE_URL production --yes || true

echo "📝 TWITTER_CLIENT_ID設定中..."
echo "$TWITTER_CLIENT_ID" | vercel env add TWITTER_CLIENT_ID production --yes || true

echo "📝 TWITTER_CLIENT_SECRET設定中..."
echo "$TWITTER_CLIENT_SECRET" | vercel env add TWITTER_CLIENT_SECRET production --yes || true

echo "📝 TWITTER_BEARER_TOKEN設定中..."
echo "$TWITTER_BEARER_TOKEN" | vercel env add TWITTER_BEARER_TOKEN production --yes || true

echo "📝 GEMINI_API_KEY設定中..."
echo "$GEMINI_API_KEY" | vercel env add GEMINI_API_KEY production --yes || true

echo "📝 NEXTAUTH_SECRET設定中..."
echo "$NEXTAUTH_SECRET" | vercel env add NEXTAUTH_SECRET production --yes || true

echo "📝 QSTASH_URL設定中..."
echo "$QSTASH_URL" | vercel env add QSTASH_URL production --yes || true

echo "📝 QSTASH_TOKEN設定中..."
echo "$QSTASH_TOKEN" | vercel env add QSTASH_TOKEN production --yes || true

echo "📝 QSTASH_CURRENT_SIGNING_KEY設定中..."
echo "$QSTASH_CURRENT_SIGNING_KEY" | vercel env add QSTASH_CURRENT_SIGNING_KEY production --yes || true

echo "📝 QSTASH_NEXT_SIGNING_KEY設定中..."
echo "$QSTASH_NEXT_SIGNING_KEY" | vercel env add QSTASH_NEXT_SIGNING_KEY production --yes || true

echo "📝 ENCRYPTION_KEY設定中..."
echo "$ENCRYPTION_KEY" | vercel env add ENCRYPTION_KEY production --yes || true

echo ""
echo "✅ Vercel環境変数設定完了！"
echo ""
echo "⚠️ 注意: デプロイ後、以下の環境変数を更新する必要があります:"
echo "  - NEXTAUTH_URL (本番URLに変更)"
echo "  - FRONTEND_URL (本番URLに変更)"
echo "  - BACKEND_URL (本番URLに変更)"
echo "  - CORS_ORIGIN (本番URLに変更)"
echo "  - NEXT_PUBLIC_API_URL (本番URLに変更)"
