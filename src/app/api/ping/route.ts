/**
 * Ultra simple ping endpoint for testing
 * No imports, no dependencies
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ message: 'pong' }, { status: 200 });
}
