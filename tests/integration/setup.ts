/**
 * Jest Setup for Integration Tests
 *
 * このファイルは統合テスト実行前に実行されます。
 * グローバルな設定やモック、環境変数の読み込みを行います。
 */

import { config } from 'dotenv';

// .env.local から環境変数を読み込む
config({ path: '.env.local' });

// データベース接続URLの確認
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not defined in .env.local. Please set it before running integration tests.'
  );
}

// タイムゾーンをUTCに設定（テストの一貫性のため）
process.env.TZ = 'UTC';

// テスト環境の確認
console.log('Integration Test Environment:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('- API_BASE_URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8432');
console.log('');
