/**
 * 統合テスト用ヘルパーユーティリティ
 *
 * このファイルは統合テストで使用する共通ユーティリティを提供します。
 * - テストユーザー作成/削除
 * - テストデータの準備/クリーンアップ
 * - ユニークIDの生成
 */

import { db } from '../../../src/db/client';
import { users, posts, followerStats } from '../../../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * テストユーザーインターフェース
 */
export interface TestUser {
  id: string;
  email: string;
  password: string;
  passwordHash: string;
}

/**
 * ユニークなテストIDを生成
 *
 * @param prefix - プレフィックス（例: 'test-user'）
 * @returns ユニークID（例: 'test-user-1700000000000-abc123'）
 */
export function generateUniqueId(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  return `${prefix}-${timestamp}-${randomStr}`;
}

/**
 * テストユーザーを作成
 *
 * @param options - オプション
 * @returns 作成されたテストユーザー
 */
export async function createTestUser(options?: {
  email?: string;
  password?: string;
  keywords?: string[];
  post_frequency?: number;
  post_times?: string[];
}): Promise<TestUser> {
  const uniqueId = generateUniqueId('user');
  const email = options?.email || `${uniqueId}@test.local`;
  const password = options?.password || 'TestPassword123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(users)
    .values({
      email,
      password_hash: passwordHash,
      keywords: options?.keywords || ['テスト'],
      post_frequency: options?.post_frequency || 4,
      post_times: options?.post_times || ['09:00', '12:00', '18:00', '21:00'],
    })
    .returning();

  return {
    id: user.id,
    email: user.email,
    password,
    passwordHash,
  };
}

/**
 * テストユーザーを削除
 *
 * @param userId - ユーザーID
 */
export async function cleanupTestUser(userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}

/**
 * テスト投稿を作成
 *
 * @param userId - ユーザーID
 * @param options - オプション
 * @returns 作成された投稿ID
 */
export async function createTestPost(
  userId: string,
  options?: {
    content?: string;
    scheduled_at?: Date;
    is_approved?: boolean;
    is_manual?: boolean;
    status?: 'scheduled' | 'posted' | 'failed' | 'unapproved';
  }
): Promise<string> {
  const [post] = await db
    .insert(posts)
    .values({
      user_id: userId,
      content: options?.content || 'テスト投稿内容',
      scheduled_at: options?.scheduled_at || new Date(Date.now() + 3600000), // 1時間後
      is_approved: options?.is_approved ?? true,
      is_manual: options?.is_manual ?? false,
      status: options?.status || 'scheduled',
    })
    .returning({ id: posts.id });

  return post.id;
}

/**
 * テスト投稿を削除
 *
 * @param postId - 投稿ID
 */
export async function cleanupTestPost(postId: string): Promise<void> {
  await db.delete(posts).where(eq(posts.id, postId));
}

/**
 * テストフォロワー統計を作成
 *
 * @param userId - ユーザーID
 * @param followerCount - フォロワー数
 * @param recordedAt - 記録日時
 * @returns 作成された統計ID
 */
export async function createTestFollowerStats(
  userId: string,
  followerCount: number,
  recordedAt?: Date
): Promise<string> {
  const [stat] = await db
    .insert(followerStats)
    .values({
      user_id: userId,
      follower_count: followerCount,
      recorded_at: recordedAt || new Date(),
    })
    .returning({ id: followerStats.id });

  return stat.id;
}

/**
 * テストフォロワー統計を削除
 *
 * @param statId - 統計ID
 */
export async function cleanupTestFollowerStats(statId: string): Promise<void> {
  await db.delete(followerStats).where(eq(followerStats.id, statId));
}

/**
 * ユーザーのすべてのデータを削除
 *
 * @param userId - ユーザーID
 */
export async function cleanupAllUserData(userId: string): Promise<void> {
  // 外部キー制約により、ユーザーを削除すると関連データも自動削除される
  await db.delete(users).where(eq(users.id, userId));
}

/**
 * スリープ関数
 *
 * @param ms - ミリ秒
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 日付を文字列に変換（ISO8601形式）
 *
 * @param date - Date オブジェクト
 * @returns ISO8601形式の文字列
 */
export function dateToISO(date: Date): string {
  return date.toISOString();
}

/**
 * 文字列を日付に変換
 *
 * @param dateStr - ISO8601形式の文字列
 * @returns Date オブジェクト
 */
export function isoToDate(dateStr: string): Date {
  return new Date(dateStr);
}
