/**
 * 投稿承認・再試行API 統合テスト
 *
 * スライス5-A: 投稿承認・再試行
 * - タスク5A.1: POST /api/posts/:id/approve
 * - タスク5A.2: POST /api/posts/:id/retry
 *
 * テスト方針:
 * - 実データベース（Neon PostgreSQL）を使用
 * - モック一切なし
 * - 各テストケースは独立したユーザーで実行
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '../../../src/db/client';
import { users, posts } from '../../../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// テスト対象のAPIハンドラー
import { POST as approvePost } from '../../../src/app/api/posts/[id]/approve/route';
import { POST as retryPost } from '../../../src/app/api/posts/[id]/retry/route';

// NextAuth.jsのモック
jest.mock('../../../src/lib/session', () => ({
  getCurrentUserId: jest.fn(),
}));

import { getCurrentUserId } from '../../../src/lib/session';

describe('投稿承認・再試行API統合テスト', () => {
  let testUserId: string;
  let testUserEmail: string;
  let unapprovedPostId: string;
  let approvedPostId: string;
  let failedPostId: string;
  let anotherUserId: string;
  let anotherUserEmail: string;

  beforeAll(async () => {
    // テストユーザー1の作成
    const timestamp = Date.now();
    const randomStr1 = Math.random().toString(36).substring(7);
    testUserEmail = `test-approval-${timestamp}-${randomStr1}@test.local`;

    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    const [user] = await db
      .insert(users)
      .values({
        email: testUserEmail,
        password_hash: passwordHash,
        keywords: ['テスト'],
        post_frequency: 4,
        post_times: ['09:00', '12:00', '18:00', '21:00'],
      })
      .returning();

    testUserId = user.id;
    console.log(`✓ テストユーザー1作成: ${testUserEmail} (ID: ${testUserId})`);

    // テストユーザー2の作成（他人の投稿テスト用）
    const randomStr2 = Math.random().toString(36).substring(7);
    anotherUserEmail = `test-another-${timestamp}-${randomStr2}@test.local`;

    const [anotherUser] = await db
      .insert(users)
      .values({
        email: anotherUserEmail,
        password_hash: passwordHash,
        keywords: ['テスト2'],
        post_frequency: 3,
        post_times: ['10:00', '15:00', '20:00'],
      })
      .returning();

    anotherUserId = anotherUser.id;
    console.log(`✓ テストユーザー2作成: ${anotherUserEmail} (ID: ${anotherUserId})`);

    // セッションモックの設定（デフォルトはtestUserId）
    (getCurrentUserId as jest.Mock).mockResolvedValue(testUserId);

    // テスト用の投稿を作成
    const now = new Date();
    const scheduledAt = new Date(now.getTime() + 3600000); // 1時間後

    // 1. 未承認投稿（unapproved）
    const [unapprovedPost] = await db
      .insert(posts)
      .values({
        user_id: testUserId,
        content: 'テスト投稿（未承認）',
        scheduled_at: scheduledAt,
        is_approved: false,
        is_manual: false,
        status: 'unapproved',
      })
      .returning({ id: posts.id });

    unapprovedPostId = unapprovedPost.id;
    console.log(`✓ 未承認投稿作成: ${unapprovedPostId}`);

    // 2. 承認済み投稿（scheduled）
    const [approvedPost] = await db
      .insert(posts)
      .values({
        user_id: testUserId,
        content: 'テスト投稿（承認済み）',
        scheduled_at: scheduledAt,
        is_approved: true,
        is_manual: false,
        status: 'scheduled',
      })
      .returning({ id: posts.id });

    approvedPostId = approvedPost.id;
    console.log(`✓ 承認済み投稿作成: ${approvedPostId}`);

    // 3. 失敗投稿（failed）
    const [failedPost] = await db
      .insert(posts)
      .values({
        user_id: testUserId,
        content: 'テスト投稿（失敗）',
        scheduled_at: scheduledAt,
        is_approved: true,
        is_manual: false,
        status: 'failed',
        error_message: 'Test error message',
      })
      .returning({ id: posts.id });

    failedPostId = failedPost.id;
    console.log(`✓ 失敗投稿作成: ${failedPostId}`);
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
      console.log(`✓ テストユーザー1削除: ${testUserEmail}`);
    }

    if (anotherUserId) {
      await db.delete(users).where(eq(users.id, anotherUserId));
      console.log(`✓ テストユーザー2削除: ${anotherUserEmail}`);
    }
  });

  describe('POST /api/posts/:id/approve - 投稿承認', () => {
    it('正常系: 未承認投稿を承認できる', async () => {
      const request = new Request(`http://localhost:8432/api/posts/${unapprovedPostId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await approvePost(request as any, { params: { id: unapprovedPostId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(unapprovedPostId);
      expect(data.is_approved).toBe(true);
      expect(data.status).toBe('scheduled');
      expect(data.user_id).toBe(testUserId);
      expect(data.updated_at).toBeDefined();

      // データベースの状態を確認
      const result = await db
        .select()
        .from(posts)
        .where(eq(posts.id, unapprovedPostId))
        .limit(1);

      expect(result[0].is_approved).toBe(true);
      expect(result[0].status).toBe('scheduled');
    });

    it('異常系: 存在しない投稿IDでエラーが返る', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const request = new Request(`http://localhost:8432/api/posts/${nonExistentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await approvePost(request as any, { params: { id: nonExistentId } });
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('異常系: 他人の投稿を承認しようとするとエラーが返る', async () => {
      // 別ユーザーの未承認投稿を作成
      const now = new Date();
      const scheduledAt = new Date(now.getTime() + 3600000);

      const [anotherPost] = await db
        .insert(posts)
        .values({
          user_id: anotherUserId,
          content: '別ユーザーの未承認投稿',
          scheduled_at: scheduledAt,
          is_approved: false,
          is_manual: false,
          status: 'unapproved',
        })
        .returning({ id: posts.id });

      // testUserIdで別ユーザーの投稿を承認しようとする
      const request = new Request(`http://localhost:8432/api/posts/${anotherPost.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await approvePost(request as any, { params: { id: anotherPost.id } });
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('AUTHORIZATION_ERROR');

      // クリーンアップ
      await db.delete(posts).where(eq(posts.id, anotherPost.id));
    });

    it('異常系: すでに承認済みの投稿を承認しようとするとエラーが返る', async () => {
      const request = new Request(`http://localhost:8432/api/posts/${approvedPostId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await approvePost(request as any, { params: { id: approvedPostId } });
      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('CONFLICT_ERROR');
    });

    it('異常系: 無効な投稿IDフォーマットでエラーが返る', async () => {
      const invalidId = 'invalid-uuid';

      const request = new Request(`http://localhost:8432/api/posts/${invalidId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await approvePost(request as any, { params: { id: invalidId } });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/posts/:id/retry - 投稿再試行', () => {
    it('正常系: 失敗した投稿を再試行できる', async () => {
      const request = new Request(`http://localhost:8432/api/posts/${failedPostId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await retryPost(request as any, { params: { id: failedPostId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(failedPostId);
      expect(data.status).toBe('scheduled');
      expect(data.error_message).toBeUndefined();
      expect(data.user_id).toBe(testUserId);
      expect(data.updated_at).toBeDefined();

      // データベースの状態を確認
      const result = await db
        .select()
        .from(posts)
        .where(eq(posts.id, failedPostId))
        .limit(1);

      expect(result[0].status).toBe('scheduled');
      expect(result[0].error_message).toBeNull();
    });

    it('異常系: 存在しない投稿IDでエラーが返る', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const request = new Request(`http://localhost:8432/api/posts/${nonExistentId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await retryPost(request as any, { params: { id: nonExistentId } });
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('異常系: 他人の投稿を再試行しようとするとエラーが返る', async () => {
      // 別ユーザーの失敗投稿を作成
      const now = new Date();
      const scheduledAt = new Date(now.getTime() + 3600000);

      const [anotherPost] = await db
        .insert(posts)
        .values({
          user_id: anotherUserId,
          content: '別ユーザーの失敗投稿',
          scheduled_at: scheduledAt,
          is_approved: true,
          is_manual: false,
          status: 'failed',
          error_message: 'Test error',
        })
        .returning({ id: posts.id });

      // testUserIdで別ユーザーの投稿を再試行しようとする
      const request = new Request(`http://localhost:8432/api/posts/${anotherPost.id}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await retryPost(request as any, { params: { id: anotherPost.id } });
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('AUTHORIZATION_ERROR');

      // クリーンアップ
      await db.delete(posts).where(eq(posts.id, anotherPost.id));
    });

    it('異常系: 失敗状態ではない投稿を再試行しようとするとエラーが返る', async () => {
      const request = new Request(`http://localhost:8432/api/posts/${approvedPostId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await retryPost(request as any, { params: { id: approvedPostId } });
      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('CONFLICT_ERROR');
    });

    it('異常系: 無効な投稿IDフォーマットでエラーが返る', async () => {
      const invalidId = 'invalid-uuid';

      const request = new Request(`http://localhost:8432/api/posts/${invalidId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await retryPost(request as any, { params: { id: invalidId } });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
