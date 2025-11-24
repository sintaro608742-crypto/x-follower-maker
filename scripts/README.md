# Scripts Directory

このディレクトリには、開発・運用・テストに使用するユーティリティスクリプトが含まれています。

## 📦 デモデータ管理

### `setup-demo-data.mjs` ⭐ 推奨

**用途**: 包括的なデモデータを一括セットアップ

**実行方法**:
```bash
npm run demo:setup
```

**機能**:
- ✅ テストユーザー作成（test@xfollowermaker.local）
- ✅ 5件のスケジュール投稿（即時、10分後、1時間後、2時間後、承認待ち）
- ✅ 31日分のフォロワー統計（成長曲線シミュレート）

**出力例**:
```
🚀 デモデータセットアップ開始...

1️⃣ テストユーザーの確認...
   ✅ テストユーザー確認済み: 5efe3e7a-659b-41a8-81b3-dd12852b41a6

2️⃣ スケジュール投稿の作成...
   ✅ 承認済み 2025/11/24 6:16:33 - 【即時投稿テスト】...
   ✅ 承認済み 2025/11/24 6:31:33 - 【10分後投稿】...
   ...

3️⃣ フォロワー統計の作成（過去30日分）...
   ✅ 31日分のフォロワー統計を作成しました
   最新: 146フォロワー / 43フォロー中

📊 セットアップ完了サマリー:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ テストユーザー: test@xfollowermaker.local
✅ パスワード: DevTest2025!Secure
✅ ユーザーID: 5efe3e7a-659b-41a8-81b3-dd12852b41a6
✅ スケジュール投稿: 5件
✅ フォロワー統計: 31日分
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**使用タイミング**:
- 初回セットアップ時
- デモ環境のリセット時
- E2Eテスト前のデータ準備

---

### `get-demo-user.mjs`

**用途**: デモユーザー情報の確認

**実行方法**:
```bash
node scripts/get-demo-user.mjs
```

**機能**:
- `demo@example.com` ユーザーの情報を取得
- ユーザーIDとメールアドレスを表示

**出力例**:
```json
[
  {
    "id": "5efe3e7a-659b-41a8-81b3-dd12852b41a6",
    "email": "demo@example.com"
  }
]
```

**使用タイミング**:
- デモユーザーの存在確認時
- ユーザーIDの取得時

---

### `check-demo-user.ts`

**用途**: デモユーザーの詳細情報確認（TypeScript）

**実行方法**:
```bash
tsx scripts/check-demo-user.ts
```

**機能**:
- `demo@example.com` ユーザーの詳細情報を取得
- ID、メール、キーワードを表示

**出力例**:
```json
{
  "id": "5efe3e7a-659b-41a8-81b3-dd12852b41a6",
  "email": "demo@example.com",
  "keywords": ["プログラミング・技術", "ビジネス・起業"]
}
```

**使用タイミング**:
- デモユーザーのキーワード設定確認時
- デバッグ時

---

### `update-demo-user.ts`

**用途**: デモユーザーのキーワード更新

**実行方法**:
```bash
tsx scripts/update-demo-user.ts
```

**機能**:
- `demo@example.com` ユーザーのキーワードを「ビジネス・起業」に更新
- E2Eテストで別のキーワードを選択できるようにする

**出力例**:
```json
{
  "id": "5efe3e7a-659b-41a8-81b3-dd12852b41a6",
  "keywords": ["ビジネス・起業"]
}
```

**使用タイミング**:
- E2Eテスト前のデータリセット
- キーワード選択テストの準備

---

### `check-cron-execution.mjs`

**用途**: Cronジョブの実行状況確認

**実行方法**:
```bash
node scripts/check-cron-execution.mjs
```

**機能**:
- 投稿ステータスの確認（scheduled/posted/failed）
- 最新5件のフォロワー統計表示
- 次の投稿予定表示
- Cron動作状況の診断

**出力例**:
```
🔍 Cronジョブ実行状況を確認中...

