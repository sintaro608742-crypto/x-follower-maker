/**
 * NextAuth.js API Route Handler
 *
 * このファイルはNextAuth.jsのAPIルートハンドラーです。
 * すべての認証リクエスト (/api/auth/*) をハンドリングします。
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
