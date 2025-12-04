/**
 * User Signup API Route
 *
 * POST /api/auth/signup
 * ユーザー登録エンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { ValidationError, ConflictError } from '@/lib/errors';

interface SignupRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();

    // バリデーション
    if (!body.email || !body.password) {
      throw new ValidationError('Email and password are required');
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      throw new ValidationError('Invalid email format');
    }

    // パスワード長チェック
    if (body.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // 既存ユーザーチェック（必要なカラムのみ）
    const [existingUser] = await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (existingUser) {
      throw new ConflictError('このメールアドレスは既に登録されています');
    }

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(body.password, 10);

    // ユーザー作成
    const [newUser] = await db
      .insert(users)
      .values({
        email: body.email,
        password_hash: passwordHash,
        keywords: [],
        post_frequency: 3,
        post_times: ['09:00', '12:00', '18:00'],
      })
      .returning();

    // パスワードハッシュを除外してレスポンス
    const { password_hash: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
      );
    }

    if (error instanceof ConflictError) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: error.message } },
        { status: 409 }
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
