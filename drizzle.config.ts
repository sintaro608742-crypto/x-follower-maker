/**
 * Drizzle ORM 設定ファイル
 *
 * このファイルはDrizzle Kitのマイグレーション設定を定義します。
 *
 * 使用方法:
 * - スキーマ変更をDBに反映: npm run db:push
 * - マイグレーションファイル生成: npm run db:generate
 * - マイグレーション実行: npm run db:migrate
 * - Drizzle Studio起動: npm run db:studio
 */

import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// .env.localから環境変数を読み込み
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not defined. ' +
    'Please set it in your .env.local file.'
  );
}

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
