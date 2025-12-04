/**
 * Sources API Route
 *
 * GET /api/sources
 * ユーザーのソース一覧を取得
 *
 * POST /api/sources
 * URLからソースを作成
 *
 * 認証: 必須
 * Request Body (POST):
 *   - url: ソースURL（必須）
 *   - title: タイトル（任意、省略時は自動取得）
 * Response: SourceListResponse (GET) | SourceCreateResponse (POST)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { getSourcesService, createSourceFromUrlService } from '@/services/sources.service';
import { handleApiError, ValidationError } from '@/lib/errors';
import type { SourceCreateFromUrlRequest } from '@/types';

/**
 * GET /api/sources
 *
 * ユーザーのソース一覧を取得
 */
export async function GET(): Promise<NextResponse> {
  try {
    // セッション認証
    const userId = await getCurrentUserId();

    // ソース一覧取得
    const result = await getSourcesService(userId);

    // 成功レスポンス
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // エラーハンドリング
    const { statusCode, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status: statusCode });
  }
}

/**
 * POST /api/sources
 *
 * URLからソースを作成
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // セッション認証
    console.log('[Sources API] POST - Starting...');
    const userId = await getCurrentUserId();
    console.log('[Sources API] User ID:', userId);

    // リクエストボディ取得
    const body = await request.json();
    console.log('[Sources API] Request body:', body);

    // バリデーション
    if (!body.url || typeof body.url !== 'string') {
      throw new ValidationError('URL is required');
    }

    const requestData: SourceCreateFromUrlRequest = {
      url: body.url.trim(),
      title: body.title?.trim() || undefined,
    };

    // ソースを作成
    console.log('[Sources API] Creating source from URL:', requestData.url);
    const result = await createSourceFromUrlService(userId, requestData);
    console.log('[Sources API] Source created:', result.source.id);

    // 成功レスポンス（201 Created）
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    // エラーハンドリング
    console.error('[Sources API] Error:', error);
    const { statusCode, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status: statusCode });
  }
}
