/**
 * Cron Job: Record Follower Stats
 *
 * このエンドポイントはUpstash QStashから毎日8時に呼び出されます。
 * Twitter連携済みの全ユーザーのフォロワー数を取得し、follower_statsテーブルに記録します。
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { db } from '@/db/client';
import { users, followerStats } from '@/db/schema';
import { isNotNull } from 'drizzle-orm';
import { createUserClient, getUserInfo } from '@/lib/twitter/client';

/**
 * Cron Job ハンドラー
 *
 * QStash署名検証を行い、フォロワー数を記録します。
 */
async function handler(req: NextRequest) {
  try {
    console.log('[Cron] Starting record-followers job');

    // Twitter連携済みのユーザーを取得
    const connectedUsers = await db
      .select({
        id: users.id,
        twitter_user_id: users.twitter_user_id,
        twitter_access_token_encrypted: users.twitter_access_token_encrypted,
      })
      .from(users)
      .where(isNotNull(users.twitter_access_token_encrypted));

    console.log(`[Cron] Found ${connectedUsers.length} connected users`);

    if (connectedUsers.length === 0) {
      return NextResponse.json({
        message: 'No connected users to process',
        recorded: 0,
      });
    }

    // 各ユーザーのフォロワー数を取得
    const results = await Promise.allSettled(
      connectedUsers.map(async (user) => {
        try {
          if (!user.twitter_user_id || !user.twitter_access_token_encrypted) {
            throw new Error('Twitter user ID or token not found');
          }

          // Twitter APIクライアント作成
          const twitterClient = createUserClient(
            user.twitter_access_token_encrypted
          );

          // ユーザー情報取得
          const userInfo = await getUserInfo(twitterClient, user.twitter_user_id);

          // follower_statsテーブルに記録
          await db.insert(followerStats).values({
            user_id: user.id,
            follower_count: userInfo.followerCount,
            following_count: userInfo.followingCount,
            recorded_at: new Date(),
          });

          console.log(
            `[Cron] User ${user.id} followers recorded: ${userInfo.followerCount}`
          );
          return {
            userId: user.id,
            status: 'success',
            followerCount: userInfo.followerCount,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.error(`[Cron] User ${user.id} failed:`, errorMessage);
          return { userId: user.id, status: 'failed', error: errorMessage };
        }
      })
    );

    // 結果集計
    const succeeded = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 'success'
    ).length;
    const failed = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 'failed'
    ).length;

    console.log(
      `[Cron] Completed: ${succeeded} succeeded, ${failed} failed`
    );

    return NextResponse.json({
      message: 'Record followers job completed',
      total: connectedUsers.length,
      succeeded,
      failed,
    });
  } catch (error) {
    console.error('[Cron] Record followers job error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Vercel Cron用のGETハンドラー
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return handler(req);
}

// QStash用のPOSTハンドラー（後方互換性）
export const POST =
  process.env.NODE_ENV === 'production'
    ? verifySignatureAppRouter(handler)
    : handler;

// 動的ルート設定
export const dynamic = 'force-dynamic';
