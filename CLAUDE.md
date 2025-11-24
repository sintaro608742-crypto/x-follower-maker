# プロジェクト設定

## 基本設定
```yaml
プロジェクト名: Xフォロワーメーカー
開始日: 2025年11月21日
開発アプローチ: 究極のMVP（2ページ）
Phase: Phase 1（MVP）

技術スタック:
  frontend:
    - React 18
    - TypeScript 5
    - MUI v6
    - Zustand
    - React Router v6
    - React Query
    - Vite 5
    - Recharts
  backend:
    - Next.js 14 App Router
    - TypeScript 5
    - Drizzle ORM
    - NextAuth.js
    - twitter-api-v2
  database:
    - PostgreSQL
    - Neon (https://neon.tech)
  ai:
    - Google Gemini 2.0 Flash
  cron:
    - Upstash QStash
  hosting:
    - Vercel
```

## 開発環境
```yaml
ポート設定:
  # 複数プロジェクト並行開発のため、一般的でないポートを使用
  frontend: 3247
  backend: 8432
  database: 5433

環境変数:
  設定ファイル: .env.local（ルートディレクトリ）
  必須項目:
    # Database
    - DATABASE_URL

    # X (Twitter) API
    - TWITTER_CLIENT_ID
    - TWITTER_CLIENT_SECRET
    - TWITTER_BEARER_TOKEN

    # Google Gemini API
    - GEMINI_API_KEY

    # NextAuth.js
    - NEXTAUTH_URL
    - NEXTAUTH_SECRET

    # Upstash QStash
    - QSTASH_URL
    - QSTASH_TOKEN
    - QSTASH_CURRENT_SIGNING_KEY
    - QSTASH_NEXT_SIGNING_KEY

    # Encryption
    - ENCRYPTION_KEY
```

## テスト認証情報
```yaml
開発用アカウント:
  email: test@xfollowermaker.local
  password: DevTest2025!Secure

外部サービス:
  X Developer Account: 本番環境で取得必要（https://developer.twitter.com/）
  Google AI Studio: 即時取得可能（https://ai.google.dev/）
  Neon PostgreSQL: 即時取得可能（https://neon.tech/）
  Upstash QStash: 即時取得可能（https://upstash.com/）
  Vercel: 即時取得可能（https://vercel.com/）
```

## コーディング規約

### 命名規則
```yaml
ファイル名:
  - コンポーネント: PascalCase.tsx (例: DashboardPage.tsx)
  - ユーティリティ: camelCase.ts (例: encryptToken.ts)
  - 定数: UPPER_SNAKE_CASE.ts (例: API_ENDPOINTS.ts)
  - API Routes: kebab-case (例: generate-posts.ts)

変数・関数:
  - 変数: camelCase
  - 関数: camelCase
  - 定数: UPPER_SNAKE_CASE
  - 型/インターフェース: PascalCase
  - React Hooks: use + PascalCase (例: useTwitterAuth)
```

### コード品質
```yaml
必須ルール:
  - TypeScript: strictモード有効
  - 未使用の変数/import禁止
  - console.log本番環境禁止（開発環境のみ許可）
  - エラーハンドリング必須
  - 環境変数の直接参照禁止（バリデーション層を通す）

フォーマット:
  - インデント: スペース2つ
  - セミコロン: あり
  - クォート: シングル（JSX内はダブル）
  - 行末カンマ: あり
```

## UI/UXライブラリ

### アニメーションライブラリ
```yaml
Framer Motion:
  インストール: npm install framer-motion
  用途: ページ遷移、要素アニメーション、マイクロインタラクション

主要な使用箇所:
  - カウントアップアニメーション（フォロワー数）
  - グラフ描画アニメーション
  - ページ遷移（スライド+フェード）
  - ボタン・カードのホバー効果
  - モーダル開閉
```

### アイコンライブラリ
```yaml
Lucide Icons:
  インストール: npm install lucide-react
  用途: 全てのアイコン表示
  サイズ: 16px, 24px, 32px
```

