/**
 * Next.js Middleware
 *
 * シャットダウン中のリクエスト拒否
 * グレースフルシャットダウンの一部として、シャットダウン中の新規リクエストをHTTP 503で拒否
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// シャットダウン状態フラグ（環境変数で制御）
// SHUTDOWN_MODE=true の場合、全リクエストを503で拒否
const isShuttingDown = process.env.SHUTDOWN_MODE === 'true';

export function middleware(request: NextRequest) {
  // ヘルスチェックエンドポイントは常に許可（監視用）
  if (request.nextUrl.pathname === '/api/health') {
    return NextResponse.next();
  }

  // シャットダウン中の場合、503 Service Unavailableを返す
  if (isShuttingDown) {
    return NextResponse.json(
      {
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Server is shutting down, please try again later',
        },
      },
      { status: 503 }
    );
  }

  // 通常時は処理を続行
  return NextResponse.next();
}

// Middlewareの適用範囲（全てのAPIルートに適用）
export const config = {
  matcher: [
    /*
     * 以下のパスを除く全てのリクエストに適用:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
