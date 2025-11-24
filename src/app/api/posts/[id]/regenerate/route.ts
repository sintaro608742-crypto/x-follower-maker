/**
 * POST /api/posts/:id/regenerate
 *
 * AI投稿再生成エンドポイント
 * Gemini APIを使用して投稿内容を再生成し、承認待ち状態に変更します。
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { handleApiError } from '@/lib/errors';
import { regeneratePostService } from '@/services/posts.service';
import { z } from 'zod';
import { fromZodError } from '@/lib/errors';

/**
 * パスパラメータバリデーションスキーマ
 */
const paramsSchema = z.object({
  id: z.string().uuid('Invalid post ID format'),
});

/**
 * POST /api/posts/:id/regenerate
 *
 * AI投稿再生成
 *
 * @param request - Next.js Request
 * @param context - Route context (params)
 * @returns NextResponse<Post>
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 認証チェック
    const userId = await getCurrentUserId();

    // パスパラメータ取得
    const params = await context.params;

    // パスパラメータバリデーション
    const validationResult = paramsSchema.safeParse(params);
    if (!validationResult.success) {
      throw fromZodError(validationResult.error);
    }

    const { id: postId } = validationResult.data;

    // 投稿再生成サービス呼び出し
    const regeneratedPost = await regeneratePostService({
      postId,
      userId,
    });

    // 成功レスポンス
    return NextResponse.json(regeneratedPost, { status: 200 });
  } catch (error) {
    // エラーハンドリング
    const { statusCode, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status: statusCode });
  }
}
