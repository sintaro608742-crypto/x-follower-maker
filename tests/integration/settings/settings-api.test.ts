/**
 * 設定管理API 統合テスト
 *
 * スライス2-A: 設定管理
 * - タスク2A.1: PUT /api/settings/keywords
 * - タスク2A.2: PUT /api/settings/post-schedule
 *
 * テスト方針:
 * - 実データベース（Neon PostgreSQL）を使用
 * - モック一切なし
 * - 各テストケースは独立したユーザーで実行
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '../../../src/db/client';
import { users } from '../../../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// テスト対象のAPIハンドラー
import { PUT as putKeywords } from '../../../src/app/api/settings/keywords/route';
import { PUT as putPostSchedule } from '../../../src/app/api/settings/post-schedule/route';

// NextAuth.jsのモック
jest.mock('../../../src/lib/session', () => ({
  getCurrentUserId: jest.fn(),
}));

import { getCurrentUserId } from '../../../src/lib/session';

describe('設定管理API統合テスト', () => {
  let testUserId: string;
  let testUserEmail: string;

  beforeAll(async () => {
    // テストユーザーの作成
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    testUserEmail = `test-settings-${timestamp}-${randomStr}@test.local`;

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
  });

  afterAll(async () => {
    // テストユーザーのクリーンアップ
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
      console.log(`✓ テストユーザー削除: ${testUserEmail}`);
    }
  });

  describe('PUT /api/settings/keywords - キーワード設定更新', () => {
    it('正常系: キーワードを1個更新できる', async () => {
      const request = new Request('http://localhost:8432/api/settings/keywords', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: ['プログラミング'],
        }),
      });

      const response = await putKeywords(request as any);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Keywords updated successfully');

      // データベース確認
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId));

      expect(updatedUser.keywords).toEqual(['プログラミング']);
    });

    it('正常系: キーワードを3個更新できる', async () => {
      const request = new Request('http://localhost:8432/api/settings/keywords', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: ['プログラミング', 'AI', 'Web開発'],
        }),
      });

      const response = await putKeywords(request as any);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // データベース確認
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId));

      expect(updatedUser.keywords).toEqual(['プログラミング', 'AI', 'Web開発']);
    });

    it('異常系: キーワードが0個の場合はエラー', async () => {
      const request = new Request('http://localhost:8432/api/settings/keywords', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: [],
        }),
      });

      const response = await putKeywords(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('異常系: キーワードが4個以上の場合はエラー', async () => {
      const request = new Request('http://localhost:8432/api/settings/keywords', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: ['プログラミング', 'AI', 'Web開発', 'データサイエンス'],
        }),
      });

      const response = await putKeywords(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('異常系: キーワードが51文字以上の場合はエラー', async () => {
      const longKeyword = 'あ'.repeat(51);
      const request = new Request('http://localhost:8432/api/settings/keywords', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: [longKeyword],
        }),
      });

      const response = await putKeywords(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/settings/post-schedule - 投稿スケジュール設定更新', () => {
    it('正常系: 投稿頻度と時間帯を更新できる', async () => {
      const request = new Request('http://localhost:8432/api/settings/post-schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_frequency: 3,
          post_times: ['09:00', '15:00', '21:00'],
        }),
      });

      const response = await putPostSchedule(request as any);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Post schedule updated successfully');

      // データベース確認
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId));

      expect(updatedUser.post_frequency).toBe(3);
      expect(updatedUser.post_times).toEqual(['09:00', '15:00', '21:00']);
    });

    it('正常系: 最大投稿頻度（5回）に設定できる', async () => {
      const request = new Request('http://localhost:8432/api/settings/post-schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_frequency: 5,
          post_times: ['06:00', '10:00', '14:00', '18:00', '22:00'],
        }),
      });

      const response = await putPostSchedule(request as any);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // データベース確認
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId));

      expect(updatedUser.post_frequency).toBe(5);
      expect(updatedUser.post_times).toEqual(['06:00', '10:00', '14:00', '18:00', '22:00']);
    });

    it('異常系: 投稿頻度が2以下の場合はエラー', async () => {
      const request = new Request('http://localhost:8432/api/settings/post-schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_frequency: 2,
          post_times: ['09:00', '18:00'],
        }),
      });

      const response = await putPostSchedule(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('異常系: 投稿頻度が6以上の場合はエラー', async () => {
      const request = new Request('http://localhost:8432/api/settings/post-schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_frequency: 6,
          post_times: ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
        }),
      });

      const response = await putPostSchedule(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('異常系: 投稿時間が0個の場合はエラー', async () => {
      const request = new Request('http://localhost:8432/api/settings/post-schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_frequency: 3,
          post_times: [],
        }),
      });

      const response = await putPostSchedule(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('異常系: 投稿時間フォーマットが不正な場合はエラー', async () => {
      const request = new Request('http://localhost:8432/api/settings/post-schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_frequency: 3,
          post_times: ['9:00', '12:00', '18:00'], // 不正フォーマット（0埋めなし）
        }),
      });

      const response = await putPostSchedule(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
