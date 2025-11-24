/**
 * POST /api/posts/:id/approve
 *
 * 投稿承認エンドポイント
 * - 認証: NextAuth.jsセッション必須
 * - 機能: 非承認（unapproved）の投稿を承認し、予約中（scheduled）に変更
 */

import { NextRequest, NextResponse } from 'next/server';
import { approvePostService } from '@/services/posts.service';
import { getCurrentUserId } from '@/lib/session';
import { handleApiError } from '@/lib/errors';
import { z } from 'zod';
import { fromZodError } from '@/lib/errors';

// パスパラメータのバリデーションスキーマ
const paramsSchema = z.object({
  id: z.string().uuid('Invalid post ID format'),
});

/**
 * POST /api/posts/:id/approve
 *
 * 投稿を承認する
 *
 * @param request - Next.js Request
 * @param context - ルートコンテキスト（パスパラメータ）
 * @returns 承認された投稿データ
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

    // 投稿を承認
    const approvedPost = await approvePostService({
      postId,
      userId,
    });

    return NextResponse.json(approvedPost, { status: 200 });
  } catch (error) {
    const { statusCode, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status: statusCode });
  }
}
