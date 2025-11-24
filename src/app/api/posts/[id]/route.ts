/**
 * Posts API Route - Update and Delete Post
 *
 * PATCH /api/posts/:id
 * 既存投稿を更新（内容、投稿日時、承認状態）
 *
 * DELETE /api/posts/:id
 * 投稿を削除
 *
 * 認証: 必須
 * Request Body (PATCH):
 *   - content: 投稿内容（任意、1-280文字）
 *   - scheduled_at: 投稿予定日時（任意、ISO8601形式）
 *   - is_approved: 承認状態（任意、boolean）
 * Response: Post
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { updatePostService, deletePostService } from '@/services/posts.service';
import { handleApiError, ValidationError } from '@/lib/errors';
import { validate, postContentSchema, scheduledAtSchema, uuidSchema } from '@/lib/validation';
import { z } from 'zod';

/**
 * PATCH /api/posts/:id
 *
 * 投稿を更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // セッション認証
    const userId = await getCurrentUserId();

    // パスパラメータのバリデーション
    const postIdValidation = validate(uuidSchema, params.id);
    if (!postIdValidation.success || !postIdValidation.data) {
      throw new ValidationError('Invalid post ID format');
    }
    const postId = postIdValidation.data;

    // リクエストボディ取得
    const body = await request.json();

    // リクエストボディのバリデーション
    const updateSchema = z.object({
      content: postContentSchema.optional(),
      scheduled_at: scheduledAtSchema.optional(),
      is_approved: z.boolean().optional(),
    });

    const validation = validate(updateSchema, body);
    if (!validation.success || !validation.data) {
      throw new ValidationError(
        validation.error?.message || 'Validation failed',
        validation.error?.issues
      );
    }

    const { content, scheduled_at, is_approved } = validation.data;

    // 少なくとも1つのフィールドが指定されていることを確認
    if (content === undefined && scheduled_at === undefined && is_approved === undefined) {
      throw new ValidationError(
        'At least one field (content, scheduled_at, is_approved) must be provided'
      );
    }

    // 投稿を更新
    const updatedPost = await updatePostService({
      postId,
      userId,
      content,
      scheduled_at,
      is_approved,
    });

    // 成功レスポンス
    return NextResponse.json(updatedPost, { status: 200 });
  } catch (error) {
    // エラーハンドリング
    const { statusCode, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status: statusCode });
  }
}

/**
 * DELETE /api/posts/:id
 *
 * 投稿を削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // セッション認証
    const userId = await getCurrentUserId();

    // パスパラメータのバリデーション
    const postIdValidation = validate(uuidSchema, params.id);
    if (!postIdValidation.success || !postIdValidation.data) {
      throw new ValidationError('Invalid post ID format');
    }
    const postId = postIdValidation.data;

    // 投稿を削除
    await deletePostService({
      postId,
      userId,
    });

    // 成功レスポンス（204 No Content）
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // エラーハンドリング
    const { statusCode, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status: statusCode });
  }
}
