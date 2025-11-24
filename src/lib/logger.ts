/**
 * 構造化ロガー
 *
 * 本番環境でのエラー追跡とデバッグを支援する構造化ログシステム
 * Vercel Logsに最適化された形式で出力
 *
 * 使用例:
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * logger.info('User logged in', { userId: '123' });
 * logger.error('API call failed', { error, endpoint: '/api/posts' });
 * ```
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private minLevel: LogLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

  /**
   * ログレベルの数値表現（比較用）
   */
  private levelValue(level: LogLevel): number {
    const levels: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3,
    };
    return levels[level];
  }

  /**
   * ログエントリを作成
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    return entry;
  }

  /**
   * ログを出力
   */
  private log(entry: LogEntry): void {
    if (this.levelValue(entry.level) < this.levelValue(this.minLevel)) {
      return; // ログレベルが低い場合はスキップ
    }

    // 本番環境: JSON形式で出力（Vercel Logsで解析しやすい）
    if (!this.isDevelopment) {
      console.log(JSON.stringify(entry));
      return;
    }

    // 開発環境: 読みやすい形式で出力
    const levelEmoji: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '🐛',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '❌',
    };

    const emoji = levelEmoji[entry.level];
    const timestamp = new Date(entry.timestamp).toLocaleTimeString('ja-JP');
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const errorStr = entry.error ? `\n  Error: ${entry.error.message}\n  ${entry.error.stack}` : '';

    console.log(`${emoji} [${entry.level}] ${timestamp} - ${entry.message}${contextStr}${errorStr}`);
  }

  /**
   * DEBUGレベルログ（開発環境のみ）
   */
  debug(message: string, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevel.DEBUG, message, context));
  }

  /**
   * INFOレベルログ
   */
  info(message: string, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevel.INFO, message, context));
  }

  /**
   * WARNレベルログ
   */
  warn(message: string, context?: LogContext, error?: Error): void {
    this.log(this.createLogEntry(LogLevel.WARN, message, context, error));
  }

  /**
   * ERRORレベルログ
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.log(this.createLogEntry(LogLevel.ERROR, message, context, error));
  }

  /**
   * リクエストログ（APIエンドポイント用）
   */
  request(method: string, path: string, statusCode: number, duration: number): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(
      this.createLogEntry(level, `${method} ${path} ${statusCode}`, {
        method,
        path,
        statusCode,
        duration,
      })
    );
  }
}

/**
 * グローバルロガーインスタンス
 */
export const logger = new Logger();

/**
 * ミドルウェア用: リクエストロガー
 * 各APIエンドポイントの冒頭で使用
 *
 * 使用例:
 * ```typescript
 * const startTime = Date.now();
 * // ... API処理 ...
 * logger.request('GET', '/api/posts', 200, Date.now() - startTime);
 * ```
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  startTime: number
): void {
  const duration = Date.now() - startTime;
  logger.request(method, path, statusCode, duration);
}

/**
 * エラーログヘルパー
 * try-catchブロックで使用
 *
 * 使用例:
 * ```typescript
 * try {
 *   // ... 処理 ...
 * } catch (error) {
 *   logError('Failed to process request', error, { userId: '123' });
 *   throw error;
 * }
 * ```
 */
export function logError(message: string, error: unknown, context?: LogContext): void {
  if (error instanceof Error) {
    logger.error(message, context, error);
  } else {
    logger.error(message, { ...context, error: String(error) });
  }
}
