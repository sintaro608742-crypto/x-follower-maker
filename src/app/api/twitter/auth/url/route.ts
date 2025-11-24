/**
 * Twitter OAuth認証URL取得エンドポイント
 *
 * エンドポイント: GET /api/twitter/auth/url
 * 認証: 必須
 *
 * Twitter OAuth 2.0認証URLを生成して返します。
 * PKCE (Proof Key for Code Exchange) をサポートします。
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  generateAuthUrl,
  type TwitterOAuthState,
} from '@/lib/twitter/oauth';

/**
 * GET /api/twitter/auth/url
 *
 * Twitter OAuth認証URLを生成して返す
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // セッション認証チェック
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      );
    }

    // 環境変数の検証
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/twitter/auth/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Configuration Error', message: 'Twitter Client IDが設定されていません' },
        { status: 500 }
      );
    }

    // PKCE用のcode_verifierとcode_challengeを生成
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    // CSRF対策用のstateを生成
    const state = generateState();

    // OAuth認証URLを生成
    const authUrl = generateAuthUrl({
      clientId,
      redirectUri,
      state,
      codeChallenge,
    });

    // セッションにstate とcode_verifierを保存するため、レスポンスヘッダーにSet-Cookie
    const oauthState: TwitterOAuthState = {
      state,
      codeVerifier,
      createdAt: Date.now(),
    };

    // Next.js App Routerでは、cookies()を使ってCookieを設定
    const response = NextResponse.json(
      { authUrl },
      { status: 200 }
    );

    // OAuth stateをCookieに保存（HTTPOnly, Secure, 有効期限10分）
    response.cookies.set('twitter_oauth_state', JSON.stringify(oauthState), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10分
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Twitter auth URL generation error:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'サーバーエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
