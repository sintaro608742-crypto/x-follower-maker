import type {
  Source,
  SourceListResponse,
  SourceCreateFromUrlRequest,
  SourceCreateResponse,
  SourceDetailResponse,
  SourceGeneratePostsRequest,
  SourceGeneratePostsResponse,
} from '@/types';
import { logger } from '@/lib/logger';

export class SourcesService {
  // 開発環境: http://localhost:8432, 本番環境: 空文字列（同じドメイン）
  private readonly baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

  /**
   * ソース一覧取得
   * GET /api/sources
   */
  async getList(): Promise<SourceListResponse> {
    logger.debug('Fetching sources list', { endpoint: '/api/sources' });

    try {
      const response = await fetch(`${this.baseUrl}/api/sources`, {
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
        if (response.status === 500) {
          throw new Error('サーバーエラーが発生しました。時間をおいて再度お試しください。');
        }
        throw new Error(`ソース一覧の取得に失敗しました（${response.status}）`);
      }

      const data: SourceListResponse = await response.json();

      logger.info('Sources list fetched successfully', { count: data.total });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to fetch sources list', { error: error.message });
      throw error;
    }
  }

  /**
   * ソース詳細取得
   * GET /api/sources/:id
   */
  async getById(sourceId: string): Promise<SourceDetailResponse> {
    logger.debug('Fetching source detail', { sourceId });

    try {
      const response = await fetch(`${this.baseUrl}/api/sources/${sourceId}`, {
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
        if (response.status === 403) {
          throw new Error('このソースにアクセスする権限がありません。');
        }
        if (response.status === 404) {
          throw new Error('ソースが見つかりませんでした。');
        }
        throw new Error(`ソース詳細の取得に失敗しました（${response.status}）`);
      }

      const data: SourceDetailResponse = await response.json();

      logger.info('Source detail fetched successfully', { sourceId });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to fetch source detail', { error: error.message, sourceId });
      throw error;
    }
  }

  /**
   * URLからソース作成
   * POST /api/sources
   */
  async createFromUrl(request: SourceCreateFromUrlRequest): Promise<SourceCreateResponse> {
    logger.debug('Creating source from URL', { url: request.url });

    try {
      const response = await fetch(`${this.baseUrl}/api/sources`, {
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
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'URLが無効です。');
        }
        if (response.status === 500) {
          throw new Error('コンテンツの取得に失敗しました。URLを確認してください。');
        }
        throw new Error(`ソース作成に失敗しました（${response.status}）`);
      }

      const data: SourceCreateResponse = await response.json();

      logger.info('Source created successfully', { sourceId: data.source.id });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to create source from URL', { error: error.message, url: request.url });
      throw error;
    }
  }

  /**
   * ソース削除
   * DELETE /api/sources/:id
   */
  async delete(sourceId: string): Promise<void> {
    logger.debug('Deleting source', { sourceId });

    try {
      const response = await fetch(`${this.baseUrl}/api/sources/${sourceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です。ログインしてください。');
        }
        if (response.status === 403) {
          throw new Error('このソースを削除する権限がありません。');
        }
        if (response.status === 404) {
          throw new Error('ソースが見つかりませんでした。');
        }
        throw new Error(`ソース削除に失敗しました（${response.status}）`);
      }

      logger.info('Source deleted successfully', { sourceId });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to delete source', { error: error.message, sourceId });
      throw error;
    }
  }

  /**
   * ソースから投稿を生成
   * POST /api/sources/:id/generate
   */
  async generatePosts(
    sourceId: string,
    request: SourceGeneratePostsRequest
  ): Promise<SourceGeneratePostsResponse> {
    logger.debug('Generating posts from source', { sourceId, style: request.style, count: request.count });

    try {
      const response = await fetch(`${this.baseUrl}/api/sources/${sourceId}/generate`, {
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
        if (response.status === 403) {
          throw new Error('このソースから投稿を生成する権限がありません。');
        }
        if (response.status === 404) {
          throw new Error('ソースが見つかりませんでした。');
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'リクエストが不正です。');
        }
        if (response.status === 429) {
          throw new Error('AI APIのリクエスト制限に達しました。時間をおいて再度お試しください。');
        }
        if (response.status === 503) {
          throw new Error('AI APIが一時的に利用できません。時間をおいて再度お試しください。');
        }
        throw new Error(`投稿生成に失敗しました（${response.status}）`);
      }

      const data: SourceGeneratePostsResponse = await response.json();

      logger.info('Posts generated successfully', { sourceId, count: data.posts.length });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to generate posts from source', { error: error.message, sourceId });
      throw error;
    }
  }
}
