/**
 * Dashboard Repository
 *
 * このファイルはダッシュボードデータのデータアクセスレイヤーです。
 * データベースからダッシュボード表示に必要なデータを取得します。
 */

import { db } from '@/db/client';
import { users, posts, followerStats } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { User, Post, FollowerStats } from '@/types';
import { DatabaseError, NotFoundError } from '@/lib/errors';

/**
 * ユーザー情報を取得
 *
 * @param userId - ユーザーID
 * @returns ユーザー情報
 * @throws {NotFoundError} ユーザーが見つからない場合
 * @throws {DatabaseError} データベースエラー
 */
export async function getUserById(userId: string): Promise<User> {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        twitter_user_id: users.twitter_user_id,
        twitter_username: users.twitter_username,
        keywords: users.keywords,
        post_frequency: users.post_frequency,
        post_times: users.post_times,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundError('User');
    }

    return {
      id: user.id,
      email: user.email,
      twitter_user_id: user.twitter_user_id ?? undefined,
      twitter_username: user.twitter_username ?? undefined,
      keywords: user.keywords ?? [],
      post_frequency: user.post_frequency,
      post_times: user.post_times ?? [],
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to fetch user', error as Error);
  }
}

/**
 * 今日の投稿予定を取得
 *
 * @param userId - ユーザーID
 * @returns 今日の投稿予定配列
 * @throws {DatabaseError} データベースエラー
 */
export async function getTodayPosts(userId: string): Promise<Post[]> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayPosts = await db
      .select({
        id: posts.id,
        user_id: posts.user_id,
        content: posts.content,
        scheduled_at: posts.scheduled_at,
        is_approved: posts.is_approved,
        is_manual: posts.is_manual,
        status: posts.status,
        posted_at: posts.posted_at,
        error_message: posts.error_message,
        twitter_tweet_id: posts.twitter_tweet_id,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
      })
      .from(posts)
      .where(
        and(
          eq(posts.user_id, userId),
          gte(posts.scheduled_at, today),
          lte(posts.scheduled_at, tomorrow)
        )
      )
      .orderBy(posts.scheduled_at);

    return todayPosts.map((post) => ({
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      scheduled_at: post.scheduled_at.toISOString(),
      is_approved: post.is_approved,
      is_manual: post.is_manual,
      status: post.status as 'scheduled' | 'posted' | 'failed' | 'unapproved',
      posted_at: post.posted_at?.toISOString(),
      error_message: post.error_message ?? undefined,
      twitter_tweet_id: post.twitter_tweet_id ?? undefined,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
    }));
  } catch (error) {
    throw new DatabaseError('Failed to fetch today posts', error as Error);
  }
}

/**
 * 最近の投稿履歴を取得（最新10件）
 *
 * @param userId - ユーザーID
 * @returns 最近の投稿履歴配列
 * @throws {DatabaseError} データベースエラー
 */
export async function getRecentPosts(userId: string): Promise<Post[]> {
  try {
    const recentPosts = await db
      .select({
        id: posts.id,
        user_id: posts.user_id,
        content: posts.content,
        scheduled_at: posts.scheduled_at,
        is_approved: posts.is_approved,
        is_manual: posts.is_manual,
        status: posts.status,
        posted_at: posts.posted_at,
        error_message: posts.error_message,
        twitter_tweet_id: posts.twitter_tweet_id,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
      })
      .from(posts)
      .where(
        and(
          eq(posts.user_id, userId),
          eq(posts.status, 'posted')
        )
      )
      .orderBy(desc(posts.posted_at))
      .limit(10);

    return recentPosts.map((post) => ({
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      scheduled_at: post.scheduled_at.toISOString(),
      is_approved: post.is_approved,
      is_manual: post.is_manual,
      status: post.status as 'scheduled' | 'posted' | 'failed' | 'unapproved',
      posted_at: post.posted_at?.toISOString(),
      error_message: post.error_message ?? undefined,
      twitter_tweet_id: post.twitter_tweet_id ?? undefined,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
    }));
  } catch (error) {
    throw new DatabaseError('Failed to fetch recent posts', error as Error);
  }
}

/**
 * フォロワー統計を取得（過去7日間）
 *
 * @param userId - ユーザーID
 * @returns フォロワー統計配列
 * @throws {DatabaseError} データベースエラー
 */
export async function getFollowerStatsHistory(userId: string): Promise<FollowerStats[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const statsHistory = await db
      .select({
        id: followerStats.id,
        user_id: followerStats.user_id,
        follower_count: followerStats.follower_count,
        following_count: followerStats.following_count,
        recorded_at: followerStats.recorded_at,
        created_at: followerStats.created_at,
      })
      .from(followerStats)
      .where(
        and(
          eq(followerStats.user_id, userId),
          gte(followerStats.recorded_at, sevenDaysAgo)
        )
      )
      .orderBy(followerStats.recorded_at);

    return statsHistory.map((stat) => ({
      id: stat.id,
      user_id: stat.user_id,
      follower_count: stat.follower_count,
      following_count: stat.following_count ?? undefined,
      recorded_at: stat.recorded_at.toISOString(),
      created_at: stat.created_at.toISOString(),
    }));
  } catch (error) {
    throw new DatabaseError('Failed to fetch follower stats', error as Error);
  }
}

/**
 * 最新のフォロワー統計を取得
 *
 * @param userId - ユーザーID
 * @returns 最新のフォロワー統計 (存在しない場合はnull)
 * @throws {DatabaseError} データベースエラー
 */
export async function getLatestFollowerStats(userId: string): Promise<FollowerStats | null> {
  try {
    const [latestStat] = await db
      .select({
        id: followerStats.id,
        user_id: followerStats.user_id,
        follower_count: followerStats.follower_count,
        following_count: followerStats.following_count,
        recorded_at: followerStats.recorded_at,
        created_at: followerStats.created_at,
      })
      .from(followerStats)
      .where(eq(followerStats.user_id, userId))
      .orderBy(desc(followerStats.recorded_at))
      .limit(1);

    if (!latestStat) {
      return null;
    }

    return {
      id: latestStat.id,
      user_id: latestStat.user_id,
      follower_count: latestStat.follower_count,
      following_count: latestStat.following_count ?? undefined,
      recorded_at: latestStat.recorded_at.toISOString(),
      created_at: latestStat.created_at.toISOString(),
    };
  } catch (error) {
    throw new DatabaseError('Failed to fetch latest follower stats', error as Error);
  }
}
