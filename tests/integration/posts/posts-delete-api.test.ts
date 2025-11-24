/**
 * 投稿削除API 統合テスト
 *
 * スライス6: 投稿削除
 * - タスク6.1: DELETE /api/posts/:id
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
import { DELETE as deletePost } from '../../../src/app/api/posts/[id]/route';

// NextAuth.jsのモック
jest.mock('../../../src/lib/session', () => ({
  getCurrentUserId: jest.fn(),
}));

import { getCurrentUserId } from '../../../src/lib/session';

describe('投稿削除API統合テスト', () => {
  let testUserId: string;
  let testUserEmail: string;
  let testPostId1: string;
  let testPostId2: string;
  let anotherUserId: string;
  let anotherUserEmail: string;
  let anotherPostId: string;

  beforeAll(async () => {
    // テストユーザー1の作成
    const timestamp = Date.now();
    const randomStr1 = Math.random().toString(36).substring(7);
    testUserEmail = `test-delete-${timestamp}-${randomStr1}@test.local`;

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

    // テストユーザー2の作成（他人の投稿削除テスト用）
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

    // テスト用の投稿を作成（ユーザー1の投稿）
    const now = new Date();
    const scheduledAt1 = new Date(now.getTime() + 3600000); // 1時間後
    const scheduledAt2 = new Date(now.getTime() + 7200000); // 2時間後

    const [post1] = await db
      .insert(posts)
      .values({
        user_id: testUserId,
        content: 'テスト投稿1（削除対象）',
        scheduled_at: scheduledAt1,
        is_approved: true,
        is_manual: false,
        status: 'scheduled',
      })
      .returning({ id: posts.id });

    testPostId1 = post1.id;
    console.log(`✓ テスト投稿1作成: ${testPostId1}`);

    const [post2] = await db
      .insert(posts)
      .values({
        user_id: testUserId,
        content: 'テスト投稿2（削除対象）',
        scheduled_at: scheduledAt2,
        is_approved: true,
        is_manual: true,
        status: 'scheduled',
      })
      .returning({ id: posts.id });

    testPostId2 = post2.id;
    console.log(`✓ テスト投稿2作成: ${testPostId2}`);

    // テスト用の投稿を作成（ユーザー2の投稿）
    const scheduledAt3 = new Date(now.getTime() + 10800000); // 3時間後

    const [post3] = await db
      .insert(posts)
      .values({
        user_id: anotherUserId,
        content: '他人の投稿（削除できない）',
        scheduled_at: scheduledAt3,
        is_approved: true,
        is_manual: false,
        status: 'scheduled',
      })
      .returning({ id: posts.id });

    anotherPostId = post3.id;
    console.log(`✓ 他人の投稿作成: ${anotherPostId}`);
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    console.log('✓ テストデータクリーンアップ開始');

    // 投稿削除（残っている場合のみ）
    try {
      await db.delete(posts).where(eq(posts.user_id, testUserId));
      await db.delete(posts).where(eq(posts.user_id, anotherUserId));
    } catch (error) {
      console.log('投稿削除エラー（既に削除済みの可能性）:', error);
    }

    // ユーザー削除
    await db.delete(users).where(eq(users.id, testUserId));
    await db.delete(users).where(eq(users.id, anotherUserId));

    console.log('✓ テストデータクリーンアップ完了');
  });

  describe('正常系', () => {
    it('自分の投稿を正常に削除できる', async () => {
      const mockRequest = new Request('http://localhost:8432/api/posts/' + testPostId1, {
        method: 'DELETE',
      });

      const response = await deletePost(mockRequest, {
        params: { id: testPostId1 },
      });

      // ステータスコード検証
      expect(response.status).toBe(204);

      // データベースから削除されたことを確認
      const deletedPost = await db
        .select()
        .from(posts)
        .where(eq(posts.id, testPostId1))
        .limit(1);

      expect(deletedPost.length).toBe(0);

      console.log('✓ 投稿削除成功: 204 No Content');
    });

    it('手動投稿も正常に削除できる', async () => {
      const mockRequest = new Request('http://localhost:8432/api/posts/' + testPostId2, {
        method: 'DELETE',
      });

      const response = await deletePost(mockRequest, {
        params: { id: testPostId2 },
      });

      // ステータスコード検証
      expect(response.status).toBe(204);

      // データベースから削除されたことを確認
      const deletedPost = await db
        .select()
        .from(posts)
        .where(eq(posts.id, testPostId2))
        .limit(1);

      expect(deletedPost.length).toBe(0);

      console.log('✓ 手動投稿削除成功: 204 No Content');
    });
  });

  describe('異常系: 認証エラー', () => {
    it('未認証ユーザーは削除できない（401 Unauthorized）', async () => {
      // AuthenticationErrorをインポート
      const { AuthenticationError } = await import('../../../src/lib/errors');

      // セッションモックを未認証状態に設定
      (getCurrentUserId as jest.Mock).mockRejectedValueOnce(
        new AuthenticationError('Authentication required')
      );

      // テスト用の投稿を作成
      const now = new Date();
      const scheduledAt = new Date(now.getTime() + 3600000);

      const [post] = await db
        .insert(posts)
        .values({
          user_id: testUserId,
          content: '未認証削除テスト用投稿',
          scheduled_at: scheduledAt,
          is_approved: true,
          is_manual: false,
          status: 'scheduled',
        })
        .returning({ id: posts.id });

      const mockRequest = new Request('http://localhost:8432/api/posts/' + post.id, {
        method: 'DELETE',
      });

      const response = await deletePost(mockRequest, {
        params: { id: post.id },
      });

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toBeDefined();

      // 投稿が削除されていないことを確認
      const stillExists = await db.select().from(posts).where(eq(posts.id, post.id)).limit(1);

      expect(stillExists.length).toBe(1);

      // クリーンアップ
      await db.delete(posts).where(eq(posts.id, post.id));

      // セッションモックを元に戻す
      (getCurrentUserId as jest.Mock).mockResolvedValue(testUserId);

      console.log('✓ 未認証削除エラー: 401 Unauthorized');
    });
  });

  describe('異常系: 権限エラー', () => {
    it('他人の投稿は削除できない（403 Forbidden）', async () => {
      const mockRequest = new Request('http://localhost:8432/api/posts/' + anotherPostId, {
        method: 'DELETE',
      });

      const response = await deletePost(mockRequest, {
        params: { id: anotherPostId },
      });

      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error).toBeDefined();
      expect(body.error.message).toContain('permission');

      // 投稿が削除されていないことを確認
      const stillExists = await db
        .select()
        .from(posts)
        .where(eq(posts.id, anotherPostId))
        .limit(1);

      expect(stillExists.length).toBe(1);

      console.log('✓ 他人の投稿削除エラー: 403 Forbidden');
    });
  });

  describe('異常系: 投稿不存在', () => {
    it('存在しない投稿IDは削除できない（404 Not Found）', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const mockRequest = new Request('http://localhost:8432/api/posts/' + nonExistentId, {
        method: 'DELETE',
      });

      const response = await deletePost(mockRequest, {
        params: { id: nonExistentId },
      });

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.error).toBeDefined();
      expect(body.error.message).toContain('not found');

      console.log('✓ 存在しない投稿削除エラー: 404 Not Found');
    });
  });

  describe('異常系: バリデーションエラー', () => {
    it('無効なUUID形式は拒否される（400 Bad Request）', async () => {
      const invalidId = 'invalid-uuid-format';

      const mockRequest = new Request('http://localhost:8432/api/posts/' + invalidId, {
        method: 'DELETE',
      });

      const response = await deletePost(mockRequest, {
        params: { id: invalidId },
      });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBeDefined();
      expect(body.error.message).toContain('Invalid');

      console.log('✓ 無効UUID削除エラー: 400 Bad Request');
    });
  });
});
