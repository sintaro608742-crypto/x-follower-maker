/**
 * NextAuth.js Configuration
 *
 * このファイルはNextAuth.jsの設定とヘルパー関数を提供します。
 *
 * 機能:
 * - セッション管理
 * - 認証プロバイダー設定
 * - セッション取得ヘルパー
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * NextAuth.js 設定オプション
 */
export const authOptions: NextAuthOptions = {
  // プロバイダー設定
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // データベースからユーザーを検索
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1);

          if (!user) {
            return null;
          }

          // パスワード検証
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isPasswordValid) {
            return null;
          }

          // ユーザー情報を返す
          return {
            id: user.id,
            email: user.email,
            twitter_user_id: user.twitter_user_id,
            twitter_username: user.twitter_username,
            keywords: user.keywords,
            post_frequency: user.post_frequency,
            post_times: user.post_times,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],

  // セッション設定
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },

  // JWT設定
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30日
  },

  // ページ設定
  pages: {
    signIn: '/login',
    error: '/login',
  },

  // コールバック
  callbacks: {
    async jwt({ token, user }) {
      // 初回ログイン時にユーザー情報をトークンに追加
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      // セッションにユーザー情報を追加
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },

  // デバッグ設定（開発環境のみ）
  debug: process.env.NODE_ENV === 'development',
};

/**
 * セッション型定義の拡張
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    twitter_user_id?: string | null;
    twitter_username?: string | null;
    keywords?: string[];
    post_frequency?: number;
    post_times?: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
  }
}