1️⃣ 投稿ステータス:
   ✅ [POSTED] 2025/11/24 6:16:33
      【即時投稿テスト】この投稿は即座に投稿される予定です...
      🐦 Tweet ID: 1234567890
      🔗 https://twitter.com/i/web/status/1234567890

   📊 ステータスサマリー:
      - scheduled: 2件
      - posted: 3件
      - failed: 0件

2️⃣ フォロワー統計:
   最新5件:
   📊 2025/11/24 6:21:33: 146フォロワー / 43フォロー中

3️⃣ 次の実行予定:
   ⏰ 2025/11/24 16:00:00 （35分後）
      【次回投稿】...
```

**使用タイミング**:
- Cron動作確認時
- 投稿が実行されているか確認したい時
- デバッグ時

---

## 📝 投稿管理

### `create-scheduled-post.mjs`

**用途**: スケジュール投稿を個別作成

**実行方法**:
```bash
node scripts/create-scheduled-post.mjs
```

**機能**:
- 指定ユーザー（デフォルト: 38c5a595-d40d-4276-8485-3424c8a3fe3c）の10分後投稿を作成
- テスト用の投稿データを生成

**注意事項**:
- ⚠️ ユーザーIDがハードコードされているため、実行前に編集が必要
- 推奨: `setup-demo-data.mjs` を使用する

**出力例**:
```
投稿予定データを作成しました:
{
  "id": "...",
  "content": "E2Eテスト用投稿（10分後投稿予定）",
  "scheduled_at": "2025-11-24T06:31:33.000Z",
  "status": "scheduled"
}

予定日時: 2025/11/24 15:31:33
```

**使用タイミング**:
- 個別の投稿テストデータ作成時
- Cron動作確認用の投稿作成時

---

## 🔧 実行要件

### 環境変数
全てのスクリプトは `.env.local` から環境変数を読み込みます。

必須の環境変数:
```bash
DATABASE_URL=postgresql://user:password@host/database
```

### 依存パッケージ

**Node.js スクリプト (.mjs)**:
- `@neondatabase/serverless` - Neon PostgreSQL接続
- `dotenv` - 環境変数読み込み
- `bcryptjs` - パスワードハッシュ（setup-demo-data.mjsのみ）

**TypeScript スクリプト (.ts)**:
- `tsx` - TypeScript実行環境
- Drizzle ORM設定（src/db/）

---

## 📚 使用例

### 初回セットアップ
```bash
# 1. デモデータを一括セットアップ
npm run demo:setup

# 2. デモユーザーでログイン
# https://xfollowermaker.vercel.app
# Email: test@xfollowermaker.local
# Password: DevTest2025!Secure
```

### E2Eテスト前の準備
```bash
# 1. デモユーザーのキーワードをリセット
tsx scripts/update-demo-user.ts

# 2. E2Eテスト実行
npm run test:e2e
```

### デバッグ
```bash
# デモユーザーの情報確認
tsx scripts/check-demo-user.ts

# または
node scripts/get-demo-user.mjs
```

---

## ⚠️ 注意事項

1. **本番環境での実行禁止**
   - これらのスクリプトは開発・テスト環境専用です
   - 本番データベースに対して実行しないでください

2. **ユーザーID**
   - `create-scheduled-post.mjs` はユーザーIDがハードコードされています
   - 実行前に `userId` 変数を編集してください

3. **データ上書き**
   - `setup-demo-data.mjs` は既存のフォロワー統計を削除します
   - 実行前にデータのバックアップを推奨します

4. **Cronジョブとの競合**
   - 投稿作成スクリプト実行後、QStashのCronジョブが自動で投稿を実行します
   - 投稿タイミングを調整する場合は `scheduled_at` を編集してください

---

## 🤝 メンテナンス

### スクリプト追加時のチェックリスト

新しいスクリプトを追加する場合:

- [ ] このREADME.mdに説明を追加
- [ ] package.jsonにnpmスクリプトを追加（必要に応じて）
- [ ] エラーハンドリングを実装
- [ ] 実行結果を明確に出力
- [ ] .env.localから環境変数を読み込む
- [ ] 実行に必要な依存パッケージをドキュメント化

---

**最終更新日**: 2025年11月24日
**作成者**: Xフォロワーメーカー開発チーム
