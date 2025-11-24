# Upstash QStash スケジュール設定ガイド

本番環境で自動投稿を有効化するため、Upstash QStashでCronジョブをスケジュールします。

## 前提条件

- Vercelに本番デプロイ済み
- Upstash QStash環境変数が設定済み：
  - `QSTASH_URL`
  - `QSTASH_TOKEN`
  - `QSTASH_CURRENT_SIGNING_KEY`
  - `QSTASH_NEXT_SIGNING_KEY`

## セットアップ手順

### 1. Upstash ダッシュボードにアクセス

https://console.upstash.com/qstash にアクセスしてログイン

### 2. Schedules タブを開く

左メニューから "Schedules" をクリック

### 3. スケジュール作成: 自動投稿 (毎時0分)

"Create Schedule" ボタンをクリックして、以下を設定：

```
Name: Post Scheduled Tweets
Destination: https://xfollowermaker.vercel.app/api/cron/post-tweets
Cron: 0 * * * *
Method: POST
Headers: (空欄でOK、QStash署名が自動付与される)
Body: (空欄でOK)
```

- **Cron式の意味**: `0 * * * *` = 毎時0分に実行
- **例**: 0:00, 1:00, 2:00, ..., 23:00（1日24回）

"Create" をクリックして保存

### 4. スケジュール作成: フォロワー記録 (毎日8時)

もう一度 "Create Schedule" をクリックして、以下を設定：

```
Name: Record Follower Stats
Destination: https://xfollowermaker.vercel.app/api/cron/record-followers
Cron: 0 8 * * *
Method: POST
Headers: (空欄でOK)
Body: (空欄でOK)
```

- **Cron式の意味**: `0 8 * * *` = 毎日8:00（JST 8:00 = UTC 23:00前日）
- **注意**: Upstash QStashはUTC時刻で動作します

"Create" をクリックして保存

### 5. 動作確認

#### 5.1 即座にテスト実行

各スケジュールの右側にある "..." メニューから "Trigger Now" をクリック

#### 5.2 Vercelログで確認

```bash
vercel logs --follow
```

以下のようなログが表示されればOK：

```
[Cron] Starting post-tweets job
[Cron] Found 0 scheduled posts
[Cron] Post tweets job completed
```

#### 5.3 エラーが発生した場合

QStash署名検証エラーが出る場合：
- Vercel環境変数 `QSTASH_CURRENT_SIGNING_KEY` と `QSTASH_NEXT_SIGNING_KEY` が正しく設定されているか確認
- Upstash ダッシュボードの "Settings" → "Signing Keys" で最新のキーを確認

## Cron式の参考

### よく使うパターン

| Cron式 | 説明 | 実行例 |
|--------|------|--------|
| `0 * * * *` | 毎時0分 | 0:00, 1:00, 2:00, ... |
| `*/30 * * * *` | 30分おき | 0:00, 0:30, 1:00, 1:30, ... |
| `0 8 * * *` | 毎日8時 | 毎日 8:00 |
| `0 8,20 * * *` | 毎日8時と20時 | 毎日 8:00, 20:00 |
| `0 8 * * 1` | 毎週月曜8時 | 毎週月曜 8:00 |

### オンラインツール

Cron式の確認: https://crontab.guru/

## トラブルシューティング

### 1. Cronが実行されない

**確認項目**:
- Upstash QStash Dashboard → Logs で実行履歴を確認
- スケジュールが "Enabled" になっているか確認
- Destination URLが正しいか確認（HTTPSであること）

### 2. 署名検証エラー

**エラーメッセージ**: `QStash signature verification failed`

**解決方法**:
1. Vercel環境変数を確認：
   ```bash
   vercel env ls
   ```
2. 最新の署名キーを取得：
   - Upstash Dashboard → Settings → Signing Keys
3. Vercelに再設定：
   ```bash
   vercel env add QSTASH_CURRENT_SIGNING_KEY production
   vercel env add QSTASH_NEXT_SIGNING_KEY production
   ```
4. 再デプロイ：
   ```bash
   git commit --allow-empty -m "Redeploy for QStash keys"
   git push origin main
   ```

### 3. データベース接続エラー

**エラーメッセージ**: `Failed to connect to database`

**解決方法**:
- Vercel環境変数 `DATABASE_URL` が本番DBのURLであることを確認
- Neon PostgreSQL が稼働していることを確認

### 4. Twitter API エラー

**エラーメッセージ**: `Failed to post tweet` / `Rate limit exceeded`

**解決方法**:
- Twitter Free Tier の制限: 1,500ツイート/月
- 投稿頻度を調整（1日50ツイート以下に抑える）
- ユーザーのTwitter連携が有効か確認

## 次のステップ

1. ✅ QStashスケジュール作成完了
2. 📝 実際のユーザーで動作テスト
3. 📊 投稿履歴とフォロワー推移の確認
4. 🔔 エラー通知の設定（Upstash → Slack/Email）

---

**更新日**: 2025年11月24日
