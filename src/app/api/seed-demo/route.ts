import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

/**
 * デモユーザーをデータベースに作成する
 * セキュリティのため、本番環境では一度だけ実行
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[SEED-DEMO] Starting demo user creation...');

    const DEMO_USERS = [
      {
        email: 'demo@example.com',
        password: 'demo123',
      },
      {
        email: 'admin@example.com',
        password: 'admin123',
      },
    ];

    const createdUsers = [];

    for (const demoUser of DEMO_USERS) {
      // 既存ユーザーをチェック（必要なカラムのみ）
      const [existingUser] = await db
        .select({
          id: users.id,
          email: users.email,
        })
        .from(users)
        .where(eq(users.email, demoUser.email))
        .limit(1);

      if (existingUser) {
        console.log(`[SEED-DEMO] User ${demoUser.email} already exists, skipping`);
        createdUsers.push({
          email: demoUser.email,
          status: 'exists',
          id: existingUser.id,
        });
        continue;
      }

      // パスワードハッシュ化
      const hashedPassword = await bcrypt.hash(demoUser.password, 10);

      // ユーザー作成
      const [newUser] = await db
        .insert(users)
        .values({
          email: demoUser.email,
          password_hash: hashedPassword,
          keywords: ['テクノロジー', '日本'],
          post_frequency: 3,
          post_times: ['09:00', '13:00', '18:00'],
        })
        .returning();

      console.log(`[SEED-DEMO] Created user: ${newUser.email} (ID: ${newUser.id})`);

      createdUsers.push({
        email: newUser.email,
        status: 'created',
        id: newUser.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Demo users processed',
      users: createdUsers,
    });
  } catch (error) {
    console.error('[SEED-DEMO] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
