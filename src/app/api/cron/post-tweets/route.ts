/**
 * Cron Job: Post Scheduled Tweets
 *
 * このエンドポイントはUpstash QStashから毎時0分に呼び出されます。
 * scheduled_atが現在時刻以前の投稿を取得し、Twitter APIで投稿します。
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  getScheduledPostsDue,
  markPostAsPosted,
  markPostAsFailed,
} from '@/repositories/posts.repository';
import { createUserClient, postTweet } from '@/lib/twitter/client';

/**
 * Cron Job ハンドラー
 *
 * QStash署名検証を行い、スケジュールされた投稿を実行します。
 */
async function handler(req: NextRequest) {
  try {
    console.log('[Cron] Starting post-tweets job');

    // スケジュール済み投稿を取得
    const posts = await getScheduledPostsDue(50);
    console.log(`[Cron] Found ${posts.length} scheduled posts`);

    if (posts.length === 0) {
      return NextResponse.json({
        message: 'No scheduled posts to process',
        processed: 0,
      });
    }

    // 各投稿を処理
    const results = await Promise.allSettled(
      posts.map(async (post) => {
        try {
          // ユーザーのTwitterトークンを取得
          const userResult = await db
            .select({
              twitter_access_token_encrypted: users.twitter_access_token_encrypted,
            })
            .from(users)
            .where(eq(users.id, post.user_id))
            .limit(1);

          if (userResult.length === 0 || !userResult[0].twitter_access_token_encrypted) {
            throw new Error('User not found or Twitter not connected');
          }

          const encryptedToken = userResult[0].twitter_access_token_encrypted;

          // Twitter APIクライアント作成
          const twitterClient = createUserClient(encryptedToken);

          // ツイート投稿
          const tweetId = await postTweet(twitterClient, post.content);

          // 投稿成功としてマーク
          await markPostAsPosted(post.id, tweetId);

          console.log(`[Cron] Post ${post.id} succeeded: Tweet ID ${tweetId}`);
          return { postId: post.id, status: 'success', tweetId };
        } catch (error) {
          // 投稿失敗としてマーク
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          await markPostAsFailed(post.id, errorMessage);

          console.error(`[Cron] Post ${post.id} failed:`, errorMessage);
          return { postId: post.id, status: 'failed', error: errorMessage };
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
      message: 'Post tweets job completed',
      total: posts.length,
      succeeded,
      failed,
    });
  } catch (error) {
    console.error('[Cron] Post tweets job error:', error);
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
// Vercel CronはGETリクエストでエンドポイントを呼び出す
export async function GET(req: NextRequest) {
  // Vercel CronはAuthorizationヘッダーにCRON_SECRETを送信
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // 本番環境ではCRON_SECRETで認証
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return handler(req);
}

// QStash用のPOSTハンドラー（後方互換性のため残す）
export const POST =
  process.env.NODE_ENV === 'production'
    ? verifySignatureAppRouter(handler)
    : handler;

// 動的ルート設定
export const dynamic = 'force-dynamic';
