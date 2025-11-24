/**
 * Error Handling Utility
 *
 * このファイルはアプリケーション全体で使用するエラークラスと
 * エラーハンドリングユーティリティを提供します。
 *
 * 使用例:
 * ```typescript
 * import { AppError, handleApiError } from '@/lib/errors';
 *
 * throw new AppError('User not found', 404, 'USER_NOT_FOUND');
 * ```
 */

/**
 * アプリケーションエラーの基底クラス
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;

    // TypeScriptのビルトインErrorクラスのプロトタイプチェーンを維持
    Object.setPrototypeOf(this, AppError.prototype);

    // スタックトレースをキャプチャ
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * バリデーションエラー（400 Bad Request）
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

/**
 * 認証エラー（401 Unauthorized）
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR', true);
  }
}

/**
 * 権限エラー（403 Forbidden）
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR', true);
  }
}

/**
 * リソース未検出エラー（404 Not Found）
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND', true);
  }
}

/**
 * 競合エラー（409 Conflict）
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR', true);
  }
}

/**
 * レート制限エラー（429 Too Many Requests）
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR', true);
  }
}

/**
 * 外部サービスエラー（503 Service Unavailable）
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(
      `External service error: ${service}`,
      503,
      'EXTERNAL_SERVICE_ERROR',
      true,
      { service, originalError: originalError?.message }
    );
  }
}

/**
 * データベースエラー（500 Internal Server Error）
 */
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(
      `Database error: ${message}`,
      500,
      'DATABASE_ERROR',
      false,
      { originalError: originalError?.message }
    );
  }
}

/**
 * エラーレスポンス型
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

/**
 * エラーをErrorResponseに変換
 *
 * @param error - エラーオブジェクト
 * @param includeStack - スタックトレースを含めるか（開発環境のみ推奨）
 * @returns ErrorResponse
 */
export function toErrorResponse(error: Error | AppError, includeStack: boolean = false): ErrorResponse {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.errorCode,
        message: error.message,
        details: error.details,
        ...(includeStack && { stack: error.stack }),
      },
    };
  }

  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      ...(includeStack && { stack: error.stack }),
    },
  };
}

/**
 * APIエラーハンドラー
 *
 * Next.jsのAPIルートで使用するエラーハンドラー
 *
 * @param error - エラーオブジェクト
 * @returns ステータスコードとエラーレスポンス
 */
export function handleApiError(error: Error | AppError): {
  statusCode: number;
  body: ErrorResponse;
} {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 運用エラー（想定されたエラー）の場合
  if (error instanceof AppError && error.isOperational) {
    return {
      statusCode: error.statusCode,
      body: toErrorResponse(error, isDevelopment),
    };
  }

  // プログラミングエラー（想定外のエラー）の場合
  // 本番環境では詳細を隠す
  if (!isDevelopment && !(error instanceof AppError)) {
    console.error('Unexpected error:', error);
    return {
      statusCode: 500,
      body: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
    };
  }

  // 開発環境では全詳細を返す
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  return {
    statusCode,
    body: toErrorResponse(error, isDevelopment),
  };
}

/**
 * 非同期関数のエラーをキャッチするラッパー
 *
 * @param fn - 非同期関数
 * @returns エラーをキャッチする非同期関数
 */
export function catchAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return (await fn(...args)) as ReturnType<T>;
    } catch (error) {
      throw error;
    }
  };
}

/**
 * Zodバリデーションエラーを変換
 *
 * @param zodError - Zodエラーオブジェクト
 * @returns ValidationError
 */
export function fromZodError(zodError: { issues: Array<{ message: string; path: Array<string | number | symbol> }> }): ValidationError {
  const firstIssue = zodError.issues[0];
  const message = firstIssue?.message || 'Validation failed';
  const path = firstIssue?.path.filter((p) => typeof p === 'string' || typeof p === 'number').join('.') || '';

  return new ValidationError(
    path ? `${path}: ${message}` : message,
    { issues: zodError.issues }
  );
}

/**
 * データベースエラーを変換
 *
 * @param dbError - データベースエラーオブジェクト
 * @returns AppError
 */
export function fromDatabaseError(dbError: Error & { code?: string }): AppError {
  // PostgreSQLエラーコードに基づいた処理
  switch (dbError.code) {
    case '23505': // unique_violation
      return new ConflictError('Resource already exists');
    case '23503': // foreign_key_violation
      return new ValidationError('Referenced resource does not exist');
    case '23502': // not_null_violation
      return new ValidationError('Required field is missing');
    default:
      return new DatabaseError('Database operation failed', dbError);
  }
}

/**
 * エラーログ出力
 *
 * @param error - エラーオブジェクト
 * @param context - コンテキスト情報
 */
export function logError(error: Error | AppError, context?: Record<string, unknown>): void {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (error instanceof AppError) {
    console.error({
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      details: error.details,
      context,
      ...(isDevelopment && { stack: error.stack }),
    });
  } else {
    console.error({
      name: error.name,
      message: error.message,
      context,
      ...(isDevelopment && { stack: error.stack }),
    });
  }
}
