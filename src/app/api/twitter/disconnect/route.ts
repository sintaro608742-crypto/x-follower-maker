/**
 * Twitter連携解除エンドポイント
 *
 * エンドポイント: POST /api/twitter/disconnect
 * 認証: 必須
 *
 * Twitterとの連携を解除し、保存されているトークンを削除します。
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/twitter/disconnect
 *
 * Twitter連携を解除し、トークンを削除
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // セッション認証チェック
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      );
    }

    // リクエストボディの検証
    const body = await request.json();
    const { user_id } = body;

    // ユーザーIDの検証
    if (!user_id) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'user_idが必要です' },
        { status: 400 }
      );
    }

    // セッションユーザーとリクエストユーザーが一致するか確認
    if (session.user.id !== user_id) {
      return NextResponse.json(
        { error: 'Forbidden', message: '他のユーザーの連携を解除する権限がありません' },
        { status: 403 }
      );
    }

    // データベースからTwitterトークンを削除
    await db
      .update(users)
      .set({
        twitter_user_id: null,
        twitter_username: null,
        twitter_access_token_encrypted: null,
        twitter_refresh_token_encrypted: null,
        updated_at: new Date(),
      })
      .where(eq(users.id, user_id));

    return NextResponse.json(
      {
        success: true,
        message: 'Twitter連携を解除しました',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Twitter disconnect error:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'サーバーエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