### デザインシステム
```yaml
カラーコード:
  Primary: #1DA1F2（Xブルー）
  Success: #10B981（緑）
  Warning: #F59E0B（オレンジ）
  Error: #EF4444（赤）
  Neutral: #6B7280（グレー）
  Background: #F9FAFB

フォント:
  - Inter（英数字）
  - Noto Sans JP（日本語）
  - SF Mono（数値表示用）

スペーシング: 8の倍数（4px, 8px, 16px, 24px, 32px, 48px, 64px）
```

## プロジェクト固有ルール

### APIエンドポイント
```yaml
命名規則:
  - RESTful形式を厳守
  - Next.js App Router形式: /api/[リソース]/[アクション]
  - 例:
    - POST /api/posts/generate
    - GET /api/posts
    - PATCH /api/posts/[id]
    - DELETE /api/posts/[id]
    - POST /api/twitter/oauth/callback
    - GET /api/health

認証:
  - 全APIエンドポイント（/api/health除く）はNextAuth.jsセッション必須
  - セッションなしの場合は401 Unauthorized返却
```

### 型定義
```yaml
配置:
  frontend: src/types/index.ts
  backend: src/types/index.ts

同期ルール:
  - 両ファイルは常に同一内容を保つ
  - 片方を更新したら即座にもう片方も更新
  - API Request/Response型は共通化

主要型:
  - User
  - Post
  - FollowerStats
  - TwitterAuthTokens
  - PostGenerationRequest
  - PostGenerationResponse
```

### データベース操作
```yaml
ORM: Drizzle ORM

スキーマ定義:
  - 配置: src/db/schema.ts
  - マイグレーション: src/db/migrations/

クエリ:
  - 生SQLは禁止（Drizzle ORMのクエリビルダーを使用）
  - トランザクション必須の操作:
    - 複数テーブルへの書き込み
    - 外部API呼び出し + DB書き込み
  - インデックス:
    - user_id（全テーブル）
    - scheduled_at（postsテーブル）
    - recorded_at（follower_statsテーブル）
```

### X API統合
```yaml
ライブラリ: twitter-api-v2

注意点:
  - Free Tierの制限: 1,500ツイート/月
  - トークンは必ず暗号化して保存
  - リフレッシュトークンの自動更新実装
  - エラーハンドリング:
    - 429 Rate Limit: X-Rate-Limit-Resetまで待機
    - 401 Unauthorized: トークン再取得フロー
    - 403 Forbidden: ユーザーに通知

レート制限:
  - 投稿: 300ツイート/3時間（Free Tierは1,500/月が上限）
  - ユーザー情報取得: 75リクエスト/15分
```

### Gemini API統合
```yaml
モデル: gemini-2.0-flash-exp

プロンプト設計:
  - システムプロンプト:
    「あなたはX（Twitter）の投稿を生成する専門家です。
     ユーザーの興味関心に基づいて、エンゲージメントが高い魅力的なツイートを作成してください。」

  - ユーザープロンプト:
    「以下のキーワードに関する有益で魅力的なツイートを{count}件生成してください。
     キーワード: {keywords}

     条件:
     - 各ツイートは280文字以内（日本語）
     - 自然で読みやすい表現
     - ハッシュタグは最大2つまで
     - 絵文字は控えめに使用
     - スパムと判定されない内容

     JSON形式で返却:
     {{"tweets": ["ツイート1", "ツイート2", ...]}}」

エラーハンドリング:
  - 429 Rate Limit: 15RPMの制限に注意、待機してリトライ
  - 無効な応答: 再生成リクエスト（最大3回）
  - JSONパースエラー: フォールバック処理
```

### セキュリティ
```yaml
暗号化:
  - アルゴリズム: AES-256-GCM
  - 対象データ:
    - twitter_access_token
    - twitter_refresh_token
  - キー管理: 環境変数ENCRYPTION_KEY（32バイトランダム文字列）

パスワード:
  - ハッシュ: bcrypt（saltRounds: 10）
  - 最小長: 8文字
  - 要件: 英数字混在

セッション:
  - NextAuth.js JWT戦略
  - 有効期限: 30日
  - セキュアクッキー（HTTPS環境）
```

