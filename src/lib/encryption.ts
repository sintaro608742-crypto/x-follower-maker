/**
 * Encryption Utility (AES-256-GCM)
 *
 * このファイルはTwitter APIトークンを暗号化・復号化するユーティリティです。
 * AES-256-GCMアルゴリズムを使用して、データベースに保存するトークンを暗号化します。
 *
 * 環境変数:
 * - ENCRYPTION_KEY: 32バイトのランダム文字列（Base64エンコード）
 *
 * 使用例:
 * ```typescript
 * import { encrypt, decrypt } from '@/lib/encryption';
 *
 * const accessToken = 'twitter_access_token_value';
 * const encrypted = encrypt(accessToken);
 * const decrypted = decrypt(encrypted);
 * ```
 */

import crypto from 'crypto';

// 環境変数の検証
if (!process.env.ENCRYPTION_KEY) {
  throw new Error(
    'ENCRYPTION_KEY environment variable is not defined. ' +
    'Please set it in your .env.local file. ' +
    'Generate with: openssl rand -base64 32'
  );
}

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 初期化ベクトル長（バイト）
const AUTH_TAG_LENGTH = 16; // 認証タグ長（バイト）

/**
 * データを暗号化
 *
 * @param text - 暗号化する平文
 * @returns 暗号化されたデータ（iv:authTag:encrypted の形式）
 */
export function encrypt(text: string): string {
  try {
    // ランダムなIV（初期化ベクトル）を生成
    const iv = crypto.randomBytes(IV_LENGTH);

    // 暗号化器を作成
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    // データを暗号化
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // 認証タグを取得
    const authTag = cipher.getAuthTag();

    // iv:authTag:encrypted の形式で返却
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * データを復号化
 *
 * @param encryptedText - 暗号化されたデータ（iv:authTag:encrypted の形式）
 * @returns 復号化された平文
 */
export function decrypt(encryptedText: string): string {
  try {
    // iv:authTag:encrypted を分割
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // HEX文字列をBufferに変換
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // 復号化器を作成
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    // データを復号化
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * パスワードをハッシュ化
 *
 * @param password - 平文パスワード
 * @returns bcryptハッシュ
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * パスワードを検証
 *
 * @param password - 平文パスワード
 * @param hash - bcryptハッシュ
 * @returns パスワードが一致する場合true
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

/**
 * ランダムな暗号化キーを生成（初回セットアップ用）
 *
 * @returns Base64エンコードされた32バイトのランダムキー
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}
