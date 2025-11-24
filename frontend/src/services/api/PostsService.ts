import type { Post, PostUpdateRequest } from '@/types';
import { logger } from '@/lib/logger';

export class PostsService {
  // 本番環境では同じドメイン（xfollowermaker.vercel.app）を使用、開発環境ではlocalhost:8432
  private readonly baseUrl = import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? 'http://localhost:8432' : '');

  /**
   * 投稿一覧取得
   * GET /api/posts
   */
  async getList(): Promise<Post[]> {
    logger.debug('Fetching posts list', { endpoint: '/api/posts' });

    try {
      const response = await fetch(`${this.baseUrl}/api/posts`, {
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
        throw new Error(`投稿一覧の取得に失敗しました（${response.status}）`);
      }

      const data: Post[] = await response.json();

      logger.info('Posts list fetched successfully', { count: data.length });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to fetch posts list', { error: error.message });
      throw error;
    }
  }

  /**
   * 投稿更新
   * PATCH /api/posts/:id
   */
  async update(request: PostUpdateRequest): Promise<Post> {
    logger.debug('Updating post', { postId: request.post_id });

    try {
      const { post_id, ...body } = request;

      const response = await fetch(`${this.baseUrl}/api/posts/${post_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です。ログインしてください。');
        }
        if (response.status === 403) {
          throw new Error('この投稿を更新する権限がありません。');
        }
        if (response.status === 404) {
          throw new Error('投稿が見つかりませんでした。');
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || '投稿データが不正です。');
        }
        throw new Error(`投稿更新に失敗しました（${response.status}）`);
      }

      const data: Post = await response.json();

      logger.info('Post updated successfully', { postId: request.post_id });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to update post', { error: error.message, postId: request.post_id });
      throw error;
    }
  }

  /**
   * 投稿削除
   * DELETE /api/posts/:id
   */
  async delete(postId: string): Promise<void> {
    logger.debug('Deleting post', { postId });

    try {
      const response = await fetch(`${this.baseUrl}/api/posts/${postId}`, {
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
          throw new Error('この投稿を削除する権限がありません。');
        }
        if (response.status === 404) {
          throw new Error('投稿が見つかりませんでした。');
        }
        throw new Error(`投稿削除に失敗しました（${response.status}）`);
      }

      logger.info('Post deleted successfully', { postId });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to delete post', { error: error.message, postId });
      throw error;
    }
  }

  /**
   * AI投稿再生成
   * POST /api/posts/:id/regenerate
   */
  async regenerate(postId: string): Promise<Post> {
    logger.debug('Regenerating post', { postId });

    try {
      const response = await fetch(`${this.baseUrl}/api/posts/${postId}/regenerate`, {
        method: 'POST',
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
          throw new Error('この投稿を再生成する権限がありません。');
        }
        if (response.status === 404) {
          throw new Error('投稿が見つかりませんでした。');
        }
        if (response.status === 409) {
          throw new Error('キーワードが設定されていません。ダッシュボードから設定してください。');
        }
        if (response.status === 429) {
          throw new Error('AI APIのリクエスト制限に達しました。時間をおいて再度お試しください。');
        }
        if (response.status === 503) {
          throw new Error('AI APIが一時的に利用できません。時間をおいて再度お試しください。');
        }
        throw new Error(`投稿再生成に失敗しました（${response.status}）`);
      }

      const data: Post = await response.json();

      logger.info('Post regenerated successfully', { postId });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to regenerate post', { error: error.message, postId });
      throw error;
    }
  }

  /**
   * 投稿承認
   * POST /api/posts/:id/approve
   */
  async approve(postId: string): Promise<Post> {
    logger.debug('Approving post', { postId });

    try {
      const response = await fetch(`${this.baseUrl}/api/posts/${postId}/approve`, {
        method: 'POST',
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
          throw new Error('この投稿を承認する権限がありません。');
        }
        if (response.status === 404) {
          throw new Error('投稿が見つかりませんでした。');
        }
        if (response.status === 409) {
          throw new Error('この投稿はすでに承認されています。');
        }
        throw new Error(`投稿承認に失敗しました（${response.status}）`);
      }

      const data: Post = await response.json();

      logger.info('Post approved successfully', { postId });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to approve post', { error: error.message, postId });
      throw error;
    }
  }

  /**
   * 投稿再試行
   * POST /api/posts/:id/retry
   */
  async retry(postId: string): Promise<Post> {
    logger.debug('Retrying post', { postId });

    try {
      const response = await fetch(`${this.baseUrl}/api/posts/${postId}/retry`, {
        method: 'POST',
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
          throw new Error('この投稿を再試行する権限がありません。');
        }
        if (response.status === 404) {
          throw new Error('投稿が見つかりませんでした。');
        }
        if (response.status === 409) {
          throw new Error('失敗状態の投稿のみ再試行できます。');
        }
        throw new Error(`投稿再試行に失敗しました（${response.status}）`);
      }

      const data: Post = await response.json();

      logger.info('Post retry successful', { postId });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to retry post', { error: error.message, postId });
      throw error;
    }
  }

  /**
   * 手動投稿作成
   * POST /api/posts
   */
  async create(content: string, scheduledAt: string): Promise<Post> {
    logger.debug('Creating manual post', { scheduledAt });

    try {
      const response = await fetch(`${this.baseUrl}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content,
          scheduled_at: scheduledAt,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です。ログインしてください。');
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || '投稿データが不正です。');
        }
        throw new Error(`投稿作成に失敗しました（${response.status}）`);
      }

      const data: Post = await response.json();

      logger.info('Manual post created successfully', { postId: data.id });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Failed to create manual post', { error: error.message });
      throw error;
    }
  }
}
