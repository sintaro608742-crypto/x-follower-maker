/**
 * Next.js Instrumentation
 *
 * グレースフルシャットダウンの実装
 * 目的: デプロイ時のリクエストドロップ防止
 *
 * 要件:
 * - SIGTERMシグナルハンドラーの実装
 * - シャットダウン中の新規リクエスト拒否（HTTP 503）
 * - 進行中のリクエスト完了まで待機
 * - データベース接続の安全なクローズ
 * - タイムアウト: 8秒
 */

import { closeDatabaseConnection } from './src/db/client';
import { logger, logError } from './src/lib/logger';

// グローバルシャットダウン状態フラグ
let isShuttingDown = false;

/**
 * サーバー起動時に実行される
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    logger.info('Server starting...');

    // SIGTERMシグナルハンドラー（Vercel/Cloud Runでのグレースフルシャットダウン）
    process.on('SIGTERM', async () => {
      logger.warn('SIGTERM received, starting graceful shutdown...');
      isShuttingDown = true;

      // タイムアウト設定（8秒）
      const shutdownTimeout = setTimeout(() => {
        logger.error('Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, 8000);

      try {
        // データベース接続を安全にクローズ
        logger.info('Closing database connections...');
        await closeDatabaseConnection();

        logger.info('Graceful shutdown completed');
        clearTimeout(shutdownTimeout);
        process.exit(0);
      } catch (error) {
        logError('Error during graceful shutdown', error);
        clearTimeout(shutdownTimeout);
        process.exit(1);
      }
    });

    // SIGINTシグナルハンドラー（Ctrl+Cでの停止）
    process.on('SIGINT', async () => {
      logger.warn('SIGINT received, starting graceful shutdown...');
      isShuttingDown = true;

      try {
        await closeDatabaseConnection();
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logError('Error during graceful shutdown', error);
        process.exit(1);
      }
    });

    // 未処理のPromise拒否エラーハンドリング
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { promise: String(promise), reason: String(reason) });
    });

    // 未処理の例外エラーハンドリング
    process.on('uncaughtException', (error) => {
      logError('Uncaught Exception', error);
      process.exit(1);
    });

    logger.info('Graceful shutdown handlers registered');
  }
}

/**
 * シャットダウン状態を確認
 * middleware.tsやAPIルートで使用可能
 */
export function isServerShuttingDown(): boolean {
  return isShuttingDown;
}
