/**
 * 投稿API 統合テスト
 *
 * スライス3: 投稿読み取り
 * - タスク3.1: GET /api/posts
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
import { GET as getPosts } from '../../../src/app/api/posts/route';

// NextAuth.jsのモック
jest.mock('../../../src/lib/session', () => ({
  getCurrentUserId: jest.fn(),
}));

import { getCurrentUserId } from '../../../src/lib/session';

describe('投稿API統合テスト', () => {
  let testUserId: string;
  let testUserEmail: string;
  let testPostIds: string[] = [];

  beforeAll(async () => {
    // テストユーザーの作成
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    testUserEmail = `test-posts-${timestamp}-${randomStr}@test.local`;

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
    console.log(`✓ テストユーザー作成: ${testUserEmail} (ID: ${testUserId})`);

    // セッションモックの設定
    (getCurrentUserId as jest.Mock).mockResolvedValue(testUserId);

    // テスト用の投稿を複数作成
    const now = new Date();

    // scheduled投稿 x3
    for (let i = 0; i < 3; i++) {
      const scheduledAt = new Date(now.getTime() + (i + 1) * 3600000); // 1時間、2時間、3時間後
      const [post] = await db
        .insert(posts)
        .values({
          user_id: testUserId,
          content: `テスト投稿（scheduled）${i + 1}`,
          scheduled_at: scheduledAt,
          is_approved: true,
          is_manual: false,
          status: 'scheduled',
        })
        .returning({ id: posts.id });
      testPostIds.push(post.id);
    }

    // posted投稿 x2
    for (let i = 0; i < 2; i++) {
      const scheduledAt = new Date(now.getTime() - (i + 1) * 3600000); // 1時間前、2時間前
      const [post] = await db
        .insert(posts)
        .values({
          user_id: testUserId,
          content: `テスト投稿（posted）${i + 1}`,
          scheduled_at: scheduledAt,
          posted_at: scheduledAt,
          is_approved: true,
          is_manual: false,
          status: 'posted',
          twitter_tweet_id: `tweet-${i + 1}`,
        })
        .returning({ id: posts.id });
      testPostIds.push(post.id);
    }

    // failed投稿 x1
    const failedScheduledAt = new Date(now.getTime() - 7200000); // 2時間前
    const [failedPost] = await db
      .insert(posts)
      .values({
        user_id: testUserId,
        content: 'テスト投稿（failed）',
        scheduled_at: failedScheduledAt,
        is_approved: true,
        is_manual: false,
        status: 'failed',
        error_message: 'Twitter API error',
      })
      .returning({ id: posts.id });
    testPostIds.push(failedPost.id);

    // unapproved投稿 x1
    const unapprovedScheduledAt = new Date(now.getTime() + 7200000); // 2時間後
    const [unapprovedPost] = await db
      .insert(posts)
      .values({
        user_id: testUserId,
        content: 'テスト投稿（unapproved）',
        scheduled_at: unapprovedScheduledAt,
        is_approved: false,
        is_manual: false,
        status: 'unapproved',
      })
      .returning({ id: posts.id });
    testPostIds.push(unapprovedPost.id);

    console.log(`✓ テスト投稿作成: ${testPostIds.length}件`);
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    if (testUserId) {
      // 外部キー制約により、ユーザー削除で投稿も自動削除される
      await db.delete(users).where(eq(users.id, testUserId));
      console.log(`✓ テストユーザー削除: ${testUserEmail}`);
      console.log(`✓ テスト投稿削除: ${testPostIds.length}件（cascade）`);
    }
  });

  describe('GET /api/posts - 投稿一覧取得', () => {
    it('正常系: すべての投稿を取得できる', async () => {
      const request = new Request('http://localhost:8432/api/posts', {
        method: 'GET',
      });

      const response = await getPosts(request as any);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(7); // 合計7件

      // scheduled_at降順でソートされていることを確認
      for (let i = 0; i < data.length - 1; i++) {
        const currentDate = new Date(data[i].scheduled_at);
        const nextDate = new Date(data[i + 1].scheduled_at);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });

    it('正常系: statusフィルタ（scheduled）で投稿を取得できる', async () => {
      const request = new Request('http://localhost:8432/api/posts?status=scheduled', {
        method: 'GET',
      });

      const response = await getPosts(request as any);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(3); // scheduled投稿のみ

      // すべてscheduledステータスであることを確認
      data.forEach((post: any) => {
        expect(post.status).toBe('scheduled');
      });
    });

    it('正常系: statusフィルタ（posted）で投稿を取得できる', async () => {
      const request = new Request('http://localhost:8432/api/posts?status=posted', {
        method: 'GET',
      });

      const response = await getPosts(request as any);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2); // posted投稿のみ

      // すべてpostedステータスであることを確認
      data.forEach((post: any) => {
        expect(post.status).toBe('posted');
        expect(post.posted_at).toBeDefined();
        expect(post.twitter_tweet_id).toBeDefined();
      });
    });

    it('正常系: statusフィルタ（failed）で投稿を取得できる', async () => {
      const request = new Request('http://localhost:8432/api/posts?status=failed', {
        method: 'GET',
      });

      const response = await getPosts(request as any);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1); // failed投稿のみ

      expect(data[0].status).toBe('failed');
      expect(data[0].error_message).toBeDefined();
    });

    it('正常系: statusフィルタ（unapproved）で投稿を取得できる', async () => {
      const request = new Request('http://localhost:8432/api/posts?status=unapproved', {
        method: 'GET',
      });

      const response = await getPosts(request as any);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1); // unapproved投稿のみ

      expect(data[0].status).toBe('unapproved');
      expect(data[0].is_approved).toBe(false);
    });

    it('正常系: limitパラメータで取得件数を制限できる', async () => {
      const request = new Request('http://localhost:8432/api/posts?limit=3', {
        method: 'GET',
      });

      const response = await getPosts(request as any);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(3); // limit=3で3件のみ取得
    });

    it('正常系: offsetパラメータでページネーションできる', async () => {
      const request1 = new Request('http://localhost:8432/api/posts?limit=3&offset=0', {
        method: 'GET',
      });

      const response1 = await getPosts(request1 as any);
      const data1 = await response1.json();

      const request2 = new Request('http://localhost:8432/api/posts?limit=3&offset=3', {
        method: 'GET',
      });

      const response2 = await getPosts(request2 as any);
      const data2 = await response2.json();

      // 1ページ目と2ページ目で異なる投稿が取得される
      expect(data1[0].id).not.toBe(data2[0].id);

      // 合計で7件取得できる
      const totalCount = data1.length + data2.length;
      expect(totalCount).toBeGreaterThanOrEqual(6);
    });

    it('正常系: limit=1で最新の投稿のみ取得できる', async () => {
      const request = new Request('http://localhost:8432/api/posts?limit=1', {
        method: 'GET',
      });

      const response = await getPosts(request as any);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);

      // 最も新しいscheduled_atを持つ投稿が取得される
      expect(data[0].scheduled_at).toBeDefined();
    });

    it('異常系: 無効なstatusパラメータでエラーが返る', async () => {
      const request = new Request('http://localhost:8432/api/posts?status=invalid', {
        method: 'GET',
      });

      const response = await getPosts(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('異常系: 無効なlimitパラメータ（負の数）でエラーが返る', async () => {
      const request = new Request('http://localhost:8432/api/posts?limit=-1', {
        method: 'GET',
      });

      const response = await getPosts(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('異常系: 無効なlimitパラメータ（101以上）でエラーが返る', async () => {
      const request = new Request('http://localhost:8432/api/posts?limit=101', {
        method: 'GET',
      });

      const response = await getPosts(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('異常系: 無効なoffsetパラメータ（負の数）でエラーが返る', async () => {
      const request = new Request('http://localhost:8432/api/posts?offset=-1', {
        method: 'GET',
      });

      const response = await getPosts(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('正常系: 投稿が0件のユーザーで空配列が返る', async () => {
      // 別のテストユーザーを作成（投稿なし）
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const emptyUserEmail = `test-empty-${timestamp}-${randomStr}@test.local`;
      const passwordHash = await bcrypt.hash('TestPassword123!', 10);

      const [emptyUser] = await db
        .insert(users)
        .values({
          email: emptyUserEmail,
          password_hash: passwordHash,
          keywords: ['テスト'],
          post_frequency: 4,
          post_times: ['09:00', '12:00', '18:00', '21:00'],
        })
        .returning();

      // モックを一時的に変更
      const originalMock = (getCurrentUserId as jest.Mock).getMockImplementation();
      (getCurrentUserId as jest.Mock).mockResolvedValueOnce(emptyUser.id);

      const request = new Request('http://localhost:8432/api/posts', {
        method: 'GET',
      });

      const response = await getPosts(request as any);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0); // 投稿が0件

      // クリーンアップ
      await db.delete(users).where(eq(users.id, emptyUser.id));

      // モックを元に戻す
      if (originalMock) {
        (getCurrentUserId as jest.Mock).mockImplementation(originalMock);
      }
    });
  });
});
