import type {
  DashboardData,
  KeywordUpdateRequest,
  PostScheduleUpdateRequest,
  SettingsUpdateResponse,
  TwitterDisconnectRequest,
  Post
} from '@/types';
import { logger } from '@/lib/logger';

/**
 * AI投稿生成レスポンス型
 */
export interface GeneratePostsResponse {
  posts: Post[];
  message: string;
}

export class DashboardService {
  // 開発環境: http://localhost:8432, 本番環境: 空文字列（同じドメイン）
  private readonly baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

  /**
   * ダッシュボードデータ取得
   * GET /api/dashboard
   */
  async getDashboardData(): Promise<DashboardData> {
    logger.debug('Fetching dashboard data from API');

    try {
      const response = await fetch(`${this.baseUrl}/api/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // NextAuth.jsセッションクッキーを送信
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です。ログインしてください。');
        }
        if (response.status === 500) {
          throw new Error('サーバーエラーが発生しました。時間をおいて再度お試しください。');
        }
        throw new Error(`ダッシュボードデータの取得に失敗しました（${response.status}）`);
      }

      const data: DashboardData = await response.json();

      logger.info('Dashboard data fetched successfully', {
        userId: data.user.id,
        twitterStatus: data.twitterStatus,
        followerCount: data.followerStats.currentCount
      });

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to fetch dashboard data', { error: error.message });
      throw error;
    }
  }

  /**
   * キーワード設定更新
   * PUT /api/settings/keywords
   */
  async updateKeywords(request: KeywordUpdateRequest): Promise<SettingsUpdateResponse> {
    logger.debug('Updating keywords', { keywords: request.keywords });

    try {
      const response = await fetch(`${this.baseUrl}/api/settings/keywords`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です。ログインしてください。');
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'キーワード設定が不正です。');
        }
        throw new Error(`キーワード更新に失敗しました（${response.status}）`);
      }

      const data: SettingsUpdateResponse = await response.json();

      logger.info('Keywords updated successfully', { keywords: request.keywords });

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to update keywords', { error: error.message });
      throw error;
    }
  }

  /**
   * 投稿スケジュール設定更新
   * PUT /api/settings/post-schedule
   */
  async updatePostSchedule(request: PostScheduleUpdateRequest): Promise<SettingsUpdateResponse> {
    logger.debug('Updating post schedule', {
      frequency: request.post_frequency,
      times: request.post_times
    });

    try {
      const response = await fetch(`${this.baseUrl}/api/settings/post-schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です。ログインしてください。');
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || '投稿スケジュール設定が不正です。');
        }
        throw new Error(`投稿スケジュール更新に失敗しました（${response.status}）`);
      }

      const data: SettingsUpdateResponse = await response.json();

      logger.info('Post schedule updated successfully', {
        frequency: request.post_frequency,
        times: request.post_times
      });

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to update post schedule', { error: error.message });
      throw error;
    }
  }

  /**
   * X OAuth認証URL取得
   * GET /api/twitter/auth/url
   */
  async connectTwitter(): Promise<{ authUrl: string }> {
    logger.debug('Getting Twitter auth URL');

    try {
      const response = await fetch(`${this.baseUrl}/api/twitter/auth/url`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です。ログインしてください。');
        }
        throw new Error(`X連携URLの取得に失敗しました（${response.status}）`);
      }

      const data: { authUrl: string } = await response.json();

      logger.info('Twitter auth URL generated');

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to get Twitter auth URL', { error: error.message });
      throw error;
    }
  }

  /**
   * X連携解除
   * POST /api/twitter/disconnect
   */
  async disconnectTwitter(request: TwitterDisconnectRequest): Promise<SettingsUpdateResponse> {
    logger.debug('Disconnecting Twitter', { userId: request.user_id });

    try {
      const response = await fetch(`${this.baseUrl}/api/twitter/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です。ログインしてください。');
        }
        throw new Error(`X連携解除に失敗しました（${response.status}）`);
      }

      const data: SettingsUpdateResponse = await response.json();

      logger.info('Twitter disconnected successfully', { userId: request.user_id });

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to disconnect Twitter', { error: error.message });
      throw error;
    }
  }

  /**
   * AIで投稿を生成
   * POST /api/posts/generate
   */
  async generatePosts(count: number = 1): Promise<GeneratePostsResponse> {
    logger.debug('Generating posts with AI', { count });

    try {
      const response = await fetch(`${this.baseUrl}/api/posts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ count }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です。ログインしてください。');
        }
        if (response.status === 409) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'キーワードが設定されていません。');
        }
        if (response.status === 429) {
          throw new Error('API制限に達しました。しばらく待ってから再度お試しください。');
        }
        throw new Error(`投稿の生成に失敗しました（${response.status}）`);
      }

      const data: GeneratePostsResponse = await response.json();

      logger.info('Posts generated successfully', {
        count: data.posts.length,
        message: data.message
      });

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to generate posts', { error: error.message });
      throw error;
    }
  }
}
