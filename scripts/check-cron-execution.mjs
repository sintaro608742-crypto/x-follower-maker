import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL);

async function checkCronExecution() {
  try {
    console.log('🔍 Cronジョブ実行状況を確認中...\n');

    // 1. 投稿ステータスの確認
    console.log('1️⃣ 投稿ステータス:');
    const posts = await sql`
      SELECT
        id,
        content,
        status,
        scheduled_at,
        posted_at,
        error_message,
        twitter_tweet_id
      FROM posts
      WHERE user_id = (SELECT id FROM users WHERE email = 'test@xfollowermaker.local')
      ORDER BY scheduled_at DESC
      LIMIT 10
    `;

    if (posts.length === 0) {
      console.log('   ⚠️  投稿データが見つかりません');
    } else {
      const statusCounts = {
        scheduled: 0,
        posted: 0,
        failed: 0,
      };

      posts.forEach((post) => {
        statusCounts[post.status]++;

        const scheduledTime = new Date(post.scheduled_at).toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
        });

        let statusIcon = '⏰';
        if (post.status === 'posted') statusIcon = '✅';
        if (post.status === 'failed') statusIcon = '❌';

        console.log(`   ${statusIcon} [${post.status.toUpperCase()}] ${scheduledTime}`);
        console.log(`      ${post.content.substring(0, 50)}...`);

        if (post.status === 'posted' && post.twitter_tweet_id) {
          console.log(`      🐦 Tweet ID: ${post.twitter_tweet_id}`);
          console.log(`      🔗 https://twitter.com/i/web/status/${post.twitter_tweet_id}`);
        }

        if (post.status === 'failed' && post.error_message) {
          console.log(`      ⚠️  エラー: ${post.error_message}`);
        }

        console.log('');
      });

      console.log('   📊 ステータスサマリー:');
      console.log(`      - scheduled: ${statusCounts.scheduled}件`);
      console.log(`      - posted: ${statusCounts.posted}件`);
      console.log(`      - failed: ${statusCounts.failed}件`);
    }

    // 2. フォロワー統計の確認
    console.log('\n2️⃣ フォロワー統計:');
    const stats = await sql`
      SELECT
        follower_count,
        following_count,
        recorded_at
      FROM follower_stats
      WHERE user_id = (SELECT id FROM users WHERE email = 'test@xfollowermaker.local')
      ORDER BY recorded_at DESC
      LIMIT 5
    `;

    if (stats.length === 0) {
      console.log('   ⚠️  フォロワー統計が見つかりません');
    } else {
      console.log('   最新5件:');
      stats.forEach((stat) => {
        const recordedTime = new Date(stat.recorded_at).toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
        });
        console.log(`   📊 ${recordedTime}: ${stat.follower_count}フォロワー / ${stat.following_count}フォロー中`);
      });
    }

    // 3. 次の実行予定
    console.log('\n3️⃣ 次の実行予定:');
    const nextScheduled = await sql`
      SELECT
        scheduled_at,
        content
      FROM posts
      WHERE user_id = (SELECT id FROM users WHERE email = 'test@xfollowermaker.local')
        AND status = 'scheduled'
        AND is_approved = true
      ORDER BY scheduled_at ASC
      LIMIT 3
    `;

    if (nextScheduled.length === 0) {
      console.log('   ⚠️  次の投稿予定がありません');
    } else {
      nextScheduled.forEach((post) => {
        const scheduledTime = new Date(post.scheduled_at).toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
        });
        const now = new Date();
        const diff = new Date(post.scheduled_at) - now;
        const diffMinutes = Math.floor(diff / 1000 / 60);

        let timeInfo = '';
        if (diffMinutes < 0) {
          timeInfo = `（${Math.abs(diffMinutes)}分前、次のCron実行待ち）`;
        } else if (diffMinutes === 0) {
          timeInfo = '（まもなく）';
        } else if (diffMinutes < 60) {
          timeInfo = `（${diffMinutes}分後）`;
        } else {
          const diffHours = Math.floor(diffMinutes / 60);
          timeInfo = `（${diffHours}時間後）`;
        }

        console.log(`   ⏰ ${scheduledTime} ${timeInfo}`);
        console.log(`      ${post.content.substring(0, 50)}...`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 確認完了');
    console.log('\n💡 次のステップ:');
    console.log('1. posted ステータスの投稿がある場合: Cron正常動作 ✅');
    console.log('2. failed ステータスの投稿がある場合: エラーログ確認');
    console.log('3. 全てscheduled の場合: QStash実行待ち（毎時0分）\n');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

checkCronExecution();
