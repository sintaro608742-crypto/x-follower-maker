# コードサンプル集

X（Twitter）自動化アプリ開発で使用する実践的なコードサンプルをまとめています。

## 目次

1. [データベース設定（Drizzle ORM + Neon）](#1-データベース設定)
2. [Twitter API統合](#2-twitter-api統合)
3. [自動化エンジン](#3-自動化エンジン)
4. [Upstash QStash統合](#4-upstash-qstash統合)
5. [NextAuth.js認証](#5-nextauthjs認証)
6. [レート制限管理](#6-レート制限管理)
7. [暗号化ユーティリティ](#7-暗号化ユーティリティ)

---

## 1. データベース設定

### Drizzle ORM スキーマ定義

```typescript
// lib/db/schema.ts
import { pgTable, uuid, varchar, text, boolean, timestamp, integer, bigserial, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  twitterAccessToken: text('twitter_access_token'), // 暗号化済み
  twitterRefreshToken: text('twitter_refresh_token'), // 暗号化済み
  twitterUserId: varchar('twitter_user_id', { length: 50 }),
  twitterUsername: varchar('twitter_username', { length: 50 }),
  isActive: boolean('is_active').default(true),
  accountCreatedAt: timestamp('account_created_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const automationSettings = pgTable('automation_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  keywords: text('keywords').array(),
  targetAccounts: text('target_accounts').array(),
  autoFollow: boolean('auto_follow').default(true),
  autoLike: boolean('auto_like').default(true),
  autoRetweet: boolean('auto_retweet').default(false),
  maxFollowsPerDay: integer('max_follows_per_day').default(50),
  maxLikesPerDay: integer('max_likes_per_day').default(100),
  targetFollowerCount: integer('target_follower_count'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const automationHistory = pgTable('automation_history', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  actionType: varchar('action_type', { length: 20 }).notNull(), // 'follow', 'unfollow', 'like', 'retweet'
  targetUserId: varchar('target_user_id', { length: 50 }),
  targetUserUsername: varchar('target_user_username', { length: 50 }),
  tweetId: varchar('tweet_id', { length: 50 }),
  success: boolean('success').notNull(),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_history_user_id').on(table.userId),
  createdAtIdx: index('idx_history_created_at').on(table.createdAt),
  actionTypeIdx: index('idx_history_action_type').on(table.actionType),
}));

export const followerStats = pgTable('follower_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  followerCount: integer('follower_count').notNull(),
  followingCount: integer('following_count').notNull(),
  tweetCount: integer('tweet_count').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_stats_user_id').on(table.userId),
  recordedAtIdx: index('idx_stats_recorded_at').on(table.recordedAt),
}));

export const executionSchedule = pgTable('execution_schedule', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  nextExecutionTime: timestamp('next_execution_time').notNull(),
  lastExecutionTime: timestamp('last_execution_time'),
  executionCount: integer('execution_count').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  nextExecutionIdx: index('idx_schedule_next_execution').on(table.nextExecutionTime),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(automationSettings),
  history: many(automationHistory),
  stats: many(followerStats),
  schedule: one(executionSchedule),
}));
```

### データベース接続

```typescript
// lib/db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Drizzle設定ファイル

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### マイグレーション実行

```bash
# マイグレーションファイル生成
npx drizzle-kit generate:pg

# マイグレーション実行
npx drizzle-kit push:pg
```

---

## 2. Twitter API統合

### Twitter API クライアント

```typescript
// lib/twitter/client.ts
import { TwitterApi } from 'twitter-api-v2';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt, encrypt } from '@/lib/encryption';

export async function getTwitterClient(userId: string): Promise<TwitterApi> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.twitterAccessToken) {
    throw new Error('Twitter token not found');
  }

  const accessToken = decrypt(user.twitterAccessToken);

  const client = new TwitterApi(accessToken);

  return client;
}

export async function refreshTwitterToken(userId: string): Promise<void> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.twitterRefreshToken) {
    throw new Error('Refresh token not found');
  }

  const refreshToken = decrypt(user.twitterRefreshToken);

  const client = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID!,
    clientSecret: process.env.TWITTER_CLIENT_SECRET!,
  });

  const {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  } = await client.refreshOAuth2Token(refreshToken);

  await db
    .update(users)
    .set({
      twitterAccessToken: encrypt(newAccessToken),
      twitterRefreshToken: newRefreshToken ? encrypt(newRefreshToken) : user.twitterRefreshToken,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function executeWithTokenRefresh<T>(
  userId: string,
  fn: (client: TwitterApi) => Promise<T>
): Promise<T> {
  try {
    const client = await getTwitterClient(userId);
    return await fn(client);
  } catch (error: any) {
    if (error.code === 401 || error.message?.includes('token')) {
      // トークンリフレッシュを試行
      await refreshTwitterToken(userId);
      const client = await getTwitterClient(userId);
      return await fn(client);
    }
    throw error;
  }
}
```

### Twitter操作関数

```typescript
// lib/twitter/actions.ts
import { TwitterApi } from 'twitter-api-v2';
import { getTwitterClient, executeWithTokenRefresh } from './client';
import { db } from '@/lib/db';
import { automationHistory } from '@/lib/db/schema';

interface ActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export async function followUser(
  userId: string,
  targetUserId: string,
  targetUsername: string
): Promise<ActionResult> {
  try {
    const result = await executeWithTokenRefresh(userId, async (client) => {
      const response = await client.v2.follow(
        await getTwitterUserId(client),
        targetUserId
      );
      return response;
    });

    // 履歴に記録
    await db.insert(automationHistory).values({
      userId,
      actionType: 'follow',
      targetUserId,
      targetUserUsername: targetUsername,
      success: true,
      metadata: result,
    });

    return { success: true, data: result };
  } catch (error: any) {
    await db.insert(automationHistory).values({
      userId,
      actionType: 'follow',
      targetUserId,
      targetUserUsername: targetUsername,
      success: false,
      errorMessage: error.message,
    });

    return { success: false, error: error.message };
  }
}

export async function unfollowUser(
  userId: string,
  targetUserId: string,
  targetUsername: string
): Promise<ActionResult> {
  try {
    const result = await executeWithTokenRefresh(userId, async (client) => {
      const response = await client.v2.unfollow(
        await getTwitterUserId(client),
        targetUserId
      );
      return response;
    });

    await db.insert(automationHistory).values({
      userId,
      actionType: 'unfollow',
      targetUserId,
      targetUserUsername: targetUsername,
      success: true,
      metadata: result,
    });

    return { success: true, data: result };
  } catch (error: any) {
    await db.insert(automationHistory).values({
      userId,
      actionType: 'unfollow',
      targetUserId,
      targetUserUsername: targetUsername,
      success: false,
      errorMessage: error.message,
    });

    return { success: false, error: error.message };
  }
}

export async function likeTweet(
  userId: string,
  tweetId: string
): Promise<ActionResult> {
  try {
    const result = await executeWithTokenRefresh(userId, async (client) => {
      const response = await client.v2.like(
        await getTwitterUserId(client),
        tweetId
      );
      return response;
    });

    await db.insert(automationHistory).values({
      userId,
      actionType: 'like',
      tweetId,
      success: true,
      metadata: result,
    });

    return { success: true, data: result };
  } catch (error: any) {
    await db.insert(automationHistory).values({
      userId,
      actionType: 'like',
      tweetId,
      success: false,
      errorMessage: error.message,
    });

    return { success: false, error: error.message };
  }
}

export async function retweetTweet(
  userId: string,
  tweetId: string
): Promise<ActionResult> {
  try {
    const result = await executeWithTokenRefresh(userId, async (client) => {
      const response = await client.v2.retweet(
        await getTwitterUserId(client),
        tweetId
      );
      return response;
    });

    await db.insert(automationHistory).values({
      userId,
      actionType: 'retweet',
      tweetId,
      success: true,
      metadata: result,
    });

    return { success: true, data: result };
  } catch (error: any) {
    await db.insert(automationHistory).values({
      userId,
      actionType: 'retweet',
      tweetId,
      success: false,
      errorMessage: error.message,
    });

    return { success: false, error: error.message };
  }
}

export async function searchTweets(
  userId: string,
  query: string,
  maxResults: number = 10
) {
  return executeWithTokenRefresh(userId, async (client) => {
    const response = await client.v2.search(query, {
      max_results: maxResults,
      'tweet.fields': ['author_id', 'created_at', 'public_metrics'],
      'user.fields': ['username', 'name', 'public_metrics'],
      expansions: ['author_id'],
    });

    return response.data;
  });
}

async function getTwitterUserId(client: TwitterApi): Promise<string> {
  const me = await client.v2.me();
  return me.data.id;
}
```

---

## 3. 自動化エンジン

### 自動化実行ロジック

```typescript
// lib/automation/engine.ts
import { db } from '@/lib/db';
import { users, automationSettings, executionSchedule } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { followUser, likeTweet, searchTweets } from '@/lib/twitter/actions';
import { canPerformAction, getHumanizedDelay } from '@/lib/automation/rate-limiter';

interface AutomationConfig {
  userId: string;
  settings: typeof automationSettings.$inferSelect;
}

export async function runAutomationForUser(userId: string): Promise<void> {
  console.log(`Starting automation for user: ${userId}`);

  const [user] = await db
    .select()
    .from(users)
    .where(and(
      eq(users.id, userId),
      eq(users.isActive, true)
    ))
    .limit(1);

  if (!user) {
    console.log(`User ${userId} not found or inactive`);
    return;
  }

  const [settings] = await db
    .select()
    .from(automationSettings)
    .where(eq(automationSettings.userId, userId))
    .limit(1);

  if (!settings) {
    console.log(`Settings not found for user ${userId}`);
    return;
  }

  // キーワード検索とフォロー
  if (settings.autoFollow && settings.keywords && settings.keywords.length > 0) {
    await performAutoFollow({ userId, settings });
  }

  // いいね実行
  if (settings.autoLike && settings.keywords && settings.keywords.length > 0) {
    await performAutoLike({ userId, settings });
  }

  // 次回実行時刻を更新
  await updateNextExecutionTime(userId);

  console.log(`Automation completed for user: ${userId}`);
}

async function performAutoFollow(config: AutomationConfig): Promise<void> {
  const { userId, settings } = config;

  // レート制限チェック
  const canFollow = await canPerformAction(userId, 'follow');
  if (!canFollow) {
    console.log(`Rate limit reached for follows: ${userId}`);
    return;
  }

  // ランダムにキーワードを選択
  const keyword = settings.keywords![Math.floor(Math.random() * settings.keywords!.length)];

  try {
    // ツイート検索
    const tweets = await searchTweets(userId, keyword, 10);

    if (!tweets || tweets.data.length === 0) {
      console.log(`No tweets found for keyword: ${keyword}`);
      return;
    }

    // ランダムに1つのツイートの投稿者をフォロー
    const randomTweet = tweets.data[Math.floor(Math.random() * tweets.data.length)];
    const authorId = randomTweet.author_id;
    const author = tweets.includes?.users?.find(u => u.id === authorId);

    if (!author) {
      console.log('Author not found in tweet data');
      return;
    }

    // フォロー実行
    console.log(`Following user: ${author.username}`);
    const result = await followUser(userId, authorId!, author.username);

    if (result.success) {
      // 人間らしい遅延を追加
      const delay = getHumanizedDelay(120_000, 480_000); // 2-8分
      console.log(`Waiting ${delay}ms before next action`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  } catch (error: any) {
    console.error(`Error in performAutoFollow: ${error.message}`);
  }
}

async function performAutoLike(config: AutomationConfig): Promise<void> {
  const { userId, settings } = config;

  // レート制限チェック
  const canLike = await canPerformAction(userId, 'like');
  if (!canLike) {
    console.log(`Rate limit reached for likes: ${userId}`);
    return;
  }

  // ランダムにキーワードを選択
  const keyword = settings.keywords![Math.floor(Math.random() * settings.keywords!.length)];

  try {
    // ツイート検索
    const tweets = await searchTweets(userId, keyword, 10);

    if (!tweets || tweets.data.length === 0) {
      console.log(`No tweets found for keyword: ${keyword}`);
      return;
    }

    // ランダムに1-3個のツイートにいいね
    const likeCount = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...tweets.data].sort(() => 0.5 - Math.random());
    const toLike = shuffled.slice(0, likeCount);

    for (const tweet of toLike) {
      console.log(`Liking tweet: ${tweet.id}`);
      await likeTweet(userId, tweet.id);

      // 人間らしい遅延
      const delay = getHumanizedDelay(60_000, 300_000); // 1-5分
      console.log(`Waiting ${delay}ms before next like`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  } catch (error: any) {
    console.error(`Error in performAutoLike: ${error.message}`);
  }
}

async function updateNextExecutionTime(userId: string): Promise<void> {
  const now = new Date();
  const nextExecution = new Date(now.getTime() + getNextExecutionDelay());

  await db
    .insert(executionSchedule)
    .values({
      userId,
      nextExecutionTime: nextExecution,
      lastExecutionTime: now,
      executionCount: 1,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: executionSchedule.userId,
      set: {
        nextExecutionTime: nextExecution,
        lastExecutionTime: now,
        executionCount: db.raw('execution_count + 1'),
        updatedAt: now,
      },
    });
}

function getNextExecutionDelay(): number {
  // 1-3時間のランダムな遅延（ミリ秒）
  const minHours = 1;
  const maxHours = 3;
  const hours = minHours + Math.random() * (maxHours - minHours);
  return hours * 60 * 60 * 1000;
}
```

---

## 4. Upstash QStash統合

### Cron Job APIエンドポイント

```typescript
// app/api/cron/automation/route.ts
import { verifySignature } from "@upstash/qstash/nextjs";
import { db } from '@/lib/db';
import { executionSchedule } from '@/lib/db/schema';
import { lte } from 'drizzle-orm';
import { runAutomationForUser } from '@/lib/automation/engine';

async function handler(request: Request) {
  console.log('Cron job triggered:', new Date().toISOString());

  try {
    // 実行すべきユーザーを取得
    const usersToExecute = await db
      .select()
      .from(executionSchedule)
      .where(lte(executionSchedule.nextExecutionTime, new Date()))
      .limit(50); // 1回のCronで最大50ユーザー

    console.log(`Found ${usersToExecute.length} users to process`);

    // 並列実行（Promise.allSettled で全てのユーザーを処理）
    const results = await Promise.allSettled(
      usersToExecute.map(schedule => runAutomationForUser(schedule.userId))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Automation completed: ${successful} successful, ${failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      processed: usersToExecute.length,
      successful,
      failed,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const POST = verifySignature(handler);

export async function GET(request: Request) {
  // 開発用エンドポイント（本番では削除または認証必須）
  return new Response('Cron endpoint is working', { status: 200 });
}
```

### QStash スケジュール設定スクリプト

```typescript
// scripts/setup-qstash.ts
import { Client } from '@upstash/qstash';

const client = new Client({
  token: process.env.QSTASH_TOKEN!,
});

async function setupSchedule() {
  try {
    // 既存のスケジュールを削除
    const schedules = await client.schedules.list();
    for (const schedule of schedules) {
      await client.schedules.delete(schedule.scheduleId);
      console.log(`Deleted schedule: ${schedule.scheduleId}`);
    }

    // 新しいスケジュールを作成（毎時実行）
    const schedule = await client.schedules.create({
      destination: `${process.env.NEXTAUTH_URL}/api/cron/automation`,
      cron: '0 * * * *', // 毎時0分
      retries: 3,
    });

    console.log('Schedule created:', schedule);
  } catch (error) {
    console.error('Error setting up QStash:', error);
  }
}

setupSchedule();
```

---

## 5. NextAuth.js認証

### NextAuth設定

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          twitterConnected: !!user.twitterAccessToken,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.twitterConnected = user.twitterConnected;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.twitterConnected = token.twitterConnected as boolean;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### Twitter OAuth設定

```typescript
// app/api/auth/twitter/connect/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "../../[...nextauth]/route";
import { TwitterApi } from "twitter-api-v2";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const client = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID!,
  });

  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
    `${process.env.NEXTAUTH_URL}/api/auth/twitter/callback`,
    {
      scope: [
        'tweet.read',
        'tweet.write',
        'users.read',
        'follows.read',
        'follows.write',
        'like.write',
        'offline.access',
      ],
    }
  );

  // セッションストアに保存（実装はRedisやDBを推奨）
  // 簡易的にはクッキーに保存も可（セキュリティ要注意）
  const response = Response.redirect(url);
  response.headers.set('Set-Cookie', `twitter_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax`);
  response.headers.set('Set-Cookie', `twitter_code_verifier=${codeVerifier}; Path=/; HttpOnly; Secure; SameSite=Lax`);

  return response;
}
```

```typescript
// app/api/auth/twitter/callback/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "../../[...nextauth]/route";
import { TwitterApi } from "twitter-api-v2";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/encryption";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.redirect(`${process.env.NEXTAUTH_URL}/login`);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookieStore = cookies();
  const savedState = cookieStore.get('twitter_oauth_state')?.value;
  const codeVerifier = cookieStore.get('twitter_code_verifier')?.value;

  if (!code || !state || !codeVerifier || state !== savedState) {
    return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=twitter_auth_failed`);
  }

  try {
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID!,
    });

    const { accessToken, refreshToken } = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/twitter/callback`,
    });

    // Twitter ユーザー情報を取得
    const twitterClient = new TwitterApi(accessToken);
    const me = await twitterClient.v2.me();

    // DBに保存
    await db
      .update(users)
      .set({
        twitterAccessToken: encrypt(accessToken),
        twitterRefreshToken: refreshToken ? encrypt(refreshToken) : null,
        twitterUserId: me.data.id,
        twitterUsername: me.data.username,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    // クッキーをクリア
    const response = Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?twitter_connected=true`);
    response.headers.set('Set-Cookie', 'twitter_oauth_state=; Max-Age=0; Path=/');
    response.headers.set('Set-Cookie', 'twitter_code_verifier=; Max-Age=0; Path=/');

    return response;
  } catch (error: any) {
    console.error('Twitter OAuth error:', error);
    return Response.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=twitter_auth_failed`);
  }
}
```

---

## 6. レート制限管理

```typescript
// lib/automation/rate-limiter.ts
import { db } from '@/lib/db';
import { automationHistory, users } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

interface RateLimits {
  followsPerHour: number;
  unfollowsPerDay: number;
  likesPerHour: number;
  retweetsPerDay: number;
  minDelayBetweenActions: number;
  maxDelayBetweenActions: number;
}

const SAFETY_LIMITS = {
  new: {
    followsPerHour: 10,
    unfollowsPerDay: 20,
    likesPerHour: 30,
    retweetsPerDay: 10,
    minDelayBetweenActions: 180_000,
    maxDelayBetweenActions: 600_000,
  },
  intermediate: {
    followsPerHour: 25,
    unfollowsPerDay: 50,
    likesPerHour: 50,
    retweetsPerDay: 25,
    minDelayBetweenActions: 120_000,
    maxDelayBetweenActions: 480_000,
  },
  mature: {
    followsPerHour: 40,
    unfollowsPerDay: 100,
    likesPerHour: 80,
    retweetsPerDay: 50,
    minDelayBetweenActions: 60_000,
    maxDelayBetweenActions: 300_000,
  },
} as const;

export async function canPerformAction(
  userId: string,
  actionType: 'follow' | 'unfollow' | 'like' | 'retweet'
): Promise<boolean> {
  const limits = await getLimitsForUser(userId);
  const timeWindow = actionType === 'follow' || actionType === 'like' ? '1 hour' : '1 day';

  const [result] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
      lastAction: sql<Date>`MAX(created_at)`,
    })
    .from(automationHistory)
    .where(
      and(
        eq(automationHistory.userId, userId),
        eq(automationHistory.actionType, actionType),
        gte(automationHistory.createdAt, sql`NOW() - INTERVAL '${sql.raw(timeWindow)}'`)
      )
    );

  // レート制限チェック
  const limitKey = `${actionType}sPerHour` as keyof RateLimits;
  if (result.count >= (limits[limitKey] as number)) {
    return false;
  }

  // 最後のアクションからの経過時間チェック
  if (result.lastAction) {
    const timeSinceLastAction = Date.now() - new Date(result.lastAction).getTime();
    if (timeSinceLastAction < limits.minDelayBetweenActions) {
      return false;
    }
  }

  return true;
}

async function getLimitsForUser(userId: string): Promise<RateLimits> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.accountCreatedAt) {
    return SAFETY_LIMITS.new;
  }

  const accountAge = Date.now() - new Date(user.accountCreatedAt).getTime();
  const monthsOld = accountAge / (1000 * 60 * 60 * 24 * 30);

  if (monthsOld < 1) return SAFETY_LIMITS.new;
  if (monthsOld < 6) return SAFETY_LIMITS.intermediate;
  return SAFETY_LIMITS.mature;
}

