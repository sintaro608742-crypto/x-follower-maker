import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_UOx0X8PyQRqT@ep-twilight-night-afxakmxa-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = neon(DATABASE_URL);

try {
  const result = await sql`SELECT NOW() as current_time`;
  console.log('✅ 本番DB接続成功:', result[0].current_time);
  process.exit(0);
} catch (err) {
  console.error('❌ 本番DB接続失敗:', err.message);
  process.exit(1);
}
