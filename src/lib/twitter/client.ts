/**
 * Twitter API v2 Client
 *
 * twitter-api-v2ライブラリを使用してTwitter APIを操作します。
 */

import { TwitterApi } from 'twitter-api-v2';
import { decrypt, encrypt } from '../encryption';
import { refreshAccessToken } from './oauth';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * ユーザーのアクセストークンでTwitter APIクライアントを作成
 *
 * @param encryptedAccessToken - 暗号化されたアクセストークン
 * @returns TwitterApi インスタンス
 */
export function createUserClient(encryptedAccessToken: string): TwitterApi {
  const accessToken = decrypt(encryptedAccessToken);
  return new TwitterApi(accessToken);
}

/**
 * ユーザーのリフレッシュトークンを使ってアクセストークンを更新し、
 * 新しいTwitter APIクライアントを作成
 *
 * @param userId - ユーザーID
 * @param encryptedRefreshToken - 暗号化されたリフレッシュトークン
 * @returns TwitterApi インスタンス
 */
export async function createRefreshedUserClient(
  userId: string,
  encryptedRefreshToken: string
): Promise<TwitterApi> {
  const clientId = process.env.TWITTER_CLIENT_ID?.trim();
  const clientSecret = process.env.TWITTER_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error('Twitter credentials not configured');
  }

  // リフレッシュトークンを復号化
  const refreshToken = decrypt(encryptedRefreshToken);

  // 新しいアクセストークンを取得
  console.log('[Twitter] Refreshing access token for user:', userId);
  const tokenResponse = await refreshAccessToken({
    refreshToken,
    clientId,
    clientSecret,
  });

  // 新しいトークンを暗号化してDBに保存
  const encryptedAccessToken = encrypt(tokenResponse.access_token);
  const encryptedNewRefreshToken = tokenResponse.refresh_token
    ? encrypt(tokenResponse.refresh_token)
    : encryptedRefreshToken; // 新しいリフレッシュトークンがなければ既存を使用

  await db
    .update(users)
    .set({
      twitter_access_token_encrypted: encryptedAccessToken,
      twitter_refresh_token_encrypted: encryptedNewRefreshToken,
      updated_at: new Date(),
    })
    .where(eq(users.id, userId));

  console.log('[Twitter] Token refreshed and saved for user:', userId);

  return new TwitterApi(tokenResponse.access_token);
}

/**
 * Bearer Tokenでread-onlyクライアントを作成
 *
 * @returns TwitterApi インスタンス
 */
export function createAppClient(): TwitterApi {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    throw new Error('TWITTER_BEARER_TOKEN is not defined');
  }
  return new TwitterApi(bearerToken);
}

/**
 * ツイートを投稿
 *
 * @param client - TwitterApiクライアント
 * @param text - ツイート本文
 * @returns ツイートID
 */
export async function postTweet(
  client: TwitterApi,
  text: string
): Promise<string> {
  try {
    const result = await client.v2.tweet(text);
    return result.data.id;
  } catch (error) {
    console.error('Post tweet error:', error);
    throw new Error(
      `Failed to post tweet: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * ユーザー情報を取得
 *
 * @param client - TwitterApiクライアント
 * @param userId - ユーザーID
 * @returns ユーザー情報
 */
export async function getUserInfo(
  client: TwitterApi,
  userId: string
): Promise<TwitterUserInfo> {
  try {
    const result = await client.v2.user(userId, {
      'user.fields': ['public_metrics', 'username'],
    });

    return {
      id: result.data.id,
      username: result.data.username || '',
      followerCount: result.data.public_metrics?.followers_count || 0,
      followingCount: result.data.public_metrics?.following_count || 0,
    };
  } catch (error) {
    console.error('Get user info error:', error);
    throw new Error(
      `Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * 認証済みユーザーの情報を取得
 *
 * @param client - TwitterApiクライアント
 * @returns 認証済みユーザー情報
 */
export async function getAuthenticatedUserInfo(
  client: TwitterApi
): Promise<TwitterUserInfo> {
  try {
    const result = await client.v2.me({
      'user.fields': ['public_metrics', 'username'],
    });

    return {
      id: result.data.id,
      username: result.data.username || '',
      followerCount: result.data.public_metrics?.followers_count || 0,
      followingCount: result.data.public_metrics?.following_count || 0,
    };
  } catch (error) {
    console.error('Get authenticated user info error:', error);
    throw new Error(
      `Failed to get authenticated user info: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Twitter User Info型
 */
export interface TwitterUserInfo {
  id: string;
  username: string;
  followerCount: number;
  followingCount: number;
}
