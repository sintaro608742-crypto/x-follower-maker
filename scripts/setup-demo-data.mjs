import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL);

// デモユーザー情報（フロントエンドのログインページと一致）
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

async function setupDemoData() {
  try {
    console.log('🚀 デモデータセットアップ開始...\n');

    // 1. デモユーザーの作成または取得
    console.log('1️⃣ デモユーザーの確認...');

    const userIds = [];

    for (const demoUser of DEMO_USERS) {
      let user = await sql`SELECT * FROM users WHERE email = ${demoUser.email}`;

      if (user.length === 0) {
        console.log(`   ${demoUser.email} が存在しないため、新規作成します...`);
        const passwordHash = await bcrypt.hash(demoUser.password, 10);

        user = await sql`
          INSERT INTO users (email, password_hash, created_at, updated_at)
          VALUES (${demoUser.email}, ${passwordHash}, NOW(), NOW())
          RETURNING *
        `;
        console.log(`   ✅ ユーザー作成完了: ${user[0].email} (ID: ${user[0].id})`);
      } else {
        console.log(`   ✅ ユーザー確認済み: ${user[0].email} (ID: ${user[0].id})`);
      }

      userIds.push(user[0].id);
    }

    const userId = userIds[0]; // demo@example.com のIDを使用

    // 2. スケジュール投稿の作成（過去、現在、未来）
    console.log('\n2️⃣ スケジュール投稿の作成...');

    const now = new Date();
    const posts = [
      {
        content: '【即時投稿テスト】この投稿は即座に投稿される予定です #XFollowerMaker #Test',
        scheduledAt: new Date(now.getTime() - 5 * 60 * 1000), // 5分前（即座に投稿）
        status: 'scheduled',
        isApproved: true,
      },
      {
        content: '【10分後投稿】AIが生成した投稿のサンプルです。フォロワー増加のために最適化されています。 #AI #Growth',
        scheduledAt: new Date(now.getTime() + 10 * 60 * 1000), // 10分後
        status: 'scheduled',
        isApproved: true,
      },
      {
        content: '【1時間後投稿】継続的な投稿でエンゲージメントを高めましょう！ #SNS #Marketing',
        scheduledAt: new Date(now.getTime() + 60 * 60 * 1000), // 1時間後
        status: 'scheduled',
        isApproved: true,
      },
      {
        content: '【2時間後投稿】データドリブンなアプローチで成長を加速させます。 #Analytics #Data',
        scheduledAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2時間後
        status: 'scheduled',
        isApproved: true,
      },
      {
        content: '【承認待ち】この投稿は承認待ちのため、投稿されません。',
        scheduledAt: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3時間後
        status: 'scheduled',
        isApproved: false, // 承認待ち
      },
    ];

    for (const post of posts) {
      const result = await sql`
        INSERT INTO posts (
          user_id,
          content,
          scheduled_at,
          status,
          is_approved,
          is_manual,
          created_at,
          updated_at
        ) VALUES (
          ${userId},
          ${post.content},
          ${post.scheduledAt.toISOString()},
          ${post.status},
          ${post.isApproved},
          false,
          NOW(),
          NOW()
        )
        RETURNING id, content, scheduled_at, is_approved
      `;

      const scheduledTime = new Date(result[0].scheduled_at).toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
      });
      const approvalStatus = result[0].is_approved ? '✅ 承認済み' : '⏳ 承認待ち';
      console.log(`   ${approvalStatus} ${scheduledTime} - ${result[0].content.substring(0, 40)}...`);
    }

    // 3. フォロワー統計の作成（過去30日分）
    console.log('\n3️⃣ フォロワー統計の作成（過去30日分）...');

    // まず既存のフォロワー統計を削除
    await sql`DELETE FROM follower_stats WHERE user_id = ${userId}`;

    const baseFollowerCount = 100;
    const daysToCreate = 30;

    for (let i = daysToCreate; i >= 0; i--) {
      const recordedAt = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

      // フォロワー数をランダムに増加（成長曲線をシミュレート）
      const dayProgress = daysToCreate - i;
      const growthFactor = 1 + (dayProgress / daysToCreate) * 0.5; // 50%成長
      const randomVariation = Math.random() * 0.1 - 0.05; // ±5%のランダム変動
      const followerCount = Math.floor(baseFollowerCount * growthFactor * (1 + randomVariation));
      const followingCount = Math.floor(followerCount * 0.3); // フォロー数はフォロワーの30%

      await sql`
        INSERT INTO follower_stats (
          user_id,
          follower_count,
          following_count,
          recorded_at,
          created_at
        ) VALUES (
          ${userId},
          ${followerCount},
          ${followingCount},
          ${recordedAt.toISOString()},
          NOW()
        )
      `;
    }

    const latestStats = await sql`
      SELECT follower_count, following_count, recorded_at
      FROM follower_stats
      WHERE user_id = ${userId}
      ORDER BY recorded_at DESC
      LIMIT 1
    `;

    console.log(`   ✅ ${daysToCreate + 1}日分のフォロワー統計を作成しました`);
    console.log(`   最新: ${latestStats[0].follower_count}フォロワー / ${latestStats[0].following_count}フォロー中`);

    // 4. サマリー表示
    console.log('\n📊 セットアップ完了サマリー:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ デモユーザー:');
    DEMO_USERS.forEach((user) => {
      console.log(`   ${user.email} / ${user.password}`);
    });
    console.log(`✅ スケジュール投稿: ${posts.length}件`);
    console.log(`✅ フォロワー統計: ${daysToCreate + 1}日分`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n🎯 次のステップ:');
    console.log('1. https://xfollowermaker.vercel.app でログイン');
    console.log('2. ダッシュボードでフォロワー推移グラフを確認');
    console.log('3. 投稿ページでスケジュール投稿を確認');
    console.log('4. QStashのCronジョブが自動投稿を実行（毎時0分）');
    console.log('5. Vercelログで投稿実行を確認\n');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

setupDemoData();
