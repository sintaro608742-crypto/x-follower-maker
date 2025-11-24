/**
 * Neon PostgreSQL Database Client
 *
 * このファイルはDrizzle ORMを使用したPostgreSQLデータベース接続を提供します。
 * Neon のサーバーレス PostgreSQL を使用します。
 *
 * 環境変数:
 * - DATABASE_URL: PostgreSQL接続文字列（必須）
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { config } from 'dotenv';

// 環境変数を確実にロード（.env.localが存在する場合）
if (typeof process.env.DATABASE_URL === 'undefined') {
  config({ path: '.env.local' });
}

// 環境変数の検証
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not defined. ' +
    'Please set it in your .env.local file.'
  );
}

/**
 * PostgreSQL接続クライアント
 * Neon サーバーレスドライバーを使用
 */
const client = postgres(process.env.DATABASE_URL, {
  max: 10, // 最大接続数（Neon Free Tierに適した設定）
  idle_timeout: 20, // アイドルタイムアウト（秒）
  connect_timeout: 10, // 接続タイムアウト（秒）
  ssl: 'require', // SSL接続必須（Neonの要件）
});

/**
 * Drizzle ORM データベースインスタンス
 *
 * 使用例:
 * ```typescript
 * import { db } from '@/db/client';
 * const users = await db.select().from(schema.users);
 * ```
 */
export const db = drizzle(client, { schema });

/**
 * データベース接続のヘルスチェック
 *
 * @returns {Promise<boolean>} 接続が正常な場合true
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

/**
 * データベース接続を安全にクローズ
 * グレースフルシャットダウン時に使用
 */
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await client.end();
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}
