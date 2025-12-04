/**
 * Source Generate Posts API Route
 *
 * POST /api/sources/:id/generate
 * ソースから投稿を生成
 *
 * 認証: 必須
 * Path Parameters:
 *   - id: ソースID
 * Request Body:
 *   - style: 生成スタイル ('summary' | 'opinion' | 'quote')
 *   - count: 生成件数（1-10、デフォルト3）
 *   - custom_prompt: カスタム指示（任意）
 * Response: SourceGeneratePostsResponse
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { generatePostsFromSourceService } from '@/services/sources.service';
import { handleApiError, ValidationError } from '@/lib/errors';
import type { GenerationStyle, SourceGeneratePostsRequest } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 生成スタイルのバリデーション
 */
function isValidGenerationStyle(style: string): style is GenerationStyle {
  return ['summary', 'opinion', 'quote'].includes(style);
}

/**
 * POST /api/sources/:id/generate
 *
 * ソースから投稿を生成
 */
export async function POST(
  request: NextRequest,
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

    // リクエストボディ取得
    const body = await request.json();

    // スタイルのバリデーション
    if (!body.style || typeof body.style !== 'string') {
      throw new ValidationError('Style is required');
    }

    if (!isValidGenerationStyle(body.style)) {
      throw new ValidationError(
        'Invalid style. Must be one of: summary, opinion, quote'
      );
    }

    // カウントのバリデーション
    let count = 3; // デフォルト値
    if (body.count !== undefined) {
      const parsedCount = parseInt(body.count, 10);
      if (isNaN(parsedCount) || parsedCount < 1 || parsedCount > 10) {
        throw new ValidationError('Count must be a number between 1 and 10');
      }
      count = parsedCount;
    }

    // カスタムプロンプトの取得（任意）
    const customPrompt = body.custom_prompt && typeof body.custom_prompt === 'string'
      ? body.custom_prompt.trim()
      : undefined;

    const requestData: SourceGeneratePostsRequest = {
      source_id: id,
      style: body.style,
      count,
      custom_prompt: customPrompt,
    };

    // 投稿を生成
    const result = await generatePostsFromSourceService(userId, requestData);

    // 成功レスポンス
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // エラーハンドリング
    const { statusCode, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status: statusCode });
  }
}
