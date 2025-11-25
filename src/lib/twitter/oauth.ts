/**
 * Twitter OAuth 2.0 Utility (PKCE対応)
 *
 * Twitter API v2のOAuth 2.0認証を実装します。
 * PKCE (Proof Key for Code Exchange)をサポートします。
 *
 * 参考: https://developer.twitter.com/en/docs/authentication/oauth-2-0
 */

import crypto from 'crypto';

/**
 * PKCE用のcode_verifierを生成
 *
 * @returns {string} Base64 URL-safe文字列（43-128文字）
 */
export function generateCodeVerifier(): string {
  return crypto
    .randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * code_verifierからcode_challengeを生成
 *
 * @param {string} verifier - code_verifier
 * @returns {string} SHA256ハッシュのBase64 URL-safe文字列
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * CSRF対策用のstateパラメータを生成
 *
 * @returns {string} ランダムな文字列
 */
export function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Twitter OAuth 2.0認証URLを生成
 *
 * @param {object} params - 認証URLパラメータ
 * @param {string} params.clientId - Twitter Client ID
 * @param {string} params.redirectUri - リダイレクトURI
 * @param {string} params.state - CSRF対策用state
 * @param {string} params.codeChallenge - PKCE用code_challenge
 * @returns {string} Twitter OAuth認証URL
 */
export function generateAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const { clientId, redirectUri, state, codeChallenge } = params;

  const authParams = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: [
      'tweet.read',
      'tweet.write',
      'users.read',
      'offline.access', // リフレッシュトークン取得用
    ].join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `https://twitter.com/i/oauth2/authorize?${authParams.toString()}`;
}

/**
 * 認証コードをアクセストークンに交換
 *
 * @param {object} params - トークン交換パラメータ
 * @param {string} params.code - 認証コード
 * @param {string} params.codeVerifier - PKCE用code_verifier
 * @param {string} params.clientId - Twitter Client ID
 * @param {string} params.redirectUri - リダイレクトURI
 * @returns {Promise<TwitterTokenResponse>} トークンレスポンス
 */
export async function exchangeCodeForToken(params: {
  code: string;
  codeVerifier: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<TwitterTokenResponse> {
  const { code, codeVerifier, clientId, clientSecret, redirectUri } = params;

  const tokenParams = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: tokenParams.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token exchange failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * リフレッシュトークンで新しいアクセストークンを取得
 *
 * @param {object} params - リフレッシュトークンパラメータ
 * @param {string} params.refreshToken - リフレッシュトークン
 * @param {string} params.clientId - Twitter Client ID
 * @param {string} params.clientSecret - Twitter Client Secret
 * @returns {Promise<TwitterTokenResponse>} トークンレスポンス
 */
export async function refreshAccessToken(params: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<TwitterTokenResponse> {
  const { refreshToken, clientId, clientSecret } = params;

  const tokenParams = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    client_id: clientId,
  });

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: tokenParams.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token refresh failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Twitter Token Response型
 */
export interface TwitterTokenResponse {
  token_type: 'bearer';
  expires_in: number;
  access_token: string;
  refresh_token?: string;
  scope: string;
}

/**
 * Twitter OAuth State (セッションに保存)
 */
export interface TwitterOAuthState {
  state: string;
  codeVerifier: string;
  createdAt: number;
}
