/**
 * Current User API Route
 *
 * GET /api/user
 * 現在ログイン中のユーザー情報を取得
 */

import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { NotFoundError } from '@/lib/errors';

export async function GET() {
  try {
    // セッションからユーザーIDを取得
    const session = await getSession();
    const userId = session.user.id;

    // データベースからユーザー情報を取得
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        twitter_user_id: users.twitter_user_id,
        twitter_username: users.twitter_username,
        keywords: users.keywords,
        post_frequency: users.post_frequency,
        post_times: users.post_times,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      );
    }

    // 認証エラーの場合
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    console.error('Get user error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
