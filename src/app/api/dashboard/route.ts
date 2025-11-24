/**
 * Dashboard API Route
 *
 * GET /api/dashboard
 * ダッシュボード画面に必要な全データを一括取得
 *
 * 認証: 必須
 * Request: なし
 * Response: DashboardData
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { getDashboardData } from '@/services/dashboard.service';
import { handleApiError } from '@/lib/errors';

/**
 * GET /api/dashboard
 *
 * ダッシュボードデータを取得
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // セッション認証
    const userId = await getCurrentUserId();

    // ダッシュボードデータ取得
    const dashboardData = await getDashboardData(userId);

    // 成功レスポンス
    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    // エラーハンドリング
    const { statusCode, body } = handleApiError(error as Error);
    return NextResponse.json(body, { status: statusCode });
  }
}
