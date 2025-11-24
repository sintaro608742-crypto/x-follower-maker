/**
 * Database Schema Definition (Drizzle ORM)
 *
 * このファイルはXフォロワーメーカーのデータベーススキーマを定義します。
 * frontend/src/types/index.ts と完全に一致する型定義を保ちます。
 *
 * テーブル:
 * - users: ユーザーアカウント情報
 * - posts: AI生成 & 手動投稿データ
 * - follower_stats: フォロワー数推移データ
 */

import { pgTable, uuid, varchar, timestamp, text, integer, boolean, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

/**
 * Users テーブル
 *
 * ユーザーアカウント情報を保存します。
 * - 認証情報（email, password_hash）
 * - X連携情報（twitter_user_id, twitter_username, トークン）
 * - 設定情報（keywords, post_frequency, post_times）
 */
export const users = pgTable('users', {
  // 主キー
  id: uuid('id').primaryKey().defaultRandom(),

  // 認証情報
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(), // bcrypt hash

  // X (Twitter) 連携情報
  twitter_user_id: varchar('twitter_user_id', { length: 255 }),
  twitter_username: varchar('twitter_username', { length: 255 }),
  twitter_access_token_encrypted: text('twitter_access_token_encrypted'), // AES-256-GCM暗号化
  twitter_refresh_token_encrypted: text('twitter_refresh_token_encrypted'), // AES-256-GCM暗号化

  // 投稿設定
  keywords: text('keywords').array().notNull().default(sql`'{}'::text[]`), // 配列型（例: ["プログラミング", "AI"]）
  post_frequency: integer('post_frequency').notNull().default(4), // 1日の投稿回数（3-5）
  post_times: text('post_times').array().notNull().default(sql`'{}'::text[]`), // 投稿時間帯（例: ["09:00", "12:00", "18:00", "21:00"]）

  // タイムスタンプ
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // インデックス（検索パフォーマンス向上）
  emailIdx: index('email_idx').on(table.email),
  twitterUserIdIdx: index('twitter_user_id_idx').on(table.twitter_user_id),
}));

/**
 * Posts テーブル
 *
 * AI生成または手動作成された投稿データを保存します。
 * - 投稿内容（content）
 * - スケジュール情報（scheduled_at）
 * - ステータス（status: scheduled, posted, failed, unapproved）
 */
export const posts = pgTable('posts', {
  // 主キー
  id: uuid('id').primaryKey().defaultRandom(),

  // 外部キー
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // 投稿内容
  content: text('content').notNull(), // 280文字以内（アプリケーションレベルでバリデーション）
  scheduled_at: timestamp('scheduled_at').notNull(),

  // フラグ
  is_approved: boolean('is_approved').notNull().default(true), // 承認済みか
  is_manual: boolean('is_manual').notNull().default(false), // 手動投稿か

  // ステータス
  status: varchar('status', { length: 50 }).notNull().default('scheduled'), // scheduled, posted, failed, unapproved
  posted_at: timestamp('posted_at'),
  error_message: text('error_message'),
  twitter_tweet_id: varchar('twitter_tweet_id', { length: 255 }), // 投稿成功後のツイートID

  // タイムスタンプ
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // インデックス（検索パフォーマンス向上）
  userIdIdx: index('posts_user_id_idx').on(table.user_id),
  scheduledAtIdx: index('posts_scheduled_at_idx').on(table.scheduled_at),
  statusIdx: index('posts_status_idx').on(table.status),
}));

/**
 * FollowerStats テーブル
 *
 * フォロワー数の履歴データを保存します。
 * - フォロワー数（follower_count）
 * - フォロー数（following_count）
 * - 記録日時（recorded_at）
 */
export const followerStats = pgTable('follower_stats', {
  // 主キー
  id: uuid('id').primaryKey().defaultRandom(),

  // 外部キー
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // 統計データ
  follower_count: integer('follower_count').notNull(),
  following_count: integer('following_count'),
  recorded_at: timestamp('recorded_at').notNull().defaultNow(),

  // タイムスタンプ
  created_at: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // インデックス（検索パフォーマンス向上）
  userIdIdx: index('follower_stats_user_id_idx').on(table.user_id),
  recordedAtIdx: index('follower_stats_recorded_at_idx').on(table.recorded_at),
}));

/**
 * リレーション定義
 *
 * Drizzle ORMのリレーション機能を使用してテーブル間の関連を定義します。
 */

// User リレーション
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  followerStats: many(followerStats),
}));

// Post リレーション
export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.user_id],
    references: [users.id],
  }),
}));

// FollowerStats リレーション
export const followerStatsRelations = relations(followerStats, ({ one }) => ({
  user: one(users, {
    fields: [followerStats.user_id],
    references: [users.id],
  }),
}));
