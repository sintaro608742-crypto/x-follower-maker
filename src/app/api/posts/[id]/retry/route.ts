/**
 * POST /api/posts/:id/retry
 *
 * 投稿再試行エンドポイント
 * - 認証: NextAuth.jsセッション必須
 * - 機能: 失敗（failed）した投稿を再度試行、予約中（scheduled）に変更
 */

import { NextRequest, NextResponse } from 'next/server';
import { retryPostService } from '@/services/posts.service';
import { getCurrentUserId } from '@/lib/session';
import { handleApiError } from '@/lib/errors';
import { z } from 'zod';
import { fromZodError } from '@/lib/errors';

// パスパラメータのバリデーションスキーマ
const paramsSchema = z.object({
  id: z.string().uuid('Invalid post ID format'),
});

/**
 * POST /api/posts/:id/retry
 *
 * 失敗した投稿を再試行する
 *
 * @param request - Next.js Request
 * @param context - ルートコンテキスト（パスパラメータ）
 * @returns 再試行された投稿データ
 */
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // パスパラメータのバリデーション
    const paramsResult = paramsSchema.safeParse(context.params);

    if (!paramsResult.success) {
      throw fromZodError(paramsResult.error);
    }

    const { id: postId } = paramsResult.data;

    // 認証チェック
    const userId = await getCurrentUserId();

    // 投稿を再試行
    const retriedPost = await retryPostService({
      postId,
      userId,
    });

    return NextResponse.json(retriedPost, { status: 200 });
  } catch (error) {
    const { statusCode, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status: statusCode });
  }
}
