import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;
const sql = neon(DATABASE_URL);

async function createScheduledPost() {
  try {
    const userId = '38c5a595-d40d-4276-8485-3424c8a3fe3c';

    // 10分後の日時を計算
    const scheduledAt = new Date(Date.now() + 10 * 60 * 1000);

    // 投稿予定データを作成
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
        'E2Eテスト用投稿（10分後投稿予定）',
        ${scheduledAt.toISOString()},
        'scheduled',
        true,
        false,
        NOW(),
        NOW()
      )
      RETURNING id, content, scheduled_at, status
    `;

    console.log('投稿予定データを作成しました:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n予定日時:', scheduledAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createScheduledPost();
