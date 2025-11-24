/**
 * Twitter OAuth Integration Tests
 *
 * Slice 2-B: X連携管理の統合テスト
 * - GET /api/twitter/auth/url
 * - POST /api/twitter/disconnect
 *
 * 実データベースを使用した統合テスト
 */

import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/encryption';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/twitter/oauth';

// テスト対象のAPIハンドラー
import { GET as getAuthUrl } from '@/app/api/twitter/auth/url/route';
import { POST as postDisconnect } from '@/app/api/twitter/disconnect/route';

// NextAuth.jsのモック
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Twitter OAuth Integration Tests', () => {
  let testUserId: string;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  beforeAll(async () => {
    // テスト用ユーザーを作成
    const passwordHash = await hashPassword(testPassword);
    const [user] = await db
      .insert(users)
      .values({
        email: testEmail,
        password_hash: passwordHash,
        keywords: ['テスト'],
        post_frequency: 4,
        post_times: ['09:00', '12:00', '18:00', '21:00'],
      })
      .returning();

    testUserId = user.id;
  });

  beforeEach(() => {
    // 各テストの前にモックをリセット
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // テスト用ユーザーを削除
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe('Twitter OAuth Utilities', () => {
    it('should generate valid code_verifier', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toBeDefined();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
      // URL-safe base64チェック
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate valid code_challenge from verifier', () => {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);
      expect(challenge).toBeDefined();
      expect(challenge.length).toBeGreaterThan(0);
      // URL-safe base64チェック
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate unique states', () => {
      const state1 = generateState();
      const state2 = generateState();
      expect(state1).not.toBe(state2);
      expect(state1.length).toBe(32); // 16バイトのhex = 32文字
    });
  });

  describe('GET /api/twitter/auth/url', () => {
    it('should return 401 without authentication', async () => {
      // 認証なしでリクエスト（セッションをnullに設定）
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:8432/api/twitter/auth/url', {
        method: 'GET',
      });

      const response = await getAuthUrl(request as any);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toBe('認証が必要です');
    });

    it('should generate valid OAuth URL with authentication', async () => {
      // 認証済みセッションでリクエスト
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUserId, email: testEmail },
      });

      const request = new Request('http://localhost:8432/api/twitter/auth/url', {
        method: 'GET',
      });

      const response = await getAuthUrl(request as any);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.authUrl).toBeDefined();
      expect(typeof data.authUrl).toBe('string');

      // OAuth URLの形式を検証
      expect(data.authUrl).toContain('https://twitter.com/i/oauth2/authorize');
      expect(data.authUrl).toContain('client_id=');
      expect(data.authUrl).toContain('redirect_uri=');
      expect(data.authUrl).toContain('state=');
      expect(data.authUrl).toContain('code_challenge=');
      expect(data.authUrl).toContain('code_challenge_method=S256');
    });

    it('should store OAuth state in cookies', async () => {
      // 認証済みセッションでリクエスト
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUserId, email: testEmail },
      });

      const request = new Request('http://localhost:8432/api/twitter/auth/url', {
        method: 'GET',
      });

      const response = await getAuthUrl(request as any);
      expect(response.status).toBe(200);

      // Cookieに twitter_oauth_state が設定されていることを確認
      const setCookieHeader = response.headers.get('set-cookie');
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain('twitter_oauth_state=');

      // Cookieの属性を検証
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('SameSite=lax'); // 小文字のlax
      expect(setCookieHeader).toContain('Path=/');
      expect(setCookieHeader).toContain('Max-Age=600'); // 10分
    });
  });

  describe('POST /api/twitter/disconnect', () => {
    beforeEach(async () => {
      // テスト用にTwitter連携情報を追加
      await db
        .update(users)
        .set({
          twitter_user_id: '12345678',
          twitter_username: 'testuser',
          twitter_access_token_encrypted: 'encrypted_token',
          twitter_refresh_token_encrypted: 'encrypted_refresh',
        })
        .where(eq(users.id, testUserId));
    });

    it('should return 401 without authentication', async () => {
      // 認証なしでリクエスト（セッションをnullに設定）
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:8432/api/twitter/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: testUserId }),
      });

      const response = await postDisconnect(request as any);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toBe('認証が必要です');
    });

    it('should return 400 without user_id', async () => {
      // 認証済みセッションでリクエスト
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUserId, email: testEmail },
      });

      const request = new Request('http://localhost:8432/api/twitter/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // user_idなし
      });

      const response = await postDisconnect(request as any);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Bad Request');
      expect(data.message).toBe('user_idが必要です');
    });

    it('should return 403 for different user', async () => {
      // 別のユーザーとしてログイン
      const differentUserId = 'different-user-id';
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: differentUserId, email: 'different@example.com' },
      });

      const request = new Request('http://localhost:8432/api/twitter/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: testUserId }), // 他のユーザーのID
      });

      const response = await postDisconnect(request as any);
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe('Forbidden');
      expect(data.message).toBe('他のユーザーの連携を解除する権限がありません');
    });

    it('should successfully disconnect Twitter account', async () => {
      // 認証済みセッションでリクエスト
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUserId, email: testEmail },
      });

      const request = new Request('http://localhost:8432/api/twitter/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: testUserId }),
      });

      const response = await postDisconnect(request as any);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Twitter連携を解除しました');

      // データベースから確認
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(user.twitter_user_id).toBeNull();
      expect(user.twitter_username).toBeNull();
      expect(user.twitter_access_token_encrypted).toBeNull();
      expect(user.twitter_refresh_token_encrypted).toBeNull();
    });
  });

  describe('Database Integration', () => {
    it('should create user with Twitter credentials', async () => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(user).toBeDefined();
      expect(user.email).toBe(testEmail);
    });

    it('should update Twitter credentials', async () => {
      await db
        .update(users)
        .set({
          twitter_user_id: '987654321',
          twitter_username: 'newuser',
        })
        .where(eq(users.id, testUserId));

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(user.twitter_user_id).toBe('987654321');
      expect(user.twitter_username).toBe('newuser');
    });
  });
});
