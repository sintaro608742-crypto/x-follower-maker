/**
 * Jest Configuration for Integration Tests
 *
 * このファイルは統合テストのJest設定を定義します。
 */

/** @type {import('jest').Config} */
const config = {
  // TypeScriptサポート
  preset: 'ts-jest',
  testEnvironment: 'node',

  // テストファイルのパターン
  testMatch: [
    '**/tests/integration/**/*.test.ts',
    '**/tests/integration/**/*.spec.ts',
  ],

  // モジュール解決
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // カバレッジ設定
  collectCoverageFrom: [
    'src/app/api/**/*.ts',
    'src/lib/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
  ],

  // タイムアウト設定（統合テストは時間がかかる）
  testTimeout: 30000,

  // 並列実行を無効化（データベースの競合を避ける）
  maxWorkers: 1,

  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],

  // 詳細な出力
  verbose: true,

  // トランスフォーム設定
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
};

module.exports = config;
