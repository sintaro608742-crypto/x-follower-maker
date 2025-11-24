/**
 * Posts API Route
 *
 * GET /api/posts
 * 投稿一覧を取得（ステータスフィルタリング、ページネーション、ソート機能付き）
 *
 * POST /api/posts
 * 新規投稿を作成（手動投稿）
 *
 * 認証: 必須
 * Query Parameters (GET):
 *   - status: 投稿ステータス ('scheduled' | 'posted' | 'failed' | 'unapproved') - 任意
 *   - limit: ページごとの件数（デフォルト50） - 任意
 *   - offset: オフセット（デフォルト0） - 任意
 * Request Body (POST):
 *   - content: 投稿内容（必須、1-280文字）
 *   - scheduled_at: 投稿予定日時（必須、ISO8601形式）
 * Response: Post[] (GET) | Post (POST)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { getPostsList, createPostService } from '@/services/posts.service';
import { handleApiError, ValidationError } from '@/lib/errors';
import { PostStatus } from '@/types';
import { validatePostCreate } from '@/lib/validation';

/**
 * 投稿ステータスのバリデーション
 *
 * @param status - ステータス文字列
 * @returns 有効な場合true
 */
function isValidPostStatus(status: string): status is PostStatus {
  return ['scheduled', 'posted', 'failed', 'unapproved'].includes(status);
}

/**
 * GET /api/posts
 *
 * 投稿一覧を取得
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // セッション認証
    const userId = await getCurrentUserId();

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // ステータスのバリデーション
    let status: PostStatus | undefined;
    if (statusParam) {
      if (!isValidPostStatus(statusParam)) {
        throw new ValidationError(
          `Invalid status parameter. Must be one of: scheduled, posted, failed, unapproved`
        );
      }
      status = statusParam;
    }

    // limit のバリデーション
    let limit = 50; // デフォルト値
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        throw new ValidationError('Limit must be a number between 1 and 100');
      }
      limit = parsedLimit;
    }

    // offset のバリデーション
    let offset = 0; // デフォルト値
    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam, 10);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        throw new ValidationError('Offset must be a non-negative number');
      }
      offset = parsedOffset;
    }

    // 投稿一覧取得
    const posts = await getPostsList({
      userId,
      status,
      limit,
      offset,
    });

    // 成功レスポンス
    return NextResponse.json(posts, { status: 200 });
  } catch (error) {
    // エラーハンドリング
    const { statusCode, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status: statusCode });
  }
}

/**
 * POST /api/posts
 *
 * 新規投稿を作成（手動投稿）
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // セッション認証
    const userId = await getCurrentUserId();

    // リクエストボディ取得
    const body = await request.json();

    // リクエストボディのバリデーション
    const validation = validatePostCreate(body);
    if (!validation.success || !validation.data) {
      throw new ValidationError(
        validation.error?.message || 'Validation failed',
        validation.error?.issues
      );
    }

    const { content, scheduled_at } = validation.data;

    // 投稿を作成
    const newPost = await createPostService({
      userId,
      content,
      scheduled_at,
    });

    // 成功レスポンス（201 Created）
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    // エラーハンドリング
    const { statusCode, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status: statusCode });
  }
}
