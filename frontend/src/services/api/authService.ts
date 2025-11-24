import type { User, AuthResponse, LoginRequest, SignupRequest } from '@/types';
import { logger } from '@/lib/logger';

export class AuthService {
  // 開発環境: http://localhost:8432, 本番環境: 空文字列（同じドメイン）
  private readonly baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

  /**
   * ログイン処理
   * NextAuth.js Credentials Provider経由でログイン
   * POST /api/auth/signin
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    logger.debug('Logging in user', { email: credentials.email });

    try {
      // まずCSRFトークンを取得
      const csrfResponse = await fetch(`${this.baseUrl}/api/auth/csrf`, {
        method: 'GET',
        credentials: 'include',
      });

      const { csrfToken } = await csrfResponse.json();

      // NextAuth.jsのCredentialsプロバイダーを使用してログイン
      const response = await fetch(`${this.baseUrl}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body: new URLSearchParams({
          email: credentials.email,
          password: credentials.password,
          csrfToken,
          redirect: 'false',
          json: 'true',
        }),
      });

      if (!response.ok) {
        throw new Error(`ログインに失敗しました（${response.status}）`);
      }

      const data = await response.json();

      // NextAuth returns {url: ...} on success, {error: ...} on failure
      if (data.error) {
        throw new Error(data.error || 'メールアドレスまたはパスワードが正しくありません');
      }

      logger.info('User logged in successfully', { email: credentials.email });

      // NextAuth.jsのセッションからユーザー情報を取得
      const user = await this.getCurrentUser();

      return {
        user,
        access_token: 'nextauth-session', // NextAuth.jsはクッキーベースなので実際のトークンは不要
        refresh_token: undefined,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Login failed', { error: error.message, email: credentials.email });
      throw error;
    }
  }

  /**
   * サインアップ処理
   * カスタムエンドポイント経由でユーザー登録
   * POST /api/auth/signup
   */
  async signup(data: SignupRequest): Promise<AuthResponse> {
    logger.debug('Signing up user', { email: data.email });

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('このメールアドレスは既に登録されています');
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'ユーザー登録データが不正です');
        }
        throw new Error(`ユーザー登録に失敗しました（${response.status}）`);
      }

      await response.json();

      logger.info('User signed up successfully', { email: data.email });

      // 登録後、自動的にログインしてセッション確立
      return await this.login({
        email: data.email,
        password: data.password,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Signup failed', { error: error.message, email: data.email });
      throw error;
    }
  }

  /**
   * ログアウト処理
   * NextAuth.js経由でセッション破棄
   * POST /api/auth/signout
   */
  async logout(): Promise<void> {
    logger.debug('Logging out user');

    try {
      // CSRFトークンを取得
      const csrfResponse = await fetch(`${this.baseUrl}/api/auth/csrf`, {
        method: 'GET',
        credentials: 'include',
      });

      const { csrfToken } = await csrfResponse.json();

      // NextAuth.jsのsignoutエンドポイントを使用
      const response = await fetch(`${this.baseUrl}/api/auth/signout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body: new URLSearchParams({
          csrfToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`ログアウトに失敗しました（${response.status}）`);
      }

      logger.info('User logged out successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Logout failed', { error: error.message });
      throw error;
    }
  }

  /**
   * 現在のユーザー情報取得
   * NextAuth.jsセッションから取得
   * GET /api/auth/session
   */
  async getCurrentUser(): Promise<User> {
    logger.debug('Fetching current user');

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/session`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        throw new Error(`ユーザー情報の取得に失敗しました（${response.status}）`);
      }

      const sessionData = await response.json();

      if (!sessionData || !sessionData.user) {
        throw new Error('セッションが存在しません');
      }

      // NextAuth.jsのセッションにはユーザーIDのみが含まれるため、完全なユーザー情報を取得
      const userResponse = await fetch(`${this.baseUrl}/api/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!userResponse.ok) {
        throw new Error(`ユーザー詳細情報の取得に失敗しました（${userResponse.status}）`);
      }

      const user: User = await userResponse.json();

      logger.info('Current user fetched successfully', { userId: user.id });

      return user;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to fetch current user', { error: error.message });
      throw error;
    }
  }

  /**
   * セッションチェック
   * NextAuth.jsセッションが有効かどうかを確認
   * GET /api/auth/session
   */
  async checkSession(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/session`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return false;
      }

      const sessionData = await response.json();
      return !!sessionData && !!sessionData.user;
    } catch {
      return false;
    }
  }
}