## 🆕 最新技術情報（知識カットオフ対応）

### X API v2の重要な変更（2024-2025）
```yaml
2024年10月:
  - Basic Tierの価格改定: $100/月 → $200/月
  - 読み取り制限増加: 10,000 → 15,000ポスト/月

2025年8月:
  - Free Tierからいいね・フォローエンドポイント削除
  - 投稿機能のみ利用可能に

注意事項:
  - Phase 1はFree Tierで開発
  - いいね・フォロー機能はPhase 2（Basic Tier）で実装
  - API仕様変更を常に監視
```

### Gemini APIの最新情報
```yaml
2025年版:
  - gemini-2.0-flash-exp: 最新の高速モデル
  - 料金: 入力$0.10/1M、出力$0.40/1M
  - 無料枠: 1,500リクエスト/日、15リクエスト/分
  - 日本語品質: 大幅に向上

推奨事項:
  - Flash 2 Liteは安定版リリース後に検討
  - 現時点ではgemini-2.0-flash-expを使用
```

### Next.js 14の注意点
```yaml
App Router:
  - Server Components がデフォルト
  - 'use client' ディレクティブを明示的に使用
  - Server Actions は /api routes と併用可能

環境変数:
  - NEXT_PUBLIC_ プレフィックスはクライアント側で利用可能
  - サーバー側のみの環境変数はプレフィックスなし
  - .env.local は Git にコミットしない
```

## プロジェクト構造

```
Xフォロワーメーカー/
├── docs/
│   ├── requirements.md           # 要件定義書
│   ├── SCOPE_PROGRESS.md         # 進捗管理
│   ├── TECHNICAL_FEASIBILITY_REPORT.md  # 技術調査
│   └── CODE_SAMPLES.md           # コードサンプル集
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # APIエンドポイント
│   │   │   ├── auth/             # NextAuth.js
│   │   │   ├── posts/            # 投稿API
│   │   │   ├── twitter/          # X API統合
│   │   │   └── health/           # ヘルスチェック
│   │   ├── dashboard/            # P-001: ダッシュボード
│   │   ├── posts/                # P-002: 投稿プレビュー
│   │   └── layout.tsx            # ルートレイアウト
│   ├── components/               # Reactコンポーネント
│   │   ├── dashboard/
│   │   ├── posts/
│   │   └── common/
│   ├── db/                       # データベース
│   │   ├── schema.ts             # Drizzleスキーマ
│   │   ├── migrations/           # マイグレーション
│   │   └── client.ts             # DB接続
│   ├── lib/                      # ユーティリティ
│   │   ├── gemini.ts             # Gemini API
│   │   ├── twitter.ts            # X API
│   │   ├── encryption.ts         # 暗号化
│   │   └── qstash.ts             # Upstash QStash
│   ├── types/                    # 型定義
│   │   └── index.ts
│   └── hooks/                    # カスタムフック
│       ├── useTwitterAuth.ts
│       ├── usePosts.ts
│       └── useFollowerStats.ts
├── public/                       # 静的ファイル
├── tests/                        # テスト
│   ├── unit/
│   └── e2e/
├── .env.local                    # 環境変数（Gitignore）
├── .env.example                  # 環境変数テンプレート
├── CLAUDE.md                     # このファイル
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── README.md
```

## 開発フロー

### 1. 環境セットアップ
```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.local を編集して各種APIキーを設定

# データベースマイグレーション
npm run db:push

# 開発サーバー起動
npm run dev
```

### 2. 開発時の注意点
```yaml
コミット前:
  - npm run lint でエラーがないこと
  - npm run type-check で型エラーがないこと
  - 関連するテストが通ること

PR作成時:
  - 機能の説明を明記
  - スクリーンショット添付（UI変更時）
  - 関連するissue番号を記載
```

