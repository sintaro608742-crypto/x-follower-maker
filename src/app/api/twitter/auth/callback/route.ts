/**
 * Twitter OAuth Callback Handler
 *
 * エンドポイント: GET /api/twitter/auth/callback
 *
 * Twitter OAuth 2.0認証のコールバックを処理します。
 * - 認証コードをアクセストークンに交換
 * - Twitterユーザー情報を取得
 * - ユーザー情報をDBに保存（暗号化）
 * - ダッシュボードにリダイレクト
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exchangeCodeForToken, type TwitterOAuthState } from '@/lib/twitter/oauth';
import { encrypt } from '@/lib/encryption';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { TwitterApi } from 'twitter-api-v2';

/**
 * GET /api/twitter/auth/callback
 *
 * Twitter OAuthコールバックを処理
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // URLからクエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // エラーチェック（ユーザーがキャンセルした場合など）
    if (error) {
      console.error('Twitter OAuth error:', error);
      return NextResponse.redirect(
        new URL('/dashboard?error=twitter_auth_cancelled', process.env.NEXTAUTH_URL!)
      );
    }

    // 必須パラメータチェック
    if (!code || !state) {
      console.error('Missing code or state');
      return NextResponse.redirect(
        new URL('/dashboard?error=missing_params', process.env.NEXTAUTH_URL!)
      );
    }

    // セッション認証チェック
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.redirect(
        new URL('/login?error=session_expired', process.env.NEXTAUTH_URL!)
      );
    }

    // CookieからOAuth stateを取得
    const oauthStateCookie = request.cookies.get('twitter_oauth_state');
    if (!oauthStateCookie) {
      console.error('OAuth state cookie not found');
      return NextResponse.redirect(
        new URL('/dashboard?error=state_not_found', process.env.NEXTAUTH_URL!)
      );
    }

    let savedState: TwitterOAuthState;
    try {
      savedState = JSON.parse(oauthStateCookie.value);
    } catch {
      console.error('Invalid OAuth state cookie');
      return NextResponse.redirect(
        new URL('/dashboard?error=invalid_state', process.env.NEXTAUTH_URL!)
      );
    }

    // State検証（CSRF対策）
    if (state !== savedState.state) {
      console.error('State mismatch');
      return NextResponse.redirect(
        new URL('/dashboard?error=state_mismatch', process.env.NEXTAUTH_URL!)
      );
    }

    // State有効期限チェック（10分）
    if (Date.now() - savedState.createdAt > 10 * 60 * 1000) {
      console.error('OAuth state expired');
      return NextResponse.redirect(
        new URL('/dashboard?error=state_expired', process.env.NEXTAUTH_URL!)
      );
    }

    // 環境変数の検証
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/twitter/auth/callback`;

    if (!clientId || !clientSecret) {
      console.error('Missing Twitter credentials');
      return NextResponse.redirect(
        new URL('/dashboard?error=config_error', process.env.NEXTAUTH_URL!)
      );
    }

    // 認証コードをアクセストークンに交換
    console.log('Exchanging code for token...');
    const tokenResponse = await exchangeCodeForToken({
      code,
      codeVerifier: savedState.codeVerifier,
      clientId,
      clientSecret,
      redirectUri,
    });

    console.log('Token exchange successful');

    // Twitterユーザー情報を取得
    const twitterClient = new TwitterApi(tokenResponse.access_token);
    const meResult = await twitterClient.v2.me({
      'user.fields': ['public_metrics', 'username'],
    });

    const twitterUser = {
      id: meResult.data.id,
      username: meResult.data.username,
      followerCount: meResult.data.public_metrics?.followers_count || 0,
      followingCount: meResult.data.public_metrics?.following_count || 0,
    };

    console.log('Twitter user info:', twitterUser.username);

    // トークンを暗号化
    const encryptedAccessToken = encrypt(tokenResponse.access_token);
    const encryptedRefreshToken = tokenResponse.refresh_token
      ? encrypt(tokenResponse.refresh_token)
      : null;

    // ユーザー情報をDBに更新
    await db
      .update(users)
      .set({
        twitter_user_id: twitterUser.id,
        twitter_username: twitterUser.username,
        twitter_access_token_encrypted: encryptedAccessToken,
        twitter_refresh_token_encrypted: encryptedRefreshToken,
        updated_at: new Date(),
      })
      .where(eq(users.id, session.user.id));

    console.log('User updated with Twitter info');

    // OAuth state cookieを削除
    const response = NextResponse.redirect(
      new URL('/dashboard?success=twitter_connected', process.env.NEXTAUTH_URL!)
    );
    response.cookies.delete('twitter_oauth_state');

    return response;
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);

    // エラーメッセージを取得
    let errorMessage = 'unknown_error';
    if (error instanceof Error) {
      if (error.message.includes('Token exchange failed')) {
        errorMessage = 'token_exchange_failed';
      } else if (error.message.includes('Encryption failed')) {
        errorMessage = 'encryption_failed';
      } else {
        errorMessage = encodeURIComponent(error.message.substring(0, 50));
      }
    }

    return NextResponse.redirect(
      new URL(`/dashboard?error=${errorMessage}`, process.env.NEXTAUTH_URL!)
    );
  }
}
