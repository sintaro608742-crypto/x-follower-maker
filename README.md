# Xフォロワーメーカー

**AI自動投稿でXのフォロワーを増やすサービス**

[![Deployment](https://img.shields.io/badge/status-live-brightgreen)](https://xfollowermaker.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## 🌟 概要

Xフォロワーメーカーは、Google Gemini AIを活用してX（旧Twitter）の投稿を自動生成・投稿し、フォロワー増加を支援するWebアプリケーションです。

**本番環境**: https://xfollowermaker.vercel.app

## ✨ 主要機能

### 🤖 AI自動投稿
- **Gemini 2.0 Flash**による高品質な投稿生成
- ユーザーが設定したキーワードに基づいたコンテンツ作成
- 毎時0分の自動投稿（Upstash QStash）

### 📊 フォロワー分析
- フォロワー数の推移グラフ
- 毎日8時の自動記録
- 成長率の可視化

### ✏️ 投稿管理
- AI生成投稿のプレビュー・編集
- 投稿の承認/却下
- 投稿スケジュール管理
- 手動投稿の追加

### 🔐 セキュリティ
- Twitter OAuth 2.0認証
- トークンのAES-256-GCM暗号化
- NextAuth.jsによるセッション管理

## 🛠 技術スタック

### フロントエンド
- **React 18** - UIライブラリ
- **TypeScript 5** - 型安全性
- **MUI v6** - UIコンポーネント
- **Zustand** - 状態管理
- **React Router v6** - ルーティング
- **React Query** - データフェッチング
- **Vite 5** - ビルドツール
- **Recharts** - グラフ描画
- **Framer Motion** - アニメーション

### バックエンド
- **Next.js 14 App Router** - フルスタックフレームワーク
- **TypeScript 5** - 型安全性
- **Drizzle ORM** - データベースORM
- **NextAuth.js** - 認証
- **twitter-api-v2** - Twitter API v2クライアント

### インフラ・外部サービス
- **Vercel** - ホスティング
- **Neon PostgreSQL** - データベース
- **Google Gemini 2.0 Flash** - AI投稿生成
- **Upstash QStash** - Cronジョブ
- **X API v2** - ツイート投稿・フォロワー取得

## 📦 セットアップ

### 前提条件

- Node.js 18.x以上
- npm または yarn
- X Developer Account（https://developer.twitter.com/）
- Google AI Studio Account（https://ai.google.dev/）
- Neon PostgreSQL Account（https://neon.tech/）
- Upstash QStash Account（https://upstash.com/）

### 環境変数設定

`.env.local`ファイルを作成：

```bash
# Database
DATABASE_URL=postgresql://user:password@host/database

# X (Twitter) API
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
TWITTER_BEARER_TOKEN=your_bearer_token

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# NextAuth.js
NEXTAUTH_URL=http://localhost:8432
NEXTAUTH_SECRET=your_secret_key_32_bytes

# Upstash QStash
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=your_current_key
QSTASH_NEXT_SIGNING_KEY=your_next_key

# Encryption
ENCRYPTION_KEY=your_encryption_key_32_bytes

# URLs
URL=http://localhost:8432
NEXT_PUBLIC_API_URL=http://localhost:8432
CORS_ORIGIN=http://localhost:3247
```

### インストール

```bash
# 依存関係インストール
npm install

# データベースマイグレーション
npm run db:push

# 開発サーバー起動
npm run dev
```

開発サーバー:
- **バックエンド**: http://localhost:8432
- **フロントエンド**: http://localhost:3247

## 🚀 使い方

### 1. アカウント作成

https://xfollowermaker.vercel.app にアクセスしてアカウントを作成

### 2. X連携

ダッシュボードから「X連携」ボタンをクリックしてTwitterアカウントを連携

### 3. キーワード設定

興味のあるキーワードを最大3つ選択（例: テクノロジー、ビジネス、AI）

### 4. 投稿頻度設定

1日の投稿回数を設定（3〜5回/日）

### 5. 投稿時間帯設定

投稿したい時間帯を選択（例: 8時、12時、18時）

### 6. 自動投稿開始

設定完了後、AIが自動的に投稿を生成し、スケジュールに従って投稿します

### 7. 投稿プレビュー

`/posts`ページで生成された投稿をプレビュー・編集・承認できます

## 📊 アーキテクチャ

```
┌─────────────────┐
│   Frontend      │  React + MUI + Vite
│   (Port 3247)   │  http://localhost:3247
└────────┬────────┘
         │ API Calls
         ↓
┌─────────────────┐
│   Backend       │  Next.js 14 App Router
│   (Port 8432)   │  http://localhost:8432
└────────┬────────┘
         │
    ┌────┴────┬────────┬─────────┐
    ↓         ↓        ↓         ↓
┌─────┐  ┌──────┐  ┌──────┐  ┌────────┐
│ Neon│  │Gemini│  │X API │  │QStash  │
│ DB  │  │ AI   │  │  v2  │  │ Cron   │
└─────┘  └──────┘  └──────┘  └────────┘
```

## 📁 プロジェクト構造

```
Xフォロワーメーカー/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # APIエンドポイント
│   │   │   ├── auth/           # NextAuth.js
│   │   │   ├── cron/           # Cronジョブ
│   │   │   ├── posts/          # 投稿API
│   │   │   └── twitter/        # X API統合
│   │   ├── layout.tsx          # ルートレイアウト
│   │   └── page.tsx            # ホームページ
│   ├── db/                     # データベース
│   │   ├── schema.ts           # Drizzleスキーマ
│   │   └── client.ts           # DB接続
│   ├── lib/                    # ユーティリティ
│   │   ├── gemini.ts           # Gemini API
│   │   ├── twitter/            # Twitter API
│   │   └── encryption.ts       # 暗号化
│   ├── repositories/           # データアクセス層
│   └── types/                  # 型定義
├── frontend/                   # Reactフロントエンド
│   ├── src/
│   │   ├── components/         # Reactコンポーネント
│   │   ├── pages/              # ページ
│   │   └── store/              # Zustand store
│   └── tests/                  # E2Eテスト
├── docs/                       # ドキュメント
└── scripts/                    # ユーティリティスクリプト
```

## 🧪 テスト

### E2Eテスト（Playwright）

```bash
cd frontend
npm run test:e2e
```

**テスト結果**: 17/17合格 ✅

### 型チェック

```bash
npm run build
```

**TypeScriptエラー**: 0件 ✅

## 📈 パフォーマンス

- **Lighthouse スコア**: 90+
- **First Load JS**: 87.2 kB
- **ビルド時間**: ~30秒
- **デプロイ時間**: ~35秒

## 🔒 セキュリティ

- **トークン暗号化**: AES-256-GCM
- **パスワードハッシュ**: bcrypt（saltRounds: 10）
- **HTTPS**: Vercel自動SSL
- **CORS**: 適切なオリジン設定
- **環境変数**: Vercelで安全に管理

## 📝 API制限

### X API Free Tier
- **投稿**: 1,500ツイート/月
- **推奨設定**: 1日50ツイート以下

### Gemini API Free Tier
- **リクエスト**: 1,500リクエスト/日
- **レート制限**: 15リクエスト/分

### Neon PostgreSQL Free Tier
- **ストレージ**: 0.5 GB
- **稼働時間**: 191.9時間/月

## 🐛 トラブルシューティング

詳細は [`docs/QSTASH_SETUP.md`](docs/QSTASH_SETUP.md) を参照

### よくある問題

#### 1. Cronが実行されない
- Upstash QStashのスケジュールが有効か確認
- Vercel環境変数が正しく設定されているか確認

#### 2. Twitter OAuth エラー
- X Developer Portalで認証情報を確認
- リダイレクトURLが正しいか確認

#### 3. データベース接続エラー
- Neon PostgreSQLが稼働しているか確認
- DATABASE_URLが正しいか確認

## 🤝 コントリビューション

コントリビューションは大歓迎です！

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照

## 👤 作成者

- **GitHub**: [@sintaro608742-crypto](https://github.com/sintaro608742-crypto)
- **プロジェクト**: [X-Follower-Maker](https://github.com/sintaro608742-crypto/x-follower-maker)

## 🙏 謝辞

- [Next.js](https://nextjs.org/) - フルスタックフレームワーク
- [Vercel](https://vercel.com/) - ホスティング
- [Neon](https://neon.tech/) - PostgreSQL
- [Google Gemini](https://ai.google.dev/) - AI API
- [Upstash](https://upstash.com/) - QStash
- [MUI](https://mui.com/) - UIコンポーネント

---

**開発期間**: 2025年11月21日 - 2025年11月24日（4日間）

**Phase 1 MVP**: ✅ 完成

**本番環境**: https://xfollowermaker.vercel.app
