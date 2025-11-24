/**
 * 投稿スケジュール設定更新 API
 *
 * エンドポイント: PUT /api/settings/post-schedule
 * 認証: 必須
 *
 * ユーザーの投稿頻度と投稿時間帯を更新します。
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validatePostScheduleUpdate } from '@/lib/validation';
import { handleApiError, ValidationError, NotFoundError, fromDatabaseError } from '@/lib/errors';
import { getCurrentUserId } from '@/lib/session';
import type { PostScheduleUpdateRequest, SettingsUpdateResponse, ErrorResponse } from '@/types';

/**
 * 投稿スケジュール設定更新
 *
 * @param request - Next.js Request
 * @returns 更新結果レスポンス
 */
export async function PUT(request: NextRequest): Promise<NextResponse<SettingsUpdateResponse | ErrorResponse>> {
  try {
    // 認証チェック
    const userId = await getCurrentUserId();

    // リクエストボディの取得
    const body: unknown = await request.json();

    // バリデーション
    const validationResult = validatePostScheduleUpdate(body);
    if (!validationResult.success) {
      throw new ValidationError(
        validationResult.error?.message || 'Validation failed',
        validationResult.error?.issues
      );
    }

    const { post_frequency, post_times } = validationResult.data as PostScheduleUpdateRequest;

    // データベース更新
    try {
      const updateResult = await db
        .update(users)
        .set({
          post_frequency,
          post_times,
          updated_at: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({ id: users.id });

      // ユーザーが存在しない場合
      if (updateResult.length === 0) {
        throw new NotFoundError('User');
      }

      // 成功レスポンス
      return NextResponse.json(
        {
          success: true,
          message: 'Post schedule updated successfully',
        },
        { status: 200 }
      );
    } catch (dbError) {
      // データベースエラーを変換
      throw fromDatabaseError(dbError as Error & { code?: string });
    }
  } catch (error) {
    // エラーハンドリング
    const { statusCode, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status: statusCode });
  }
}

/**
 * メソッド許可チェック
 * GET, POST, DELETE, PATCHは405エラーを返す
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method GET is not allowed for this endpoint. Use PUT instead.',
      },
    },
    { status: 405 }
  );
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method POST is not allowed for this endpoint. Use PUT instead.',
      },
    },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method DELETE is not allowed for this endpoint.',
      },
    },
    { status: 405 }
  );
}

export async function PATCH(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method PATCH is not allowed for this endpoint. Use PUT instead.',
      },
    },
    { status: 405 }
  );
}
