/**
 * Debug Auth Endpoint - for troubleshooting authentication issues
 * POST /api/debug-auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Step 1: Check DB connection
    const step1 = { status: 'checking database connection...' };

    // Step 2: Query user
    let user;
    let queryError;
    try {
      const result = await db
        .select({
          id: users.id,
          email: users.email,
          password_hash: users.password_hash,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      user = result[0];
    } catch (err) {
      queryError = err instanceof Error ? err.message : String(err);
    }

    if (queryError) {
      return NextResponse.json({
        step: 'query_user',
        error: queryError,
        email,
      });
    }

    if (!user) {
      return NextResponse.json({
        step: 'user_not_found',
        email,
        userFound: false,
      });
    }

    // Step 3: Check password hash exists
    if (!user.password_hash) {
      return NextResponse.json({
        step: 'no_password_hash',
        email,
        userFound: true,
        hasPasswordHash: false,
      });
    }

    // Step 4: Compare password
    let isValid;
    let compareError;
    try {
      isValid = await bcrypt.compare(password, user.password_hash);
    } catch (err) {
      compareError = err instanceof Error ? err.message : String(err);
    }

    if (compareError) {
      return NextResponse.json({
        step: 'bcrypt_compare',
        error: compareError,
        email,
        hashPrefix: user.password_hash.substring(0, 10),
      });
    }

    return NextResponse.json({
      step: 'complete',
      email,
      userFound: true,
      hasPasswordHash: true,
      hashPrefix: user.password_hash.substring(0, 10),
      passwordValid: isValid,
      bcryptVersion: 'bcryptjs',
    });
  } catch (err) {
    return NextResponse.json({
      step: 'request_parse',
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