### 3. デプロイ
```yaml
Vercel:
  - main ブランチへのpushで自動デプロイ
  - 環境変数はVercel UIで設定
  - プレビューデプロイは全PRで自動生成

デプロイ前チェック:
  - 環境変数が正しく設定されているか
  - データベースマイグレーションが完了しているか
  - ヘルスチェック (/api/health) が200を返すか
```

## トラブルシューティング

### よくある問題

#### 1. X API認証エラー
```yaml
原因: トークンの期限切れ
解決: リフレッシュトークンで再取得、ユーザーに再認証を促す
```

#### 2. Gemini API Rate Limit
```yaml
原因: 15 RPMの制限超過
解決: リトライロジック実装、ユーザーに「生成中」メッセージ表示
```

#### 3. データベース接続エラー
```yaml
原因: Neon の稼働時間制限（191.9時間/月）
解決: Scale-to-Zero設定確認、必要に応じてLaunchプラン検討
```

#### 4. Vercel Serverless Function Timeout
```yaml
原因: 10秒制限（Hobby Plan）
解決: 長時間処理は分割、Upstash QStashにオフロード
```

## Phase 1 完了基準

```yaml
機能要件:
  - [ ] X OAuth連携が動作する
  - [ ] キーワード設定が保存される
  - [ ] Gemini APIで投稿が生成される
  - [ ] 投稿スケジュールが設定できる
  - [ ] 定期投稿が自動実行される
  - [ ] フォロワー数推移グラフが表示される
  - [ ] 投稿プレビュー・編集ができる

品質要件:
  - [ ] 単体テストカバレッジ 70%以上
  - [ ] E2Eテスト主要フロー網羅
  - [ ] Lighthouseスコア 90以上
  - [ ] エラーハンドリング実装済み

運用要件:
  - [ ] ヘルスチェック実装
  - [ ] エラーログ記録
  - [ ] 本番環境デプロイ成功
  - [ ] 10人のベータユーザーで動作確認
```

---

### 13. E2Eテスト自律実行の絶対原則

**【重要】セッション開始時・compact後の自動判定**

このセクションはE2Eテストオーケストレーターによって自動生成されました。

---

**最初に必ず専門知識を注入してください**

E2Eテスト実行中の場合、以下を実行してから開始してください：

```
inject_knowledge ツールで keyword: "@E2Eテストオーケストレーター"
を実行してから開始してください。（初回必須・compact後も必須）
```

重要：キーワードは "@E2Eテストオーケストレーター"
をそのまま使用してください。変換や推測は不要です。

準備完了です。まず知識注入を実行してから、タスクを開始してください。

---

**E2Eテストオーケストレーター実行中の判定**:
- SCOPE_PROGRESS.mdに「## 📊 E2Eテスト全体進捗」が存在する場合
- または、セッション再開時に前回のメッセージに「E2Eテスト」「オーケストレーター」キーワードがある場合

**セッション開始時・compact後の自動処理**:
1. 上記の判定基準でE2Eテスト実行中と判定
2. inject_knowledge('@E2Eテストオーケストレーター') を必ず実行
3. docs/e2e-best-practices.md の存在確認（なければ初期テンプレート作成）
4. SCOPE_PROGRESS.mdから [ ] テストの続きを自動で特定
5. [x] のテストは絶対にスキップ
6. ユーザー確認不要、完全自律モードで継続
7. ページ選定も自動（未完了ページを上から順に選択）
8. 停止条件：全テスト100%完了のみ

**5回エスカレーション後の処理**:
- チェックリストに [-] マークを付ける
- docs/e2e-test-history/skipped-tests.md に記録
- 次のテストへ自動で進む（停止しない）

**ベストプラクティス自動蓄積**:
- 各テストで成功した方法を docs/e2e-best-practices.md に自動保存
- 後続テストが前のテストの知見を自動活用
- 試行錯誤が減っていく（学習効果）

**重要**:
- この原則はCLAUDE.mdに記載されているため、compact後も自動で適用される
- セッション開始時にこのセクションがない場合、オーケストレーターが自動で追加する

---

**最終更新日**: 2025年11月21日
**バージョン**: 1.0（Phase 1 MVP）
