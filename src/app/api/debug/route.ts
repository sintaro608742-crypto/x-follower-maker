/**
 * Debug API endpoint
 * 本番環境のデバッグ用（環境変数確認）
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const debugInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      vercelEnv: process.env.VERCEL,
      nextRuntime: process.env.NEXT_RUNTIME,
      hasDatabase: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
      envKeys: Object.keys(process.env).filter(k =>
        k.startsWith('DATABASE') ||
        k.startsWith('NEXT') ||
        k.startsWith('VERCEL') ||
        k.startsWith('TWITTER') ||
        k.startsWith('GEMINI')
      ),
    };

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
