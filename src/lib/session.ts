/**
 * Session Helper Utility
 *
 * このファイルはNextAuth.jsセッション取得のヘルパー関数を提供します。
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthenticationError } from '@/lib/errors';

/**
 * 現在のセッションを取得
 *
 * @returns セッション情報
 * @throws {AuthenticationError} セッションが存在しない場合
 */
export async function getSession() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new AuthenticationError('Authentication required');
  }

  return session;
}

/**
 * 現在のユーザーIDを取得
 *
 * @returns ユーザーID
 * @throws {AuthenticationError} セッションが存在しない場合
 */
export async function getCurrentUserId(): Promise<string> {
  const session = await getSession();
  return session.user.id;
}
