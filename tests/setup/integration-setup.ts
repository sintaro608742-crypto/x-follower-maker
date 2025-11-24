/**
 * Integration Test Setup
 *
 * このファイルは統合テストの初期化処理を行います。
 */

import { config } from 'dotenv';

// 環境変数を読み込み
config({ path: '.env.local' });

// テスト環境の設定
process.env.NODE_ENV = 'test';

// グローバルなテストタイムアウト設定
jest.setTimeout(30000);
