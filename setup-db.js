/**
 * Database Setup Script
 *
 * このスクリプトはデータベーススキーマを適用します。
 * drizzle-kit pushを非対話的に実行します。
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('Xフォロワーメーカー - データベースセットアップ');
console.log('='.repeat(60));
console.log('');

// .env.local が存在するか確認
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('✗ エラー: .env.local ファイルが見つかりません');
  process.exit(1);
}

console.log('✓ .env.local ファイルを確認しました');
console.log('');

// DATABASE_URL が設定されているか確認
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) {
  console.error('✗ エラー: DATABASE_URL 環境変数が設定されていません');
  process.exit(1);
}

console.log('✓ DATABASE_URL が設定されています');
console.log('');

console.log('[1/2] データベーススキーマを適用中...');
console.log('');

try {
  // Drizzle Pushを実行（自動確認付き）
  execSync('echo "Yes, I want to execute all statements" | npx drizzle-kit push', {
    stdio: 'inherit',
    cwd: __dirname,
  });
  console.log('');
  console.log('✓ データベーススキーマの適用が完了しました');
  console.log('');
} catch (error) {
  console.error('✗ データベーススキーマの適用に失敗しました');
  console.error(error.message);
  process.exit(1);
}

console.log('[2/2] テストスクリプトを実行中...');
console.log('');

try {
  execSync('npm run test:db', {
    stdio: 'inherit',
    cwd: __dirname,
  });
  console.log('');
  console.log('✓ すべてのセットアップが完了しました');
  console.log('');
} catch (error) {
  console.error('✗ テストスクリプトの実行に失敗しました');
  process.exit(1);
}

console.log('='.repeat(60));
console.log('データベース基盤のセットアップが完了しました！');
console.log('='.repeat(60));
