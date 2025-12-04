// ユーザー型
export interface User {
  id: string;
  email: string;
  twitter_user_id?: string;
  twitter_username?: string;
  keywords: string[];
  post_frequency: number;
  post_times: string[];
  auto_post_source_ids: string[];
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
  auto_post_source_ids?: string[]; // 自動投稿に使用するソースのID配列（オプション）
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

// =====================================
// ソースライブラリ関連の型
// =====================================

// ソースタイプ型
export type SourceType = 'url' | 'pdf' | 'docx' | 'txt' | 'md';

// 生成スタイル型
export type GenerationStyle = 'summary' | 'opinion' | 'quote';

// ソースメタデータ型
export interface SourceMetadata {
  domain?: string;
  author?: string;
  published_date?: string;
  file_name?: string;
  file_type?: string;
  description?: string;
}

// ソース型
export interface Source {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  source_type: SourceType;
  source_url?: string;
  file_path?: string;
  file_size?: number;
  extracted_text: string;
  word_count: number;
  metadata?: SourceMetadata;
  created_at: string;
  updated_at: string;
}

// 生成済み投稿型
export interface GeneratedPost {
  id: string;
  source_id: string;
  style: GenerationStyle;
  content: string;
  char_count: number;
  scheduled_post_id?: string;
  created_at: string;
}

// ソース一覧レスポンス型
export interface SourceListResponse {
  sources: Source[];
  total: number;
}

// ソース作成（URL）リクエスト型
export interface SourceCreateFromUrlRequest {
  url: string;
  title?: string;
}

// ソース作成レスポンス型
export interface SourceCreateResponse {
  source: Source;
  message: string;
}

// ソース詳細レスポンス型
export interface SourceDetailResponse {
  source: Source;
  generated_posts: GeneratedPost[];
}

// ソース投稿生成リクエスト型
export interface SourceGeneratePostsRequest {
  style: GenerationStyle;
  count: number;
  custom_prompt?: string;
}

// ソース投稿生成レスポンス型
export interface SourceGeneratePostsResponse {
  posts: GeneratedPost[];
  source_title: string;
  style: GenerationStyle;
  message: string;
}

// 生成スタイル情報型
export interface GenerationStyleInfo {
  id: GenerationStyle;
  title: string;
  description: string;
  icon: string;
}
