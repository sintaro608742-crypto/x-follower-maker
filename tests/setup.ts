/**
 * Jest Setup File
 *
 * 統合テスト実行前の共通セットアップ
 * - 環境変数のロード
 * - データベース接続の確認
 */

import { config } from 'dotenv';
import { checkDatabaseConnection } from '@/db/client';

// 環境変数をロード
config({ path: '.env.local' });

// テスト実行前にデータベース接続を確認
beforeAll(async () => {
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    throw new Error('Database connection failed. Please check DATABASE_URL in .env.local');
  }
});

// グローバルタイムアウト設定
jest.setTimeout(30000); // 30秒
