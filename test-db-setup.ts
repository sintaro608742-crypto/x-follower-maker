/**
 * Database Setup Test Script
 *
 * このスクリプトはデータベース接続とスキーマを検証します。
 * マイグレーションの実行確認とCRUD操作のテストを行います。
 */

// 環境変数を最初にロード（他のインポートより前）
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db, checkDatabaseConnection } from './src/db/client';
import { users, posts, followerStats } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, encrypt, decrypt } from './src/lib/encryption';

interface TestResult {
  name: string;
  status: 'PASSED' | 'FAILED';
  message: string;
  error?: string;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('='.repeat(60));
  console.log('Xフォロワーメーカー - データベース基盤テスト');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Database Connection
  try {
    console.log('[1/7] データベース接続テスト...');
    const isConnected = await checkDatabaseConnection();
    if (isConnected) {
      results.push({
        name: 'データベース接続',
        status: 'PASSED',
        message: 'Neon PostgreSQLに正常に接続しました',
      });
      console.log('✓ PASSED: データベース接続成功\n');
    } else {
      throw new Error('接続失敗');
    }
  } catch (error) {
    results.push({
      name: 'データベース接続',
      status: 'FAILED',
      message: 'データベース接続に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('✗ FAILED: データベース接続失敗\n');
  }

  // Test 2: Encryption/Decryption
  try {
    console.log('[2/7] 暗号化ユーティリティテスト...');
    const testToken = 'test_twitter_access_token_12345';
    const encrypted = encrypt(testToken);
    const decrypted = decrypt(encrypted);

    if (decrypted === testToken) {
      results.push({
        name: '暗号化ユーティリティ',
        status: 'PASSED',
        message: 'AES-256-GCM暗号化/復号化が正常に動作しました',
      });
      console.log('✓ PASSED: 暗号化/復号化成功\n');
    } else {
      throw new Error('復号化結果が一致しません');
    }
  } catch (error) {
    results.push({
      name: '暗号化ユーティリティ',
      status: 'FAILED',
      message: '暗号化/復号化に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('✗ FAILED: 暗号化/復号化失敗\n');
  }

  // Test 3: Password Hashing
  try {
    console.log('[3/7] パスワードハッシュテスト...');
    const { hashPassword, verifyPassword } = await import('./src/lib/encryption');
    const testPassword = 'TestPassword123!';
    const hashed = await hashPassword(testPassword);
    const isValid = await verifyPassword(testPassword, hashed);

    if (isValid) {
      results.push({
        name: 'パスワードハッシュ',
        status: 'PASSED',
        message: 'bcryptハッシュ化が正常に動作しました',
      });
      console.log('✓ PASSED: パスワードハッシュ成功\n');
    } else {
      throw new Error('パスワード検証失敗');
    }
  } catch (error) {
    results.push({
      name: 'パスワードハッシュ',
      status: 'FAILED',
      message: 'パスワードハッシュに失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('✗ FAILED: パスワードハッシュ失敗\n');
  }

  // Test 4: User CRUD Operations
  let testUserId: string | null = null;
  try {
    console.log('[4/7] Userテーブル CRUD テスト...');
    const testEmail = `test-${Date.now()}@test.local`;
    const passwordHash = await hashPassword('TestPassword123!');

    // Create
    const [newUser] = await db.insert(users).values({
      email: testEmail,
      password_hash: passwordHash,
      keywords: ['テスト', 'プログラミング'],
      post_frequency: 4,
      post_times: ['09:00', '12:00', '18:00', '21:00'],
    }).returning();

    testUserId = newUser.id;

    // Read
    const [fetchedUser] = await db.select().from(users).where(eq(users.id, testUserId));

    // Update
    await db.update(users).set({ keywords: ['更新済み'] }).where(eq(users.id, testUserId));
    const [updatedUser] = await db.select().from(users).where(eq(users.id, testUserId));

    if (newUser && fetchedUser && updatedUser && updatedUser.keywords[0] === '更新済み') {
      results.push({
        name: 'Userテーブル CRUD',
        status: 'PASSED',
        message: 'User作成・読み取り・更新が正常に動作しました',
      });
      console.log('✓ PASSED: User CRUD操作成功\n');
    } else {
      throw new Error('CRUD操作の検証失敗');
    }
  } catch (error) {
    results.push({
      name: 'Userテーブル CRUD',
      status: 'FAILED',
      message: 'User CRUD操作に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('✗ FAILED: User CRUD操作失敗\n');
  }

  // Test 5: Post CRUD Operations
  try {
    console.log('[5/7] Postテーブル CRUD テスト...');
    if (!testUserId) {
      throw new Error('テストユーザーIDが存在しません');
    }

    // Create
    const [newPost] = await db.insert(posts).values({
      user_id: testUserId,
      content: 'これはテスト投稿です',
      scheduled_at: new Date(Date.now() + 3600000), // 1時間後
      is_approved: true,
      is_manual: false,
      status: 'scheduled',
    }).returning();

    // Read
    const [fetchedPost] = await db.select().from(posts).where(eq(posts.id, newPost.id));

    // Update
    await db.update(posts).set({ status: 'posted' }).where(eq(posts.id, newPost.id));
    const [updatedPost] = await db.select().from(posts).where(eq(posts.id, newPost.id));

    if (newPost && fetchedPost && updatedPost && updatedPost.status === 'posted') {
      results.push({
        name: 'Postテーブル CRUD',
        status: 'PASSED',
        message: 'Post作成・読み取り・更新が正常に動作しました',
      });
      console.log('✓ PASSED: Post CRUD操作成功\n');
    } else {
      throw new Error('CRUD操作の検証失敗');
    }

    // Delete post after test
    await db.delete(posts).where(eq(posts.user_id, testUserId));
  } catch (error) {
    results.push({
      name: 'Postテーブル CRUD',
      status: 'FAILED',
      message: 'Post CRUD操作に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('✗ FAILED: Post CRUD操作失敗\n');
  }

  // Test 6: FollowerStats CRUD Operations
  try {
    console.log('[6/7] FollowerStatsテーブル CRUD テスト...');
    if (!testUserId) {
      throw new Error('テストユーザーIDが存在しません');
    }

    // Create
    const [newStats] = await db.insert(followerStats).values({
      user_id: testUserId,
      follower_count: 100,
      following_count: 50,
    }).returning();

    // Read
    const [fetchedStats] = await db.select().from(followerStats).where(eq(followerStats.id, newStats.id));

    if (newStats && fetchedStats && fetchedStats.follower_count === 100) {
      results.push({
        name: 'FollowerStatsテーブル CRUD',
        status: 'PASSED',
        message: 'FollowerStats作成・読み取りが正常に動作しました',
      });
      console.log('✓ PASSED: FollowerStats CRUD操作成功\n');
    } else {
      throw new Error('CRUD操作の検証失敗');
    }

    // Delete follower stats after test
    await db.delete(followerStats).where(eq(followerStats.user_id, testUserId));
  } catch (error) {
    results.push({
      name: 'FollowerStatsテーブル CRUD',
      status: 'FAILED',
      message: 'FollowerStats CRUD操作に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('✗ FAILED: FollowerStats CRUD操作失敗\n');
  }

  // Test 7: Cleanup - Delete test user
  try {
    console.log('[7/7] テストデータクリーンアップ...');
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
      results.push({
        name: 'クリーンアップ',
        status: 'PASSED',
        message: 'テストデータを正常に削除しました',
      });
      console.log('✓ PASSED: クリーンアップ成功\n');
    }
  } catch (error) {
    results.push({
      name: 'クリーンアップ',
      status: 'FAILED',
      message: 'テストデータの削除に失敗しました',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.log('✗ FAILED: クリーンアップ失敗\n');
  }

  // Print Summary
  console.log('='.repeat(60));
  console.log('テスト結果サマリー');
  console.log('='.repeat(60));
  console.log('');

  const passedCount = results.filter(r => r.status === 'PASSED').length;
  const failedCount = results.filter(r => r.status === 'FAILED').length;
  const totalCount = results.length;

  results.forEach((result, index) => {
    const icon = result.status === 'PASSED' ? '✓' : '✗';
    const status = result.status === 'PASSED' ? '\x1b[32mPASSED\x1b[0m' : '\x1b[31mFAILED\x1b[0m';
    console.log(`${icon} [${index + 1}/${totalCount}] ${result.name}: ${status}`);
    console.log(`   ${result.message}`);
    if (result.error) {
      console.log(`   エラー: ${result.error}`);
    }
    console.log('');
  });

  console.log('='.repeat(60));
  console.log(`総テスト数: ${totalCount}`);
  console.log(`\x1b[32m成功: ${passedCount}\x1b[0m`);
  console.log(`\x1b[31m失敗: ${failedCount}\x1b[0m`);
  console.log(`成功率: ${((passedCount / totalCount) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  process.exit(failedCount > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('テスト実行中に予期しないエラーが発生しました:', error);
  process.exit(1);
});
