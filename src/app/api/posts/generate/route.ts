/**
 * Generate Posts API Route
 *
 * POST /api/posts/generate
 * AIを使用して投稿を生成し、DBに保存する
 *
 * 認証: 必須
 * Request Body:
 *   - count: 生成する投稿数（任意、デフォルト1、最大5）
 *   - tone: 生成トーン（任意、デフォルト'casual'）
 * Response:
 *   - posts: 生成された投稿配列
 *   - message: 成功メッセージ
 *
 * 動作:
 *   - auto_post_source_idsが設定されている場合: ソースから生成
 *   - キーワードのみ設定されている場合: キーワードから生成
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { getUserById } from '@/repositories/dashboard.repository';
import { createPost } from '@/repositories/posts.repository';
import { generatePosts, generatePostsFromSource } from '@/lib/gemini';
import { getSourceById } from '@/repositories/sources.repository';
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

    // ユーザー情報を取得（キーワードとソース設定取得のため）
    const user = await getUserById(userId);
    console.log('[API /api/posts/generate] User keywords:', user.keywords);
    console.log('[API /api/posts/generate] Auto post source IDs:', user.auto_post_source_ids);

    // 生成されたツイートを格納
    let generatedTweets: string[] = [];

    // 優先順位: 1. ソースから生成 2. キーワードから生成
    if (user.auto_post_source_ids && user.auto_post_source_ids.length > 0) {
      // ソースから投稿を生成
      console.log('[API /api/posts/generate] Generating from sources...');

      // ランダムにソースを選択（複数ある場合は分散させる）
      const sourceIds = user.auto_post_source_ids;
      const postsPerSource = Math.ceil(count / sourceIds.length);

      for (let i = 0; i < sourceIds.length && generatedTweets.length < count; i++) {
        const sourceId = sourceIds[i];
        try {
          const source = await getSourceById(sourceId);
          if (!source || source.user_id !== userId) {
            console.log(`[API /api/posts/generate] Source ${sourceId} not found or unauthorized`);
            continue;
          }

          // 残りの必要件数を計算
          const remaining = count - generatedTweets.length;
          const countForThisSource = Math.min(postsPerSource, remaining);

          // スタイルをランダムに選択（バリエーションのため）
          const styles = ['summary', 'opinion', 'quote'] as const;
          const randomStyle = styles[Math.floor(Math.random() * styles.length)];

          console.log(`[API /api/posts/generate] Generating ${countForThisSource} posts from source: ${source.title}`);

          const sourcePosts = await generatePostsFromSource(
            source.extracted_text,
            source.title,
            randomStyle,
            countForThisSource
          );

          generatedTweets.push(...sourcePosts);
        } catch (err) {
          console.error(`[API /api/posts/generate] Failed to generate from source ${sourceId}:`, err);
        }
      }

      // ソースから生成できなかった場合のフォールバック
      if (generatedTweets.length === 0) {
        console.log('[API /api/posts/generate] No posts generated from sources, falling back to keywords');
        if (!user.keywords || user.keywords.length === 0) {
          throw new ConflictError(
            '設定されたソースからの投稿生成に失敗しました。キーワードも設定されていないため、投稿を生成できません。'
          );
        }
        // キーワードからの生成にフォールバック
        generatedTweets = await generatePosts({
          keywords: user.keywords,
          count,
          tone,
        });
      }
    } else if (user.keywords && user.keywords.length > 0) {
      // キーワードから投稿を生成
      console.log('[API /api/posts/generate] Calling Gemini API with keywords...');
      generatedTweets = await generatePosts({
        keywords: user.keywords,
        count,
        tone,
      });
    } else {
      // ソースもキーワードも設定されていない
      throw new ConflictError(
        'キーワードまたは自動投稿ソースを設定してください。ダッシュボードで設定できます。'
      );
    }

    console.log('[API /api/posts/generate] Gemini API returned', generatedTweets.length, 'tweets');

    // 生成された投稿をDBに保存
    const savedPosts: Post[] = [];

    // 日本時間（JST = UTC+9）で現在時刻を取得
    const JST_OFFSET = 9 * 60 * 60 * 1000; // 9時間をミリ秒で
    const nowUTC = new Date();
    const nowJST = new Date(nowUTC.getTime() + JST_OFFSET);

    console.log('[API /api/posts/generate] Current time UTC:', nowUTC.toISOString());
    console.log('[API /api/posts/generate] Current time JST:', nowJST.toISOString());

    // ユーザーの投稿時間帯設定を取得（設定がない場合はデフォルト値）
    const postTimes = user.post_times && user.post_times.length > 0
      ? user.post_times.sort()
      : ['09:00', '12:00', '18:00'];

    console.log('[API /api/posts/generate] User post_times:', postTimes);

    // 次の投稿可能時刻を計算する関数（日本時間ベース）
    const getNextScheduledTime = (index: number): Date => {
      // 日本時間での現在時刻
      const nowHoursJST = nowJST.getUTCHours();
      const nowMinutesJST = nowJST.getUTCMinutes();
      const nowTimeStr = `${String(nowHoursJST).padStart(2, '0')}:${String(nowMinutesJST).padStart(2, '0')}`;

      console.log('[API /api/posts/generate] Current JST time string:', nowTimeStr);

      // 今日の残りの時間帯と明日以降の時間帯を含めた配列を作成
      const availableTimes: { date: Date; time: string }[] = [];

      // 今日の時間帯（日本時間）
      for (const time of postTimes) {
        if (time > nowTimeStr) {
          const [hours, minutes] = time.split(':').map(Number);
          // 日本時間で設定してUTCに変換
          const scheduledJST = new Date(nowJST);
          scheduledJST.setUTCHours(hours, minutes, 0, 0);
          // JST -> UTC に変換（9時間引く）
          const scheduledUTC = new Date(scheduledJST.getTime() - JST_OFFSET);
          availableTimes.push({ date: scheduledUTC, time });
        }
      }

      // 明日以降の時間帯（必要な分だけ追加）
      let daysToAdd = 1;
      while (availableTimes.length < generatedTweets.length) {
        for (const time of postTimes) {
          const [hours, minutes] = time.split(':').map(Number);
          // 日本時間で設定してUTCに変換
          const scheduledJST = new Date(nowJST);
          scheduledJST.setUTCDate(scheduledJST.getUTCDate() + daysToAdd);
          scheduledJST.setUTCHours(hours, minutes, 0, 0);
          // JST -> UTC に変換（9時間引く）
          const scheduledUTC = new Date(scheduledJST.getTime() - JST_OFFSET);
          availableTimes.push({ date: scheduledUTC, time });

          if (availableTimes.length >= generatedTweets.length) break;
        }
        daysToAdd++;
      }

      return availableTimes[index]?.date || new Date(nowUTC.getTime() + (index + 1) * 60 * 60 * 1000);
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
