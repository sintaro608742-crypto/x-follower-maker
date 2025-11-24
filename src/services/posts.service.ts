/**
 * Posts Service
 *
 * このファイルは投稿機能のビジネスロジック層です。
 * リポジトリ層からデータを取得し、Post型に整形します。
 */

import {
  getPosts,
  getPostsCount,
  getPostById,
  updatePost,
  createPost,
  deletePost,
  approvePost,
  retryPost,
  regeneratePost,
  UpdatePostOptions,
  CreatePostOptions,
} from '@/repositories/posts.repository';
import { getUserById } from '@/repositories/dashboard.repository';
import { Post, PostStatus } from '@/types';
import { NotFoundError, AuthorizationError, ConflictError } from '@/lib/errors';
import { regenerateSinglePost } from '@/lib/gemini';

/**
 * 投稿一覧取得オプション
 */
export interface GetPostsServiceOptions {
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
 */
export async function getPostsList(options: GetPostsServiceOptions): Promise<Post[]> {
  const { userId, status, limit = 50, offset = 0 } = options;

  // リポジトリ層から投稿データを取得
  const postsList = await getPosts({
    userId,
    status,
    limit,
    offset,
  });

  return postsList;
}

/**
 * 投稿件数を取得
 *
 * @param userId - ユーザーID
 * @param status - 投稿ステータス（任意）
 * @returns 投稿件数
 */
export async function getPostsCountService(userId: string, status?: PostStatus): Promise<number> {
  return await getPostsCount(userId, status);
}

/**
 * 投稿更新サービスオプション
 */
export interface UpdatePostServiceOptions {
  postId: string;
  userId: string;
  content?: string;
  scheduled_at?: string;
  is_approved?: boolean;
}

/**
 * 投稿を更新
 *
 * @param options - 更新オプション
 * @returns 更新された投稿
 * @throws {NotFoundError} 投稿が存在しない
 * @throws {AuthorizationError} 他人の投稿を更新しようとした
 */
export async function updatePostService(options: UpdatePostServiceOptions): Promise<Post> {
  const { postId, userId, content, scheduled_at, is_approved } = options;

  // 投稿を取得
  const post = await getPostById(postId);

  // 存在チェック
  if (!post) {
    throw new NotFoundError('Post');
  }

  // 所有権チェック
  if (post.user_id !== userId) {
    throw new AuthorizationError('You do not have permission to update this post');
  }

  // 更新データを構築
  const updates: UpdatePostOptions = {};

  if (content !== undefined) {
    updates.content = content;
  }

  if (scheduled_at !== undefined) {
    updates.scheduled_at = new Date(scheduled_at);
  }

  if (is_approved !== undefined) {
    updates.is_approved = is_approved;
  }

  // 投稿を更新
  const updatedPost = await updatePost(postId, updates);

  return updatedPost;
}

/**
 * 投稿作成サービスオプション
 */
export interface CreatePostServiceOptions {
  userId: string;
  content: string;
  scheduled_at: string;
}

/**
 * 新規投稿を作成（手動投稿）
 *
 * @param options - 作成オプション
 * @returns 作成された投稿
 */
export async function createPostService(options: CreatePostServiceOptions): Promise<Post> {
  const { userId, content, scheduled_at } = options;

  // 投稿作成データを構築
  const createOptions: CreatePostOptions = {
    userId,
    content,
    scheduled_at: new Date(scheduled_at),
  };

  // 投稿を作成
  const newPost = await createPost(createOptions);

  return newPost;
}

/**
 * 投稿削除サービスオプション
 */
export interface DeletePostServiceOptions {
  postId: string;
  userId: string;
}

/**
 * 投稿を削除
 *
 * @param options - 削除オプション
 * @returns void
 * @throws {NotFoundError} 投稿が存在しない
 * @throws {AuthorizationError} 他人の投稿を削除しようとした
 */
export async function deletePostService(options: DeletePostServiceOptions): Promise<void> {
  const { postId, userId } = options;

  // 投稿を取得
  const post = await getPostById(postId);

  // 存在チェック
  if (!post) {
    throw new NotFoundError('Post');
  }

  // 所有権チェック
  if (post.user_id !== userId) {
    throw new AuthorizationError('You do not have permission to delete this post');
  }

  // 投稿を削除
  await deletePost(postId);
}

/**
 * 投稿承認サービスオプション
 */
export interface ApprovePostServiceOptions {
  postId: string;
  userId: string;
}

/**
 * 投稿を承認
 *
 * @param options - 承認オプション
 * @returns 承認された投稿
 * @throws {NotFoundError} 投稿が存在しない
 * @throws {AuthorizationError} 他人の投稿を承認しようとした
 * @throws {ConflictError} すでに承認済みの投稿
 */
export async function approvePostService(options: ApprovePostServiceOptions): Promise<Post> {
  const { postId, userId } = options;

  // 投稿を取得
  const post = await getPostById(postId);

  // 存在チェック
  if (!post) {
    throw new NotFoundError('Post');
  }

  // 所有権チェック
  if (post.user_id !== userId) {
    throw new AuthorizationError('You do not have permission to approve this post');
  }

  // 既に承認済みかチェック
  if (post.is_approved && post.status === 'scheduled') {
    throw new ConflictError('Post is already approved');
  }

  // 投稿を承認
  const approvedPost = await approvePost(postId);

  return approvedPost;
}

/**
 * 投稿再試行サービスオプション
 */
export interface RetryPostServiceOptions {
  postId: string;
  userId: string;
}

/**
 * 失敗した投稿を再試行
 *
 * @param options - 再試行オプション
 * @returns 再試行された投稿
 * @throws {NotFoundError} 投稿が存在しない
 * @throws {AuthorizationError} 他人の投稿を再試行しようとした
 * @throws {ConflictError} 失敗状態ではない投稿
 */
export async function retryPostService(options: RetryPostServiceOptions): Promise<Post> {
  const { postId, userId } = options;

  // 投稿を取得
  const post = await getPostById(postId);

  // 存在チェック
  if (!post) {
    throw new NotFoundError('Post');
  }

  // 所有権チェック
  if (post.user_id !== userId) {
    throw new AuthorizationError('You do not have permission to retry this post');
  }

  // 失敗状態かチェック
  if (post.status !== 'failed') {
    throw new ConflictError('Only failed posts can be retried');
  }

  // 投稿を再試行
  const retriedPost = await retryPost(postId);

  return retriedPost;
}

/**
 * 投稿再生成サービスオプション
 */
export interface RegeneratePostServiceOptions {
  postId: string;
  userId: string;
}

/**
 * AIで投稿を再生成
 *
 * @param options - 再生成オプション
 * @returns 再生成された投稿
 * @throws {NotFoundError} 投稿が存在しない、またはユーザーが存在しない
 * @throws {AuthorizationError} 他人の投稿を再生成しようとした
 * @throws {RateLimitError} Gemini APIレート制限超過
 * @throws {ExternalServiceError} Gemini APIエラー
 */
export async function regeneratePostService(options: RegeneratePostServiceOptions): Promise<Post> {
  const { postId, userId } = options;

  // 投稿を取得
  const post = await getPostById(postId);

  // 存在チェック
  if (!post) {
    throw new NotFoundError('Post');
  }

  // 所有権チェック
  if (post.user_id !== userId) {
    throw new AuthorizationError('You do not have permission to regenerate this post');
  }

  // ユーザー情報を取得（キーワード取得のため）
  const user = await getUserById(userId);

  // キーワードが設定されているかチェック
  if (!user.keywords || user.keywords.length === 0) {
    throw new ConflictError('User keywords are not configured');
  }

  // Gemini APIで投稿を再生成
  const newContent = await regenerateSinglePost(user.keywords);

  // 投稿を更新（content更新、is_approved=false、status='unapproved'）
  const regeneratedPost = await regeneratePost(postId, newContent);

  return regeneratedPost;
}
