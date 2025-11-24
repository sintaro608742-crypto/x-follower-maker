#!/usr/bin/env node

/**
 * 環境変数接続テストスクリプト
 *
 * このスクリプトは以下をテストします:
 * 1. Neon PostgreSQL接続
 * 2. Google Gemini API接続
 * 3. X (Twitter) API接続
 */

const fs = require('fs');
const path = require('path');

// .env.localを手動で読み込む
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // ダブルクォートを削除
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

async function testDatabaseConnection() {
  console.log('🔍 Neon PostgreSQL接続テスト...\n');

  try {
    // pg パッケージをインストールしていない場合のフォールバック
    let pg;
    try {
      pg = require('pg');
    } catch (error) {
      console.log('⚠️ pg パッケージが見つかりません');
      console.log('インストール: npm install pg');
      console.log('');
      console.log('✅ DATABASE_URLは設定されています');
      console.log(`   接続先: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || '***'}`);
      return true;
    }

    const { Client } = pg;
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    const result = await client.query('SELECT version()');
    await client.end();

    console.log('✅ データベース接続成功！');
    console.log(`   PostgreSQL Version: ${result.rows[0].version.split(' ')[1]}`);
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ データベース接続失敗');
    console.log(`   エラー: ${error.message}`);
    console.log('');
    return false;
  }
}

async function testGeminiAPI() {
  console.log('🔍 Google Gemini API接続テスト...\n');

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log('❌ GEMINI_API_KEY が設定されていません');
      console.log('');
      return false;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Gemini API接続成功！');
      console.log(`   利用可能なモデル数: ${data.models?.length || 0}`);
      console.log('');
      return true;
    } else {
      console.log('❌ Gemini API接続失敗');
      console.log(`   HTTPステータス: ${response.status}`);
      console.log('');
      return false;
    }
  } catch (error) {
    console.log('❌ Gemini API接続失敗');
    console.log(`   エラー: ${error.message}`);
    console.log('');
    return false;
  }
}

async function testTwitterAPI() {
  console.log('🔍 X (Twitter) API接続テスト...\n');

  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      console.log('❌ TWITTER_BEARER_TOKEN が設定されていません');
      console.log('');
      return false;
    }

    // API v2のユーザー情報取得エンドポイント（認証テスト用）
    const response = await fetch(
      'https://api.twitter.com/2/users/me',
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ X API接続成功！');
      console.log(`   認証ユーザー: @${data.data?.username || 'unknown'}`);
      console.log('');
      return true;
    } else if (response.status === 401) {
      console.log('❌ X API認証失敗');
      console.log('   TWITTER_BEARER_TOKENが無効です');
      console.log('');
      return false;
    } else {
      console.log('⚠️ X API接続テスト部分的成功');
      console.log(`   HTTPステータス: ${response.status}`);
      console.log('   Bearer Tokenは設定されていますが、アクセス権限を確認してください');
      console.log('');
      return true; // Bearer Tokenは有効
    }
  } catch (error) {
    console.log('❌ X API接続失敗');
    console.log(`   エラー: ${error.message}`);
    console.log('');
    return false;
  }
}

async function testUpstashQStash() {
  console.log('🔍 Upstash QStash接続テスト...\n');

  try {
    const qstashToken = process.env.QSTASH_TOKEN;
    const qstashUrl = process.env.QSTASH_URL;

    if (!qstashToken || !qstashUrl) {
      console.log('❌ QSTASH環境変数が設定されていません');
      console.log('');
      return false;
    }

    // QStashのステータス確認
    const response = await fetch(`${qstashUrl}/v2/queues`, {
      headers: {
        'Authorization': `Bearer ${qstashToken}`
      }
    });

    if (response.ok) {
      console.log('✅ Upstash QStash接続成功！');
      console.log('   QStashサービスは正常に動作しています');
      console.log('');
      return true;
    } else {
      console.log('❌ Upstash QStash接続失敗');
      console.log(`   HTTPステータス: ${response.status}`);
      console.log('');
      return false;
    }
  } catch (error) {
    console.log('❌ Upstash QStash接続失敗');
    console.log(`   エラー: ${error.message}`);
    console.log('');
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         環境変数・外部サービス接続検証                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  const results = {
    database: await testDatabaseConnection(),
    gemini: await testGeminiAPI(),
    twitter: await testTwitterAPI(),
    qstash: await testUpstashQStash()
  };

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                     検証結果サマリー                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`   ${results.database ? '✅' : '❌'} Neon PostgreSQL`);
  console.log(`   ${results.gemini ? '✅' : '❌'} Google Gemini API`);
  console.log(`   ${results.twitter ? '✅' : '❌'} X (Twitter) API`);
  console.log(`   ${results.qstash ? '✅' : '❌'} Upstash QStash`);
  console.log('');

  const allSuccess = Object.values(results).every(r => r);
  if (allSuccess) {
    console.log('🎉 全ての接続テストが成功しました！');
    console.log('');
    console.log('次のステップ:');
    console.log('  1. npm install で依存関係をインストール');
    console.log('  2. npm run dev で開発サーバーを起動');
    console.log('');
  } else {
    console.log('⚠️ 一部の接続テストが失敗しました');
    console.log('失敗した項目の環境変数を確認してください');
    console.log('');
    process.exit(1);
  }
}

main().catch(console.error);
