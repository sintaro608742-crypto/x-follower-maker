/**
 * Validation Utility
 *
 * このファイルはZodを使用した入力検証ユーティリティです。
 * API仕様書と型定義に一致するバリデーションスキーマを提供します。
 *
 * 使用例:
 * ```typescript
 * import { validateKeywordUpdate } from '@/lib/validation';
 *
 * const result = validateKeywordUpdate(requestBody);
 * if (!result.success) {
 *   throw new Error(result.error.message);
 * }
 * ```
 */

import { z } from 'zod';

/**
 * メールアドレスのバリデーションスキーマ
 */
export const emailSchema = z.string().email('Invalid email address').max(255);

/**
 * パスワードのバリデーションスキーマ
 * 最小8文字、英数字混在
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(255, 'Password must be less than 255 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * キーワード配列のバリデーションスキーマ
 * 1-3個、各50文字以内
 */
export const keywordsSchema = z
  .array(z.string().min(1).max(50, 'Each keyword must be less than 50 characters'))
  .min(1, 'At least one keyword is required')
  .max(3, 'Maximum 3 keywords allowed');

/**
 * 投稿頻度のバリデーションスキーマ
 * 1-5の整数
 */
export const postFrequencySchema = z
  .number()
  .int('Post frequency must be an integer')
  .min(1, 'Post frequency must be at least 1')
  .max(5, 'Post frequency must be at most 5');

/**
 * 投稿時間帯のバリデーションスキーマ
 * HH:MM形式の文字列配列
 */
export const postTimesSchema = z
  .array(
    z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:MM format')
  )
  .min(1, 'At least one post time is required');

/**
 * 投稿内容のバリデーションスキーマ
 * 1-280文字（日本語含む）
 */
export const postContentSchema = z
  .string()
  .min(1, 'Post content is required')
  .max(280, 'Post content must be less than 280 characters');

/**
 * 日時のバリデーションスキーマ
 * ISO8601形式、現在時刻以降
 */
export const scheduledAtSchema = z
  .string()
  .datetime('Invalid datetime format. Use ISO8601 format')
  .refine(
    (dateStr) => new Date(dateStr) > new Date(),
    'Scheduled time must be in the future'
  );

/**
 * UUID形式のバリデーションスキーマ
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

// ===== API Request バリデーションスキーマ =====

/**
 * キーワード設定更新リクエストのバリデーション
 */
export const keywordUpdateRequestSchema = z.object({
  keywords: keywordsSchema,
});

/**
 * 自動投稿ソースIDのバリデーションスキーマ
 * UUID形式の文字列配列（オプション）
 */
export const autoPostSourceIdsSchema = z
  .array(uuidSchema)
  .optional();

/**
 * 投稿スケジュール更新リクエストのバリデーション
 */
export const postScheduleUpdateRequestSchema = z.object({
  post_frequency: postFrequencySchema,
  post_times: postTimesSchema,
  auto_post_source_ids: autoPostSourceIdsSchema,
});

/**
 * 投稿更新リクエストのバリデーション
 */
export const postUpdateRequestSchema = z.object({
  post_id: uuidSchema,
  content: postContentSchema.optional(),
  scheduled_at: scheduledAtSchema.optional(),
  is_approved: z.boolean().optional(),
});

/**
 * 手動投稿作成リクエストのバリデーション
 */
export const postCreateRequestSchema = z.object({
  content: postContentSchema,
  scheduled_at: scheduledAtSchema,
});

/**
 * ログインリクエストのバリデーション
 */
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * サインアップリクエストのバリデーション
 */
export const signupRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * X連携解除リクエストのバリデーション
 */
export const twitterDisconnectRequestSchema = z.object({
  user_id: uuidSchema,
});

// ===== ヘルパー関数 =====

/**
 * リクエストボディを検証
 *
 * @param schema - Zodバリデーションスキーマ
 * @param data - 検証するデータ
 * @returns 検証結果
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    issues: z.ZodIssue[];
  };
} {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: {
        message: result.error.issues[0]?.message || 'Validation failed',
        issues: result.error.issues,
      },
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * キーワード設定更新リクエストを検証
 */
export function validateKeywordUpdate(data: unknown) {
  return validate(keywordUpdateRequestSchema, data);
}

/**
 * 投稿スケジュール更新リクエストを検証
 */
export function validatePostScheduleUpdate(data: unknown) {
  return validate(postScheduleUpdateRequestSchema, data);
}

/**
 * 投稿更新リクエストを検証
 */
export function validatePostUpdate(data: unknown) {
  return validate(postUpdateRequestSchema, data);
}

/**
 * 手動投稿作成リクエストを検証
 */
export function validatePostCreate(data: unknown) {
  return validate(postCreateRequestSchema, data);
}

/**
 * ログインリクエストを検証
 */
export function validateLogin(data: unknown) {
  return validate(loginRequestSchema, data);
}

/**
 * サインアップリクエストを検証
 */
export function validateSignup(data: unknown) {
  return validate(signupRequestSchema, data);
}

/**
 * X連携解除リクエストを検証
 */
export function validateTwitterDisconnect(data: unknown) {
  return validate(twitterDisconnectRequestSchema, data);
}
