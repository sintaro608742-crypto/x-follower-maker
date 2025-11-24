/**
 * ヘルスチェックエンドポイント
 *
 * 目的: Vercel/Cloud Runでのliveness/readinessプローブ
 * 要件:
 * - データベース接続確認（SELECT 1）
 * - HTTP 200（正常）/ 503（異常）でステータス応答
 * - 認証不要（パブリックエンドポイント）
 * - 5秒以内の応答時間
 *
 * レスポンス例:
 * {
 *   "status": "healthy",
 *   "database": "connected",
 *   "timestamp": "2025-11-21T12:00:00Z"
 * }
 */

import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/db/client';
import { logger, logError } from '@/lib/logger';

export const dynamic = 'force-dynamic'; // 常に動的レスポンス

/**
 * ヘルスチェックエンドポイント
 * GET /api/health
 *
 * 認証不要・タイムアウト5秒
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // タイムアウト処理（5秒）
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Health check timeout')), 5000)
    );

    // データベース接続確認（SELECT 1）
    const dbHealthPromise = checkDatabaseConnection();

    // タイムアウトとDB接続確認のレース
    const isHealthy = await Promise.race([dbHealthPromise, timeoutPromise]);

    if (!isHealthy) {
      // データベース接続失敗 → 503 Service Unavailable
      logger.warn('Health check failed: database disconnected');
      logger.request('GET', '/api/health', 503, Date.now() - startTime);

      return NextResponse.json(
        {
          status: 'unhealthy',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // 正常 → 200 OK
    logger.request('GET', '/api/health', 200, Date.now() - startTime);

    return NextResponse.json(
      {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    // エラー（タイムアウト含む） → 503 Service Unavailable
    logError('Health check error', error);
    logger.request('GET', '/api/health', 503, Date.now() - startTime);

    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
