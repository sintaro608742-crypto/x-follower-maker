/**
 * Posts Repository
 *
 * このファイルは投稿データのデータアクセスレイヤーです。
 * データベースから投稿データを取得・操作します。
 */

import { db } from '@/db/client';
import { posts } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Post, PostStatus } from '@/types';
import { DatabaseError } from '@/lib/errors';

/**
 * 投稿一覧取得オプション
 */
export interface GetPostsOptions {
  userId: string;
  status?: PostStatus;
  limit?: number;
  offset?: number;
}

/**
 * 投稿一覧を取得
 *
 * @param options - 検索オプション
 * @returns 投稿配列
 * @throws {DatabaseError} データベースエラー
 */
export async function getPosts(options: GetPostsOptions): Promise<Post[]> {
  try {
    const { userId, status, limit = 50, offset = 0 } = options;

    // WHERE条件を構築
    const whereConditions = [eq(posts.user_id, userId)];

    if (status) {
      whereConditions.push(eq(posts.status, status));
    }

    // クエリ実行
    const postsList = await db
      .select({
        id: posts.id,
        user_id: posts.user_id,
        content: posts.content,
        scheduled_at: posts.scheduled_at,
        is_approved: posts.is_approved,
        is_manual: posts.is_manual,
        status: posts.status,
        posted_at: posts.posted_at,
        error_message: posts.error_message,
        twitter_tweet_id: posts.twitter_tweet_id,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
      })
      .from(posts)
      .where(and(...whereConditions))
      .orderBy(desc(posts.scheduled_at))
      .limit(limit)
      .offset(offset);

    // 型変換して返却
    return postsList.map((post) => ({
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      scheduled_at: post.scheduled_at.toISOString(),
      is_approved: post.is_approved,
      is_manual: post.is_manual,
      status: post.status as PostStatus,
      posted_at: post.posted_at?.toISOString(),
      error_message: post.error_message ?? undefined,
      twitter_tweet_id: post.twitter_tweet_id ?? undefined,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
    }));
  } catch (error) {
    throw new DatabaseError('Failed to fetch posts', error as Error);
  }
}

/**
 * 投稿件数を取得
 *
 * @param userId - ユーザーID
 * @param status - 投稿ステータス（任意）
 * @returns 投稿件数
 * @throws {DatabaseError} データベースエラー
 */
export async function getPostsCount(userId: string, status?: PostStatus): Promise<number> {
  try {
    const whereConditions = [eq(posts.user_id, userId)];

    if (status) {
      whereConditions.push(eq(posts.status, status));
    }

    const result = await db
      .select({
        count: posts.id,
      })
      .from(posts)
      .where(and(...whereConditions));

    return result.length;
  } catch (error) {
    throw new DatabaseError('Failed to count posts', error as Error);
  }
}

/**
 * IDで投稿を取得
 *
 * @param postId - 投稿ID
 * @returns 投稿データまたはnull
 * @throws {DatabaseError} データベースエラー
 */
