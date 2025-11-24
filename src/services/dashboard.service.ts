/**
 * Dashboard Service
 *
 * このファイルはダッシュボード機能のビジネスロジック層です。
 * リポジトリ層からデータを取得し、DashboardData型に整形します。
 */

import {
  getUserById,
  getTodayPosts,
  getRecentPosts,
  getFollowerStatsHistory,
  getLatestFollowerStats,
} from '@/repositories/dashboard.repository';
import {
  DashboardData,
  TwitterConnectionStatus,
  FollowerStatsData,
  CountdownData,
} from '@/types';

/**
 * ダッシュボードデータを取得
 *
 * @param userId - ユーザーID
 * @returns ダッシュボードデータ
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  // 並列でデータを取得（パフォーマンス最適化）
  const [user, todayPosts, recentPosts, statsHistory, latestStats] = await Promise.all([
    getUserById(userId),
    getTodayPosts(userId),
    getRecentPosts(userId),
    getFollowerStatsHistory(userId),
    getLatestFollowerStats(userId),
  ]);

  // X連携ステータスを判定
  const twitterStatus: TwitterConnectionStatus = user.twitter_user_id
    ? 'connected'
    : 'disconnected';

  // フォロワー統計データを整形
  const followerStatsData = calculateFollowerStats(statsHistory, latestStats);

  // 次回投稿までのカウントダウンデータを計算
  const nextPostCountdown = calculateNextPostCountdown(todayPosts);

  return {
    user,
    twitterStatus,
    followerStats: followerStatsData,
    todayPosts,
    recentPosts,
    nextPostCountdown,
  };
}

/**
 * フォロワー統計データを計算
 *
 * @param history - フォロワー統計履歴
 * @param latestStats - 最新のフォロワー統計
 * @returns フォロワー統計データ
 */
function calculateFollowerStats(
  history: Array<{ follower_count: number; recorded_at: string }>,
  latestStats: { follower_count: number } | null
): FollowerStatsData {
  const currentCount = latestStats?.follower_count ?? 0;
  const previousCount = history.length >= 2 ? history[history.length - 2].follower_count : currentCount;
  const growthCount = currentCount - previousCount;
  const growthRate = previousCount > 0 ? (growthCount / previousCount) * 100 : 0;

  return {
    currentCount,
    previousCount,
    growthCount,
    growthRate: parseFloat(growthRate.toFixed(2)),
    history: history.map((stat) => ({
      id: '', // historyには含まれない
      user_id: '', // historyには含まれない
      follower_count: stat.follower_count,
      recorded_at: stat.recorded_at,
      created_at: stat.recorded_at,
    })),
  };
}

/**
 * 次回投稿までのカウントダウンデータを計算
 *
 * @param todayPosts - 今日の投稿予定
 * @returns カウントダウンデータ
 */
function calculateNextPostCountdown(
  todayPosts: Array<{ scheduled_at: string; status: string }>
): CountdownData {
  // scheduled状態の投稿のみフィルタリング
  const scheduledPosts = todayPosts.filter((post) => post.status === 'scheduled');

  if (scheduledPosts.length === 0) {
    // 次回投稿がない場合はデフォルト値を返す
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      nextPostTime: 'No scheduled posts',
    };
  }

  // 最も近い投稿時刻を取得
  const nextPost = scheduledPosts[0];
  const nextPostTime = new Date(nextPost.scheduled_at);
  const now = new Date();
  const diffMs = nextPostTime.getTime() - now.getTime();

  if (diffMs <= 0) {
    // すでに投稿時刻を過ぎている場合
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      nextPostTime: nextPostTime.toISOString(),
    };
  }

  // ミリ秒を時間・分・秒に変換
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return {
    hours,
    minutes,
    seconds,
    nextPostTime: nextPostTime.toISOString(),
  };
}
