// ユーザー型
export interface User {
  id: string;
  email: string;
  twitter_user_id?: string;
  twitter_username?: string;
  keywords: string[];
  post_frequency: number;
  post_times: string[];
  created_at: string;
  updated_at: string;
}

// 投稿ステータス型
export type PostStatus = 'scheduled' | 'posted' | 'failed' | 'unapproved';

// 投稿フィルター型
export type PostFilter = 'today' | 'tomorrow' | 'week' | 'all';

// エンゲージメント統計型
export interface EngagementStats {
  likes: number;
  retweets: number;
  replies: number;
}

// 投稿エラー型
export interface PostError {
  title: string;
  message: string;
}

// 投稿型
export interface Post {
  id: string;
  user_id: string;
  content: string;
  scheduled_at: string;
  is_approved: boolean;
  is_manual: boolean;
  status: PostStatus;
  posted_at?: string;
  error_message?: string;
  twitter_tweet_id?: string;
  engagement?: EngagementStats;
  created_at: string;
  updated_at: string;
}

// フォロワー統計型
export interface FollowerStats {
  id: string;
  user_id: string;
  follower_count: number;
  following_count?: number;
  recorded_at: string;
  created_at: string;
}

// 認証レスポンス型
export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
}

// ログインリクエスト型
export interface LoginRequest {
  email: string;
  password: string;
}

// サインアップリクエスト型
export interface SignupRequest {
  email: string;
  password: string;
}

// 投稿生成リクエスト型
export interface PostGenerationRequest {
  keywords: string[];
  count: number;
}

// 投稿生成レスポンス型
export interface PostGenerationResponse {
  posts: Post[];
  message: string;
}

// 日付グループ型（投稿一覧の日付グループ化用）
export interface PostDateGroup {
  date: string;
  displayLabel: string;
  posts: Post[];
  count: number;
}

// 投稿更新リクエスト型
export interface PostUpdateRequest {
  post_id: string;
  content?: string;
  scheduled_at?: string;
  is_approved?: boolean;
}

// ツイートプレビュー型（UI用）
export interface TweetPreview {
  username: string;
  handle: string;
  avatar: string;
  content: string;
  timestamp: string;
}

// エラーレスポンス型
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

// 認証コンテキスト型
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
}

// X連携ステータス型
export type TwitterConnectionStatus = 'connected' | 'disconnected' | 'error';

// プリセットキーワード型
export interface PresetKeyword {
  id: string;
  label: string;
  icon: string;
}

// 投稿時間帯型
export type PostTime = string; // "09:00", "12:00", "18:00", "21:00" 形式

// ダッシュボードデータ型
export interface DashboardData {
  user: User;
  twitterStatus: TwitterConnectionStatus;
  followerStats: FollowerStatsData;
  todayPosts: Post[];
  recentPosts: Post[];
  nextPostCountdown: CountdownData;
}

// フォロワー統計データ型（グラフ表示用）
export interface FollowerStatsData {
  currentCount: number;
  previousCount: number;
  growthCount: number;
  growthRate: number;
  history: FollowerStats[];
}

// カウントダウンデータ型
export interface CountdownData {
  hours: number;
  minutes: number;
  seconds: number;
  nextPostTime: string;
}

// キーワード設定更新リクエスト型
export interface KeywordUpdateRequest {
  keywords: string[];
}

// 投稿スケジュール更新リクエスト型
export interface PostScheduleUpdateRequest {
  post_frequency: number;
  post_times: string[];
}

// X連携解除リクエスト型
export interface TwitterDisconnectRequest {
  user_id: string;
}

// 設定更新レスポンス型
export interface SettingsUpdateResponse {
  success: boolean;
  message: string;
}
