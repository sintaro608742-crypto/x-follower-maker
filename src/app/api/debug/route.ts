/**
 * Debug API endpoint
 * 本番環境のデバッグ用（環境変数確認）
 */

import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Get column info from database
    let columns: string[] = [];
    let columnError: string | undefined;
    try {
      const result = await db.execute(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);
      columns = (result as unknown as { column_name: string }[]).map(r => r.column_name);
    } catch (err) {
      columnError = err instanceof Error ? err.message : String(err);
    }

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
      usersTableColumns: columns,
      columnError,
      hasAutoPostSourceIds: columns.includes('auto_post_source_ids'),
    };

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
