/**
 * Generate Posts API Route
 *
 * POST /api/posts/generate
 * AIを使用して投稿を生成し、DBに保存する
 *
 * 認証: 必須
 * Request Body:
 *   - count: 生成する投稿数（任意、デフォルト1、最大5）
 * Response:
 *   - posts: 生成された投稿配列
 *   - message: 成功メッセージ
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { getUserById } from '@/repositories/dashboard.repository';
import { createPost } from '@/repositories/posts.repository';
import { generatePosts } from '@/lib/gemini';
import { handleApiError, ValidationError, ConflictError } from '@/lib/errors';
import { Post } from '@/types';

/**
 * POST /api/posts/generate
 *
 * AIで投稿を生成
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[API /api/posts/generate] Starting post generation...');

    // セッション認証
    const userId = await getCurrentUserId();
    console.log('[API /api/posts/generate] User authenticated:', userId);

    // リクエストボディ取得
    let body: { count?: number; tone?: string } = {};
    try {
      body = await request.json();
    } catch {
      // リクエストボディがない場合はデフォルト値を使用
    }

    // countのバリデーション
    const count = body.count ?? 1;
    if (count < 1 || count > 5) {
      throw new ValidationError('count must be between 1 and 5');
    }

    // toneのバリデーション
    const validTones = ['casual', 'professional', 'humorous', 'educational'];
    const tone = body.tone && validTones.includes(body.tone) ? body.tone : 'casual';
    console.log('[API /api/posts/generate] Generating', count, 'posts with tone:', tone);

    // ユーザー情報を取得（キーワード取得のため）
    const user = await getUserById(userId);
    console.log('[API /api/posts/generate] User keywords:', user.keywords);

    // キーワードが設定されているかチェック
    if (!user.keywords || user.keywords.length === 0) {
      throw new ConflictError(
        'キーワードが設定されていません。ダッシュボードでキーワードを設定してください。'
      );
    }

    // Gemini APIで投稿を生成
    console.log('[API /api/posts/generate] Calling Gemini API...');
    const generatedTweets = await generatePosts({
      keywords: user.keywords,
      count,
      tone,
    });
    console.log('[API /api/posts/generate] Gemini API returned', generatedTweets.length, 'tweets');

    // 生成された投稿をDBに保存
    const savedPosts: Post[] = [];
    const now = new Date();

    // ユーザーの投稿時間帯設定を取得（設定がない場合はデフォルト値）
    const postTimes = user.post_times && user.post_times.length > 0
      ? user.post_times.sort()
      : ['09:00', '12:00', '18:00'];

    console.log('[API /api/posts/generate] User post_times:', postTimes);

    // 次の投稿可能時刻を計算する関数
    const getNextScheduledTime = (index: number): Date => {
      const nowHours = now.getHours();
      const nowMinutes = now.getMinutes();
      const nowTimeStr = `${String(nowHours).padStart(2, '0')}:${String(nowMinutes).padStart(2, '0')}`;

      // 今日の残りの時間帯と明日以降の時間帯を含めた配列を作成
      const availableTimes: { date: Date; time: string }[] = [];

      // 今日の時間帯
      for (const time of postTimes) {
        if (time > nowTimeStr) {
          const [hours, minutes] = time.split(':').map(Number);
          const scheduledDate = new Date(now);
          scheduledDate.setHours(hours, minutes, 0, 0);
          availableTimes.push({ date: scheduledDate, time });
        }
      }

      // 明日以降の時間帯（必要な分だけ追加）
      let daysToAdd = 1;
      while (availableTimes.length < generatedTweets.length) {
        for (const time of postTimes) {
          const [hours, minutes] = time.split(':').map(Number);
          const scheduledDate = new Date(now);
          scheduledDate.setDate(scheduledDate.getDate() + daysToAdd);
          scheduledDate.setHours(hours, minutes, 0, 0);
          availableTimes.push({ date: scheduledDate, time });

          if (availableTimes.length >= generatedTweets.length) break;
        }
        daysToAdd++;
      }

      return availableTimes[index]?.date || new Date(now.getTime() + (index + 1) * 60 * 60 * 1000);
    };

    for (let i = 0; i < generatedTweets.length; i++) {
      const content = generatedTweets[i];

      // ユーザーの設定に基づいて投稿予定時刻を計算
      const scheduledAt = getNextScheduledTime(i);
      console.log(`[API /api/posts/generate] Post ${i + 1} scheduled at:`, scheduledAt.toISOString());

      const newPost = await createPost({
        userId,
        content,
        scheduled_at: scheduledAt,
        isAiGenerated: true,
        isApproved: false, // AI生成投稿は承認待ち状態で作成
      });

      savedPosts.push(newPost);
    }

    // 成功レスポンス
    return NextResponse.json(
      {
        posts: savedPosts,
        message: `${savedPosts.length}件の投稿を生成しました`,
      },
      { status: 201 }
    );
  } catch (error) {
    // エラーハンドリング
    const { statusCode, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status: statusCode });
  }
}