export function getHumanizedDelay(min: number, max: number): number {
  // Box-Muller変換による正規分布生成
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  const mean = (min + max) / 2;
  const stdDev = (max - min) / 6;

  let delay = mean + z0 * stdDev;
  delay = Math.max(min, Math.min(max, delay));

  return Math.floor(delay);
}

export async function executeWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.code === 429 || error.status === 429) {
        const resetTime = error.rateLimit?.reset
          ? error.rateLimit.reset * 1000
          : Date.now() + 900_000;
        const waitTime = resetTime - Date.now() + 5000;

        console.log(`Rate limited. Waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));

        retries++;
      } else {
        throw error;
      }
    }
  }

  throw new Error('Max retries exceeded');
}
```

---

## 7. 暗号化ユーティリティ

```typescript
// lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: IV(32) + AuthTag(32) + EncryptedData
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

export function decrypt(encrypted: string): string {
  const iv = Buffer.from(encrypted.slice(0, 32), 'hex');
  const authTag = Buffer.from(encrypted.slice(32, 64), 'hex');
  const encryptedText = encrypted.slice(64);

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// 暗号化キーの生成（初回セットアップ時のみ使用）
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
```

### 暗号化キー生成スクリプト

```typescript
// scripts/generate-keys.ts
import { generateEncryptionKey } from '../lib/encryption';
import crypto from 'crypto';

console.log('=== セキュリティキー生成 ===\n');

console.log('ENCRYPTION_KEY:');
console.log(generateEncryptionKey());
console.log();

console.log('NEXTAUTH_SECRET:');
console.log(crypto.randomBytes(32).toString('base64'));
```

---

## 使用方法

### 1. 環境変数設定

```bash
# .env.local
DATABASE_URL=postgresql://user:password@host/database
ENCRYPTION_KEY=<scripts/generate-keys.ts の出力値>
TWITTER_CLIENT_ID=<Twitter Developer Portal から取得>
TWITTER_CLIENT_SECRET=<Twitter Developer Portal から取得>
TWITTER_CALLBACK_URL=http://localhost:3000/api/auth/twitter/callback
NEXTAUTH_SECRET=<scripts/generate-keys.ts の出力値>
NEXTAUTH_URL=http://localhost:3000
QSTASH_TOKEN=<Upstash Console から取得>
```

### 2. データベースマイグレーション

```bash
npm run db:generate
npm run db:push
```

### 3. QStashスケジュール設定

```bash
npm run setup:qstash
```

### 4. 開発サーバー起動

```bash
npm run dev
```

---

このコードサンプル集は、実際のプロダクション環境で使用できる品質を目指して作成されています。
必要に応じてカスタマイズしてご使用ください。
