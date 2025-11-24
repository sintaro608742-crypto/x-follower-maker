# ダッシュボードAPI仕様書

生成日: 2025年11月21日
収集元: frontend/src/services/mock/DashboardService.ts
@MOCK_TO_APIマーク数: 5

## エンドポイント一覧

### 1. ダッシュボードデータ取得
- **エンドポイント**: `GET /api/dashboard`
- **認証**: 必須
- **Request**: なし
- **Response**: `DashboardData`
```typescript
{
  user: User;
  twitterStatus: 'connected' | 'disconnected' | 'error';
  followerStats: FollowerStatsData;
  todayPosts: Post[];
  recentPosts: Post[];
  nextPostCountdown: CountdownData;
}
```
- **説明**: ダッシュボード画面に必要な全データを一括取得
- **エラー**:
  - 401: 未認証
  - 500: サーバーエラー

---

### 2. キーワード設定更新
- **エンドポイント**: `PUT /api/settings/keywords`
- **認証**: 必須
- **Request**: `KeywordUpdateRequest`
```typescript
{
  keywords: string[]; // 最大3つ、各50文字以内
}
```
- **Response**: `SettingsUpdateResponse`
```typescript
{
  success: boolean;
  message: string;
}
```
- **説明**: ユーザーの興味関心キーワードを更新
- **バリデーション**:
  - keywords: 1-3個、各50文字以内
- **エラー**:
  - 400: バリデーションエラー
  - 401: 未認証
  - 500: サーバーエラー

---

### 3. 投稿スケジュール更新
- **エンドポイント**: `PUT /api/settings/post-schedule`
- **認証**: 必須
- **Request**: `PostScheduleUpdateRequest`
```typescript
{
  post_frequency: number; // 3-5の整数
  post_times: string[];   // 時刻の配列（例: ["09:00", "12:00"]）
}
```
- **Response**: `SettingsUpdateResponse`
```typescript
{
  success: boolean;
  message: string;
}
```
- **説明**: 投稿頻度と時間帯を更新
- **バリデーション**:
  - post_frequency: 3-5の整数
  - post_times: HH:MM形式の文字列配列
- **エラー**:
  - 400: バリデーションエラー
  - 401: 未認証
  - 500: サーバーエラー

---

### 4. X OAuth認証URL取得
- **エンドポイント**: `GET /api/twitter/auth/url`
- **認証**: 必須
- **Request**: なし
- **Response**:
```typescript
{
  authUrl: string; // Twitter OAuth認証URL
}
```
- **説明**: X（Twitter）OAuth 2.0認証URLを生成して返す
- **処理フロー**:
  1. state パラメータ生成（CSRF対策）
  2. code_verifier 生成（PKCE）
  3. OAuth認証URL生成
  4. セッションに state と code_verifier を保存
  5. URLを返却
- **エラー**:
  - 401: 未認証
  - 500: サーバーエラー

---

### 5. X連携解除
- **エンドポイント**: `POST /api/twitter/disconnect`
- **認証**: 必須
- **Request**: `TwitterDisconnectRequest`
```typescript
{
  user_id: string;
}
```
- **Response**: `SettingsUpdateResponse`
```typescript
{
  success: boolean;
  message: string;
}
```
- **説明**: X連携を解除し、保存されているトークンを削除
- **処理フロー**:
  1. ユーザーIDの検証
  2. データベースからトークン削除
  3. 成功メッセージ返却
- **エラー**:
  - 401: 未認証
  - 403: 権限なし（他ユーザーの連携解除）
  - 500: サーバーエラー

---

## データ型定義

### User
```typescript
interface User {
  user_id: string;
  email: string;
  twitter_user_id?: string;
  twitter_username?: string;
  keywords: string[];
  post_frequency: number;
  post_times: string[];
  created_at: Date;
  updated_at: Date;
}
```

### FollowerStatsData
```typescript
interface FollowerStatsData {
  currentCount: number;
  previousCount: number;
  growthCount: number;
  growthRate: number;
  history: FollowerStats[];
}
```

### FollowerStats
```typescript
interface FollowerStats {
  stat_id: string;
  user_id: string;
  follower_count: number;
  following_count?: number;
  recorded_at: Date;
  created_at: Date;
}
```

### Post
```typescript
interface Post {
  post_id: string;
  user_id: string;
  content: string;
  scheduled_at: Date;
  is_approved: boolean;
  is_manual: boolean;
  status: 'scheduled' | 'posted' | 'failed' | 'cancelled';
  posted_at?: Date;
  error_message?: string;
  twitter_tweet_id?: string;
  engagement_stats?: EngagementStats;
  created_at: Date;
  updated_at: Date;
}
```

### CountdownData
```typescript
interface CountdownData {
  hours: number;
  minutes: number;
  seconds: number;
  nextPostTime: string;
}
```

---

## セキュリティ要件

### 認証
- すべてのエンドポイントでNextAuth.jsセッション必須
- セッションなしの場合は401 Unauthorized返却

### 暗号化
- Twitter APIトークンはAES-256-GCMで暗号化保存
- 環境変数ENCRYPTION_KEYを使用

### バリデーション
- すべての入力値をバリデーション
- XSS対策（サニタイゼーション）
- SQL injection対策（ORMのパラメータ化クエリ使用）

---

## モックサービス参照
```typescript
// 実装時はこのモックサービスの挙動を参考にする
frontend/src/services/mock/DashboardService.ts
```

---

## 実装優先順位

1. **High**: GET /api/dashboard（ダッシュボード表示に必須）
2. **High**: PUT /api/settings/keywords（初回設定に必須）
3. **High**: PUT /api/settings/post-schedule（初回設定に必須）
4. **Medium**: GET /api/twitter/auth/url（X連携に必要）
5. **Low**: POST /api/twitter/disconnect（連携解除機能）
