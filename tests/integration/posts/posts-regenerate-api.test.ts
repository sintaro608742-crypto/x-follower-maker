/**
 * AI投稿再生成API 統合テスト
 *
 * スライス5-B: AI投稿再生成
 * - タスク5B.1: POST /api/posts/:id/regenerate
 *
 * テスト方針:
 * - 実データベース（Neon PostgreSQL）を使用
 * - 実際のGemini APIを使用（モックなし）
 * - 各テストケースは独立したユーザーで実行
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '../../../src/db/client';
import { users, posts } from '../../../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// テスト対象のAPIハンドラー
import { POST as regeneratePost } from '../../../src/app/api/posts/[id]/regenerate/route';

// NextAuth.jsのモック
jest.mock('../../../src/lib/session', () => ({
  getCurrentUserId: jest.fn(),
}));

import { getCurrentUserId } from '../../../src/lib/session';

describe('AI投稿再生成API統合テスト', () => {
  let testUserId: string;
  let testUserEmail: string;
  let testPostId: string;

  beforeAll(async () => {
    // テストユーザーの作成
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    testUserEmail = `test-regenerate-${timestamp}-${randomStr}@test.local`;

    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    const [user] = await db
      .insert(users)
      .values({
        email: testUserEmail,
        password_hash: passwordHash,
        keywords: ['プログラミング', 'AI'],
        post_frequency: 4,
        post_times: ['09:00', '12:00', '18:00', '21:00'],
      })
      .returning({ id: users.id });

    testUserId = user.id;

    // テスト投稿の作成
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 1);

    const [post] = await db
      .insert(posts)
      .values({
        user_id: testUserId,
        content: 'オリジナルの投稿内容',
        scheduled_at: scheduledAt,
        is_approved: true,
        is_manual: false,
        status: 'scheduled',
      })
      .returning({ id: posts.id });

    testPostId = post.id;
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    if (testUserId) {
      await db.delete(posts).where(eq(posts.user_id, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  // ==================== 正常系テスト ====================

  it('[正常系] AI投稿再生成が成功する', async () => {
    // モックの設定
    (getCurrentUserId as jest.Mock).mockResolvedValue(testUserId);

    // リクエストの作成
    const request = new Request('http://localhost:8432/api/posts/123/regenerate', {
      method: 'POST',
    });

    // APIハンドラー呼び出し
    const response = await regeneratePost(request, {
      params: Promise.resolve({ id: testPostId }),
    });

    // デバッグ: エラー時のレスポンスを確認
    if (response.status !== 200) {
      const errorBody = await response.json();
      console.error('Error response:', JSON.stringify(errorBody, null, 2));
    }

    // レスポンス検証
    expect(response.status).toBe(200);

    const responseBody = await response.json() as {
      id: string;
      user_id: string;
      content: string;
      scheduled_at: string;
      is_approved: boolean;
      is_manual: boolean;
      status: string;
      created_at: string;
      updated_at: string;
    };

    // レスポンスボディ検証
    expect(responseBody).toHaveProperty('id', testPostId);
    expect(responseBody).toHaveProperty('user_id', testUserId);
    expect(responseBody).toHaveProperty('content');
    expect(responseBody.content).not.toBe('オリジナルの投稿内容'); // 内容が変わっている
    expect(responseBody.content.length).toBeGreaterThan(0);
    expect(responseBody.content.length).toBeLessThanOrEqual(280);
    expect(responseBody).toHaveProperty('is_approved', false);
    expect(responseBody).toHaveProperty('status', 'unapproved');
    expect(responseBody).toHaveProperty('is_manual', false);

    // データベース確認
    const [updatedPost] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, testPostId))
      .limit(1);

    expect(updatedPost).toBeDefined();
    expect(updatedPost.content).not.toBe('オリジナルの投稿内容');
    expect(updatedPost.is_approved).toBe(false);
    expect(updatedPost.status).toBe('unapproved');
  });

  // ==================== 異常系テスト ====================

  it('[異常系] 存在しない投稿IDでエラー（404）', async () => {
    // モックの設定
    (getCurrentUserId as jest.Mock).mockResolvedValue(testUserId);

    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // リクエストの作成
    const request = new Request('http://localhost:8432/api/posts/123/regenerate', {
      method: 'POST',
    });

    // APIハンドラー呼び出し
    const response = await regeneratePost(request, {
      params: Promise.resolve({ id: nonExistentId }),
    });

    // レスポンス検証
    expect(response.status).toBe(404);

    const responseBody = await response.json() as {
      error: {
        code: string;
        message: string;
      };
    };

    expect(responseBody.error.code).toBe('NOT_FOUND');
    expect(responseBody.error.message).toContain('not found');
  });

  it('[異常系] 他人の投稿を再生成しようとした（403）', async () => {
    // 別のユーザーを作成
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const otherUserEmail = `test-regenerate-other-${timestamp}-${randomStr}@test.local`;

    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    const [otherUser] = await db
      .insert(users)
      .values({
        email: otherUserEmail,
        password_hash: passwordHash,
        keywords: ['テスト'],
        post_frequency: 3,
        post_times: ['10:00', '14:00', '18:00'],
      })
      .returning({ id: users.id });

    const otherUserId = otherUser.id;

    // モックの設定（別ユーザーでログイン）
    (getCurrentUserId as jest.Mock).mockResolvedValue(otherUserId);

    // リクエストの作成
    const request = new Request('http://localhost:8432/api/posts/123/regenerate', {
      method: 'POST',
    });

    // APIハンドラー呼び出し
    const response = await regeneratePost(request, {
      params: Promise.resolve({ id: testPostId }),
    });

    // レスポンス検証
    expect(response.status).toBe(403);

    const responseBody = await response.json() as {
      error: {
        code: string;
        message: string;
      };
    };

    expect(responseBody.error.code).toBe('AUTHORIZATION_ERROR');
    expect(responseBody.error.message).toContain('permission');

    // クリーンアップ
    await db.delete(users).where(eq(users.id, otherUserId));
  });

  it('[異常系] 無効なUUID形式でエラー（400）', async () => {
    // モックの設定
    (getCurrentUserId as jest.Mock).mockResolvedValue(testUserId);

    const invalidId = 'invalid-uuid-format';

    // リクエストの作成
    const request = new Request('http://localhost:8432/api/posts/123/regenerate', {
      method: 'POST',
    });

    // APIハンドラー呼び出し
    const response = await regeneratePost(request, {
      params: Promise.resolve({ id: invalidId }),
    });

    // レスポンス検証
    expect(response.status).toBe(400);

    const responseBody = await response.json() as {
      error: {
        code: string;
        message: string;
      };
    };

    expect(responseBody.error.code).toBe('VALIDATION_ERROR');
  });

  it('[異常系] 未認証ユーザーでエラー（401）', async () => {
    // AuthenticationErrorクラスをインポート
    const { AuthenticationError } = await import('../../../src/lib/errors');

    // モックの設定（未認証）
    (getCurrentUserId as jest.Mock).mockRejectedValue(new AuthenticationError('Authentication required'));

    // リクエストの作成
    const request = new Request('http://localhost:8432/api/posts/123/regenerate', {
      method: 'POST',
    });

    // APIハンドラー呼び出し
    const response = await regeneratePost(request, {
      params: Promise.resolve({ id: testPostId }),
    });

    // レスポンス検証
    expect(response.status).toBe(401);
  });

  it('[異常系] キーワードが設定されていないユーザーでエラー（409）', async () => {
    // キーワードなしのユーザーを作成
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const noKeywordEmail = `test-regenerate-nokeyword-${timestamp}-${randomStr}@test.local`;

    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    const [noKeywordUser] = await db
      .insert(users)
      .values({
        email: noKeywordEmail,
        password_hash: passwordHash,
        keywords: [], // キーワードなし
        post_frequency: 3,
        post_times: ['10:00', '14:00', '18:00'],
      })
      .returning({ id: users.id });

    const noKeywordUserId = noKeywordUser.id;

    // テスト投稿作成
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 1);

    const [noKeywordPost] = await db
      .insert(posts)
      .values({
        user_id: noKeywordUserId,
        content: 'テスト投稿',
        scheduled_at: scheduledAt,
        is_approved: true,
        is_manual: false,
        status: 'scheduled',
      })
      .returning({ id: posts.id });

    const noKeywordPostId = noKeywordPost.id;

    // モックの設定
    (getCurrentUserId as jest.Mock).mockResolvedValue(noKeywordUserId);

    // リクエストの作成
    const request = new Request('http://localhost:8432/api/posts/123/regenerate', {
      method: 'POST',
    });

    // APIハンドラー呼び出し
    const response = await regeneratePost(request, {
      params: Promise.resolve({ id: noKeywordPostId }),
    });

    // レスポンス検証
    expect(response.status).toBe(409);

    const responseBody = await response.json() as {
      error: {
        code: string;
        message: string;
      };
    };

    expect(responseBody.error.code).toBe('CONFLICT_ERROR');
    expect(responseBody.error.message).toContain('keywords');

    // クリーンアップ
    await db.delete(posts).where(eq(posts.user_id, noKeywordUserId));
    await db.delete(users).where(eq(users.id, noKeywordUserId));
  });
});
