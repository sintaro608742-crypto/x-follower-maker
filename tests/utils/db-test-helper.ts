/**
 * Database Test Helper
 *
 * このファイルはデータベース操作のテストヘルパー関数を提供します。
 */

import { db } from '@/db/client';
import { users, posts, followerStats } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * テストユーザーを作成
 *
 * @param email - メールアドレス
 * @param password - パスワード
 * @returns 作成されたユーザーID
 */
export async function createTestUser(
  email?: string,
  password?: string
): Promise<string> {
  const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(7);
  const testEmail = email || 'test-user-' + uniqueId + '@test.com';
  const testPassword = password || 'Test1234!';

  const passwordHash = await bcrypt.hash(testPassword, 10);

  const [user] = await db
    .insert(users)
    .values({
      email: testEmail,
      password_hash: passwordHash,
      keywords: ['テスト', 'プログラミング'],
      post_frequency: 4,
      post_times: ['09:00', '12:00', '18:00', '21:00'],
    })
    .returning({ id: users.id });

  return user.id;
}

/**
 * テスト投稿を作成
 *
 * @param userId - ユーザーID
 * @param scheduledAt - 投稿予定日時
 * @param status - 投稿ステータス
 * @returns 作成された投稿ID
 */
export async function createTestPost(
  userId: string,
  scheduledAt: Date,
  status: 'scheduled' | 'posted' | 'failed' | 'unapproved' = 'scheduled'
): Promise<string> {
  const [post] = await db
    .insert(posts)
    .values({
      user_id: userId,
      content: 'これはテスト投稿です。',
      scheduled_at: scheduledAt,
      is_approved: true,
      is_manual: false,
      status,
      posted_at: status === 'posted' ? scheduledAt : null,
    })
    .returning({ id: posts.id });

  return post.id;
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
  recordedAt: Date
): Promise<string> {
  const [stat] = await db
    .insert(followerStats)
    .values({
      user_id: userId,
      follower_count: followerCount,
      following_count: 100,
      recorded_at: recordedAt,
    })
    .returning({ id: followerStats.id });

  return stat.id;
}

/**
 * テストユーザーを削除
 *
 * @param userId - ユーザーID
 */
export async function deleteTestUser(userId: string): Promise<void> {
  // カスケード削除により関連データも削除される
  await db.delete(users).where(eq(users.id, userId));
}

/**
 * すべてのテストユーザーを削除
 */
export async function cleanupTestUsers(): Promise<void> {
  // test-user- で始まるメールアドレスのユーザーを削除
  await db.delete(users).where(eq(users.email, 'test@xfollowermaker.local'));
}
