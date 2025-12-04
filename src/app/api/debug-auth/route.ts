/**
 * Debug Auth Endpoint - for troubleshooting authentication issues
 * POST /api/debug-auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, checkDatabaseConnection } from '@/db/client';
import { users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const results: Record<string, unknown> = {};

  try {
    const body = await request.json();
    const { email, password } = body;
    results.email = email;

    // Step 1: Test basic DB connection
    try {
      const connected = await checkDatabaseConnection();
      results.step1_db_connect = connected ? 'OK' : 'FAILED';
    } catch (err) {
      results.step1_db_connect_error = err instanceof Error ? err.message : String(err);
    }

    // Step 2: Test raw SQL query
    try {
      const rawResult = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      results.step2_raw_count = rawResult;
    } catch (err) {
      results.step2_raw_error = err instanceof Error ? err.message : String(err);
    }

    // Step 3: Test Drizzle select (minimal columns)
    try {
      const minResult = await db
        .select({
          id: users.id,
          email: users.email,
        })
        .from(users)
        .limit(1);
      results.step3_drizzle_min = minResult.length > 0 ? 'OK' : 'NO_USERS';
    } catch (err) {
      results.step3_drizzle_min_error = err instanceof Error ? err.message : String(err);
    }

    // Step 4: Test Drizzle select with specific columns (not all)
    try {
      const fullResult = await db
        .select({
          id: users.id,
          email: users.email,
          password_hash: users.password_hash,
        })
        .from(users)
        .where(eq(users.email, email || 'test@example.com'))
        .limit(1);
      results.step4_drizzle_full = fullResult.length > 0 ? 'FOUND' : 'NOT_FOUND';
      if (fullResult.length > 0) {
        results.step4_user_id = fullResult[0].id;
        results.step4_has_hash = !!fullResult[0].password_hash;
      }
    } catch (err) {
      results.step4_drizzle_full_error = err instanceof Error ? err.message : String(err);
    }

    // Step 5: If we got user, test password
    if (results.step4_drizzle_full === 'FOUND' && password) {
      try {
        const [user] = await db
          .select({
            id: users.id,
            password_hash: users.password_hash,
          })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (user && user.password_hash) {
          const isValid = await bcrypt.compare(password, user.password_hash);
          results.step5_password_valid = isValid;
        }
      } catch (err) {
        results.step5_bcrypt_error = err instanceof Error ? err.message : String(err);
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
      results,
    });
  }
}
