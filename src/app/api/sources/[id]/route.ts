/**
 * Source Detail API Route
 *
 * GET /api/sources/:id
 * 特定のソースを取得（生成済み投稿含む）
 *
 * DELETE /api/sources/:id
 * ソースを削除
 *
 * 認証: 必須
 * Path Parameters:
 *   - id: ソースID
 * Response: Source with GeneratedPosts (GET) | 204 No Content (DELETE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import {
  getSourceByIdService,
  deleteSourceService,
  getGeneratedPostsService,
} from '@/services/sources.service';
import { handleApiError, ValidationError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/sources/:id
 *
 * 特定のソースを取得（生成済み投稿含む）
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // セッション認証
    const userId = await getCurrentUserId();

    // パスパラメータ取得
    const { id } = await params;

    if (!id) {
      throw new ValidationError('Source ID is required');
    }

    // ソースを取得（所有権チェック付き）
    const source = await getSourceByIdService(id, userId);

    // 生成済み投稿を取得
    const generatedPosts = await getGeneratedPostsService(id, userId);

    // 成功レスポンス
    return NextResponse.json(
      {
        source,
        generated_posts: generatedPosts,
      },
      { status: 200 }
    );
  } catch (error) {
    // エラーハンドリング
    const { statusCode, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status: statusCode });
  }
}

/**
 * DELETE /api/sources/:id
 *
 * ソースを削除
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // セッション認証
    const userId = await getCurrentUserId();

    // パスパラメータ取得
    const { id } = await params;

    if (!id) {
      throw new ValidationError('Source ID is required');
    }

    // ソースを削除（所有権チェック付き）
    await deleteSourceService(id, userId);

    // 成功レスポンス（204 No Content）
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // エラーハンドリング
    const { statusCode, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status: statusCode });
  }
}
