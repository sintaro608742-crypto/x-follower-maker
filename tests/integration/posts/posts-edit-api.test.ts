/**
 * 投稿編集API 統合テスト
 *
 * スライス4: 投稿編集
 * - タスク4.1: PATCH /api/posts/:id
 * - タスク4.2: POST /api/posts
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
import { PATCH as patchPost } from '../../../src/app/api/posts/[id]/route';
import { POST as createPost } from '../../../src/app/api/posts/route';

// NextAuth.jsのモック
jest.mock('../../../src/lib/session', () => ({
  getCurrentUserId: jest.fn(),
}));

import { getCurrentUserId } from '../../../src/lib/session';

describe('投稿編集API統合テスト', () => {
  let testUserId: string;
  let testUserEmail: string;
  let testPostId: string;
  let anotherUserId: string;
  let anotherUserEmail: string;

  beforeAll(async () => {
    // テストユーザー1の作成
    const timestamp = Date.now();
    const randomStr1 = Math.random().toString(36).substring(7);
    testUserEmail = `test-edit-${timestamp}-${randomStr1}@test.local`;

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

    // テストユーザー2の作成（他人の投稿更新テスト用）
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

    const [post] = await db
      .insert(posts)
      .values({
        user_id: testUserId,
        content: 'テスト投稿（編集前）',
        scheduled_at: scheduledAt,
        is_approved: true,
        is_manual: false,
        status: 'scheduled',
      })
      .returning({ id: posts.id });

    testPostId = post.id;
    console.log(`✓ テスト投稿作成: ${testPostId}`);
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

  describe('PATCH /api/posts/:id - 投稿更新', () => {
    it('正常系: 投稿内容を更新できる', async () => {
      const updatedContent = '更新後の投稿内容';

      const request = new Request(`http://localhost:8432/api/posts/${testPostId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: updatedContent,
        }),
      });

      const response = await patchPost(request as any, { params: { id: testPostId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(testPostId);
      expect(data.content).toBe(updatedContent);
      expect(data.user_id).toBe(testUserId);
      expect(data.updated_at).toBeDefined();
    });

    it('正常系: 投稿日時を更新できる', async () => {
      const now = new Date();
      const newScheduledAt = new Date(now.getTime() + 7200000); // 2時間後

      const request = new Request(`http://localhost:8432/api/posts/${testPostId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduled_at: newScheduledAt.toISOString(),
        }),
      });

      const response = await patchPost(request as any, { params: { id: testPostId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(testPostId);
      expect(new Date(data.scheduled_at).getTime()).toBe(newScheduledAt.getTime());
    });

    it('正常系: 承認状態を更新できる', async () => {
      const request = new Request(`http://localhost:8432/api/posts/${testPostId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_approved: false,
        }),
      });

      const response = await patchPost(request as any, { params: { id: testPostId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(testPostId);
      expect(data.is_approved).toBe(false);

      // 元に戻す
      const resetRequest = new Request(`http://localhost:8432/api/posts/${testPostId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_approved: true,
        }),
      });
      await patchPost(resetRequest as any, { params: { id: testPostId } });
    });

    it('正常系: 複数フィールドを同時に更新できる', async () => {
      const now = new Date();
      const newScheduledAt = new Date(now.getTime() + 10800000); // 3時間後
      const updatedContent = '複数フィールド更新テスト';

      const request = new Request(`http://localhost:8432/api/posts/${testPostId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: updatedContent,
          scheduled_at: newScheduledAt.toISOString(),
          is_approved: true,
        }),
      });

      const response = await patchPost(request as any, { params: { id: testPostId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.content).toBe(updatedContent);
      expect(new Date(data.scheduled_at).getTime()).toBe(newScheduledAt.getTime());
      expect(data.is_approved).toBe(true);
    });

    it('異常系: 存在しない投稿IDでエラーが返る', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const request = new Request(`http://localhost:8432/api/posts/${nonExistentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: '更新テスト',
        }),
      });

      const response = await patchPost(request as any, { params: { id: nonExistentId } });
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('異常系: 他人の投稿を更新しようとするとエラーが返る', async () => {
      // 別ユーザーの投稿を作成
      const now = new Date();
      const scheduledAt = new Date(now.getTime() + 3600000);

      const [anotherPost] = await db
        .insert(posts)
        .values({
          user_id: anotherUserId,
          content: '別ユーザーの投稿',
          scheduled_at: scheduledAt,
          is_approved: true,
          is_manual: false,
          status: 'scheduled',
        })
        .returning({ id: posts.id });

      // testUserIdで別ユーザーの投稿を更新しようとする
      const request = new Request(`http://localhost:8432/api/posts/${anotherPost.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: '不正な更新',
        }),
      });

      const response = await patchPost(request as any, { params: { id: anotherPost.id } });
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('AUTHORIZATION_ERROR');

      // クリーンアップ
      await db.delete(posts).where(eq(posts.id, anotherPost.id));
    });

    it('異常系: 無効な投稿IDフォーマットでエラーが返る', async () => {
      const invalidId = 'invalid-uuid';

      const request = new Request(`http://localhost:8432/api/posts/${invalidId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: '更新テスト',
        }),
      });

      const response = await patchPost(request as any, { params: { id: invalidId } });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('異常系: 投稿内容が280文字を超えるとエラーが返る', async () => {
      const tooLongContent = 'あ'.repeat(281);

      const request = new Request(`http://localhost:8432/api/posts/${testPostId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: tooLongContent,
        }),
      });

      const response = await patchPost(request as any, { params: { id: testPostId } });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('異常系: 過去の日時を指定するとエラーが返る', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 3600000); // 1時間前

      const request = new Request(`http://localhost:8432/api/posts/${testPostId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduled_at: pastDate.toISOString(),
        }),
      });

      const response = await patchPost(request as any, { params: { id: testPostId } });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('異常系: フィールドが1つも指定されていないとエラーが返る', async () => {
      const request = new Request(`http://localhost:8432/api/posts/${testPostId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const response = await patchPost(request as any, { params: { id: testPostId } });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/posts - 手動投稿作成', () => {
    it('正常系: 手動投稿を作成できる', async () => {
      const now = new Date();
      const scheduledAt = new Date(now.getTime() + 3600000); // 1時間後
      const content = '手動投稿テスト';

      const request = new Request('http://localhost:8432/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          scheduled_at: scheduledAt.toISOString(),
        }),
      });

      const response = await createPost(request as any);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.user_id).toBe(testUserId);
      expect(data.content).toBe(content);
      expect(new Date(data.scheduled_at).getTime()).toBe(scheduledAt.getTime());
      expect(data.is_approved).toBe(true);
      expect(data.is_manual).toBe(true);
      expect(data.status).toBe('scheduled');
      expect(data.created_at).toBeDefined();
      expect(data.updated_at).toBeDefined();

      // クリーンアップ
      await db.delete(posts).where(eq(posts.id, data.id));
    });

    it('正常系: 280文字の投稿を作成できる', async () => {
      const now = new Date();
      const scheduledAt = new Date(now.getTime() + 3600000);
      const content = 'あ'.repeat(280); // ちょうど280文字

      const request = new Request('http://localhost:8432/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          scheduled_at: scheduledAt.toISOString(),
        }),
      });

      const response = await createPost(request as any);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.content).toBe(content);

      // クリーンアップ
      await db.delete(posts).where(eq(posts.id, data.id));
    });

    it('異常系: contentフィールドが必須', async () => {
      const now = new Date();
      const scheduledAt = new Date(now.getTime() + 3600000);

      const request = new Request('http://localhost:8432/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduled_at: scheduledAt.toISOString(),
        }),
      });

      const response = await createPost(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('異常系: scheduled_atフィールドが必須', async () => {
      const request = new Request('http://localhost:8432/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'テスト投稿',
        }),
      });

      const response = await createPost(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('異常系: 投稿内容が空文字列でエラーが返る', async () => {
      const now = new Date();
      const scheduledAt = new Date(now.getTime() + 3600000);

      const request = new Request('http://localhost:8432/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: '',
          scheduled_at: scheduledAt.toISOString(),
        }),
      });

      const response = await createPost(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('異常系: 投稿内容が281文字以上でエラーが返る', async () => {
      const now = new Date();
      const scheduledAt = new Date(now.getTime() + 3600000);
      const tooLongContent = 'あ'.repeat(281);

      const request = new Request('http://localhost:8432/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: tooLongContent,
          scheduled_at: scheduledAt.toISOString(),
        }),
      });

      const response = await createPost(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('異常系: 過去の日時を指定するとエラーが返る', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 3600000); // 1時間前

      const request = new Request('http://localhost:8432/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'テスト投稿',
          scheduled_at: pastDate.toISOString(),
        }),
      });

      const response = await createPost(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('異常系: 無効な日時フォーマットでエラーが返る', async () => {
      const request = new Request('http://localhost:8432/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'テスト投稿',
          scheduled_at: 'invalid-date',
        }),
      });

      const response = await createPost(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