export async function getPostById(postId: string): Promise<Post | null> {
  try {
    const result = await db
      .select({
        id: posts.id,
        user_id: posts.user_id,
        content: posts.content,
        scheduled_at: posts.scheduled_at,
        is_approved: posts.is_approved,
        is_manual: posts.is_manual,
        status: posts.status,
        posted_at: posts.posted_at,
        error_message: posts.error_message,
        twitter_tweet_id: posts.twitter_tweet_id,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const post = result[0];
    return {
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      scheduled_at: post.scheduled_at.toISOString(),
      is_approved: post.is_approved,
      is_manual: post.is_manual,
      status: post.status as PostStatus,
      posted_at: post.posted_at?.toISOString(),
      error_message: post.error_message ?? undefined,
      twitter_tweet_id: post.twitter_tweet_id ?? undefined,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
    };
  } catch (error) {
    throw new DatabaseError('Failed to fetch post by ID', error as Error);
  }
}

/**
 * 投稿更新オプション
 */
export interface UpdatePostOptions {
  content?: string;
  scheduled_at?: Date;
  is_approved?: boolean;
}

/**
 * 投稿を更新
 *
 * @param postId - 投稿ID
 * @param updates - 更新内容
 * @returns 更新された投稿データ
 * @throws {DatabaseError} データベースエラー
 */
export async function updatePost(postId: string, updates: UpdatePostOptions): Promise<Post> {
  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (updates.content !== undefined) {
      updateData.content = updates.content;
    }

    if (updates.scheduled_at !== undefined) {
      updateData.scheduled_at = updates.scheduled_at;
    }

    if (updates.is_approved !== undefined) {
      updateData.is_approved = updates.is_approved;
    }

    const result = await db
      .update(posts)
      .set(updateData)
      .where(eq(posts.id, postId))
      .returning({
        id: posts.id,
        user_id: posts.user_id,
        content: posts.content,
        scheduled_at: posts.scheduled_at,
        is_approved: posts.is_approved,
        is_manual: posts.is_manual,
        status: posts.status,
        posted_at: posts.posted_at,
        error_message: posts.error_message,
        twitter_tweet_id: posts.twitter_tweet_id,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
      });

    if (result.length === 0) {
      throw new DatabaseError('Post not found or update failed');
    }

    const post = result[0];
    return {
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      scheduled_at: post.scheduled_at.toISOString(),
      is_approved: post.is_approved,
      is_manual: post.is_manual,
      status: post.status as PostStatus,
      posted_at: post.posted_at?.toISOString(),
      error_message: post.error_message ?? undefined,
      twitter_tweet_id: post.twitter_tweet_id ?? undefined,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
    };
  } catch (error) {
    throw new DatabaseError('Failed to update post', error as Error);
  }
}

/**
 * 投稿作成オプション
 */
export interface CreatePostOptions {
  userId: string;
  content: string;
  scheduled_at: Date;
}

/**
 * 新規投稿を作成（手動投稿）
 *
 * @param options - 投稿データ
 * @returns 作成された投稿データ
 * @throws {DatabaseError} データベースエラー
 */
export async function createPost(options: CreatePostOptions): Promise<Post> {
  try {
    const { userId, content, scheduled_at } = options;

    const result = await db
      .insert(posts)
      .values({
        user_id: userId,
        content,
        scheduled_at,
        is_approved: true,
        is_manual: true,
        status: 'scheduled',
      })
      .returning({
        id: posts.id,
        user_id: posts.user_id,
        content: posts.content,
        scheduled_at: posts.scheduled_at,
        is_approved: posts.is_approved,
        is_manual: posts.is_manual,
        status: posts.status,
        posted_at: posts.posted_at,
        error_message: posts.error_message,
        twitter_tweet_id: posts.twitter_tweet_id,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
      });

    if (result.length === 0) {
      throw new DatabaseError('Post creation failed');
    }

    const post = result[0];
    return {
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      scheduled_at: post.scheduled_at.toISOString(),
      is_approved: post.is_approved,
      is_manual: post.is_manual,
      status: post.status as PostStatus,
      posted_at: post.posted_at?.toISOString(),
      error_message: post.error_message ?? undefined,
      twitter_tweet_id: post.twitter_tweet_id ?? undefined,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
    };
  } catch (error) {
    throw new DatabaseError('Failed to create post', error as Error);
  }
}

/**
 * 投稿を削除
 *
 * @param postId - 投稿ID
 * @returns void
 * @throws {DatabaseError} データベースエラー
 */
export async function deletePost(postId: string): Promise<void> {
  try {
    const result = await db
      .delete(posts)
      .where(eq(posts.id, postId))
      .returning({ id: posts.id });

    if (result.length === 0) {
      throw new DatabaseError('Post not found or delete failed');
    }
  } catch (error) {
    throw new DatabaseError('Failed to delete post', error as Error);
  }
}

/**
 * 投稿を承認（is_approved=true, status='scheduled'に更新）
 *
 * @param postId - 投稿ID
 * @returns 更新された投稿データ
 * @throws {DatabaseError} データベースエラー
 */
export async function approvePost(postId: string): Promise<Post> {
  try {
    const result = await db
      .update(posts)
      .set({
        is_approved: true,
        status: 'scheduled',
        updated_at: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning({
        id: posts.id,
        user_id: posts.user_id,
        content: posts.content,
        scheduled_at: posts.scheduled_at,
        is_approved: posts.is_approved,
        is_manual: posts.is_manual,
        status: posts.status,
        posted_at: posts.posted_at,
        error_message: posts.error_message,
        twitter_tweet_id: posts.twitter_tweet_id,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
      });

    if (result.length === 0) {
      throw new DatabaseError('Post not found or approval failed');
    }

    const post = result[0];
    return {
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      scheduled_at: post.scheduled_at.toISOString(),
      is_approved: post.is_approved,
      is_manual: post.is_manual,
      status: post.status as PostStatus,
      posted_at: post.posted_at?.toISOString(),
      error_message: post.error_message ?? undefined,
      twitter_tweet_id: post.twitter_tweet_id ?? undefined,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
    };
  } catch (error) {
    throw new DatabaseError('Failed to approve post', error as Error);
  }
}

/**
 * 失敗した投稿を再試行（status='scheduled', error_message=null に更新）
 *
 * @param postId - 投稿ID
 * @returns 更新された投稿データ
 * @throws {DatabaseError} データベースエラー
 */
export async function retryPost(postId: string): Promise<Post> {
  try {
    const result = await db
      .update(posts)
      .set({
        status: 'scheduled',
        error_message: null,
        updated_at: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning({
        id: posts.id,
        user_id: posts.user_id,
        content: posts.content,
        scheduled_at: posts.scheduled_at,
        is_approved: posts.is_approved,
        is_manual: posts.is_manual,
        status: posts.status,
        posted_at: posts.posted_at,
        error_message: posts.error_message,
        twitter_tweet_id: posts.twitter_tweet_id,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
      });

    if (result.length === 0) {
      throw new DatabaseError('Post not found or retry failed');
    }

    const post = result[0];
    return {
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      scheduled_at: post.scheduled_at.toISOString(),
      is_approved: post.is_approved,
      is_manual: post.is_manual,
      status: post.status as PostStatus,
      posted_at: post.posted_at?.toISOString(),
      error_message: post.error_message ?? undefined,
      twitter_tweet_id: post.twitter_tweet_id ?? undefined,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
    };
  } catch (error) {
    throw new DatabaseError('Failed to retry post', error as Error);
  }
}

/**
 * 投稿を再生成（AI投稿の内容を更新し、未承認状態にする）
 *
 * @param postId - 投稿ID
 * @param newContent - 新しい投稿内容
 * @returns 更新された投稿データ
 * @throws {DatabaseError} データベースエラー
 */
export async function regeneratePost(postId: string, newContent: string): Promise<Post> {
  try {
    const result = await db
      .update(posts)
      .set({
        content: newContent,
        is_approved: false,
        status: 'unapproved',
        updated_at: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning({
        id: posts.id,
        user_id: posts.user_id,
        content: posts.content,
        scheduled_at: posts.scheduled_at,
        is_approved: posts.is_approved,
        is_manual: posts.is_manual,
        status: posts.status,
        posted_at: posts.posted_at,
        error_message: posts.error_message,
        twitter_tweet_id: posts.twitter_tweet_id,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
      });

    if (result.length === 0) {
      throw new DatabaseError('Post not found or regeneration failed');
    }

    const post = result[0];
    return {
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      scheduled_at: post.scheduled_at.toISOString(),
      is_approved: post.is_approved,
      is_manual: post.is_manual,
      status: post.status as PostStatus,
      posted_at: post.posted_at?.toISOString(),
      error_message: post.error_message ?? undefined,
      twitter_tweet_id: post.twitter_tweet_id ?? undefined,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
    };
  } catch (error) {
    throw new DatabaseError('Failed to regenerate post', error as Error);
  }
}
