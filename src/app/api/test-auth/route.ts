/**
 * Test Auth Endpoint - for debugging authentication issues
 * DELETE THIS FILE IN PRODUCTION
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[TEST-AUTH] Testing authentication for:', email);

    // 1. ユーザーを検索
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.log('[TEST-AUTH] User not found');
      return NextResponse.json({
        success: false,
        step: 'user_lookup',
        message: 'User not found',
      });
    }

    console.log('[TEST-AUTH] User found:', { id: user.id, email: user.email });

    // 2. パスワード検証
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    console.log('[TEST-AUTH] Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        step: 'password_validation',
        message: 'Invalid password',
        debug: {
          providedPassword: password,
          hashPrefix: user.password_hash.substring(0, 20),
        },
      });
    }

    // 3. 成功
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[TEST-AUTH] Error:', error);
    return NextResponse.json({
      success: false,
      step: 'exception',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
