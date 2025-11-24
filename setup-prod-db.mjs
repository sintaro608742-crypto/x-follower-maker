import { neon } from '@neondatabase/serverless';

const PROD_DATABASE_URL = 'postgresql://neondb_owner:npg_UOx0X8PyQRqT@ep-twilight-night-afxakmxa-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = neon(PROD_DATABASE_URL);

console.log('🚀 本番DBにスキーマを作成します...\n');

try {
  // 1. usersテーブル作成
  console.log('📋 Creating users table...');
  await sql`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "email" varchar(255) NOT NULL,
      "password_hash" varchar(255) NOT NULL,
      "twitter_user_id" varchar(255),
      "twitter_username" varchar(255),
      "twitter_access_token_encrypted" text,
      "twitter_refresh_token_encrypted" text,
      "keywords" text[] DEFAULT '{}'::text[] NOT NULL,
      "post_frequency" integer DEFAULT 4 NOT NULL,
      "post_times" text[] DEFAULT '{}'::text[] NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "users_email_unique" UNIQUE("email")
    )
  `;
  console.log('✅ users table created');

  // 2. postsテーブル作成
  console.log('📋 Creating posts table...');
  await sql`
    CREATE TABLE IF NOT EXISTS "posts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL,
      "content" text NOT NULL,
      "scheduled_at" timestamp NOT NULL,
      "is_approved" boolean DEFAULT true NOT NULL,
      "is_manual" boolean DEFAULT false NOT NULL,
      "status" varchar(50) DEFAULT 'scheduled' NOT NULL,
      "posted_at" timestamp,
      "error_message" text,
      "twitter_tweet_id" varchar(255),
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log('✅ posts table created');

  // 3. follower_statsテーブル作成
  console.log('📋 Creating follower_stats table...');
  await sql`
    CREATE TABLE IF NOT EXISTS "follower_stats" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL,
      "follower_count" integer NOT NULL,
      "following_count" integer,
      "recorded_at" timestamp DEFAULT now() NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log('✅ follower_stats table created');

  // 4. 外部キー制約作成
  console.log('🔗 Creating foreign key constraints...');
  await sql`
    ALTER TABLE "posts" 
    DROP CONSTRAINT IF EXISTS "posts_user_id_users_id_fk"
  `;
  await sql`
    ALTER TABLE "posts" 
    ADD CONSTRAINT "posts_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
    ON DELETE cascade ON UPDATE no action
  `;
  
  await sql`
    ALTER TABLE "follower_stats" 
    DROP CONSTRAINT IF EXISTS "follower_stats_user_id_users_id_fk"
  `;
  await sql`
    ALTER TABLE "follower_stats" 
    ADD CONSTRAINT "follower_stats_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
    ON DELETE cascade ON UPDATE no action
  `;
  console.log('✅ Foreign key constraints created');

  // 5. インデックス作成
  console.log('📊 Creating indexes...');
  await sql`CREATE INDEX IF NOT EXISTS "email_idx" ON "users" USING btree ("email")`;
  await sql`CREATE INDEX IF NOT EXISTS "twitter_user_id_idx" ON "users" USING btree ("twitter_user_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "posts_user_id_idx" ON "posts" USING btree ("user_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "posts_scheduled_at_idx" ON "posts" USING btree ("scheduled_at")`;
  await sql`CREATE INDEX IF NOT EXISTS "posts_status_idx" ON "posts" USING btree ("status")`;
  await sql`CREATE INDEX IF NOT EXISTS "follower_stats_user_id_idx" ON "follower_stats" USING btree ("user_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "follower_stats_recorded_at_idx" ON "follower_stats" USING btree ("recorded_at")`;
  console.log('✅ Indexes created');

  console.log('\n🎉 本番DBスキーマ作成完了！');
  process.exit(0);
} catch (err) {
  console.error('\n❌ スキーマ作成失敗:', err.message);
  console.error(err);
  process.exit(1);
}
