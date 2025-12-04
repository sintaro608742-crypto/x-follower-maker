/**
 * Sources Repository
 *
 * ソースライブラリのデータアクセス層
 */

import { db } from '@/db/client';
import { sources, generatedPosts } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { Source, GeneratedPost, SourceType, GenerationStyle, SourceMetadata } from '@/types';

/**
 * ソース作成用の入力データ
 */
export interface CreateSourceInput {
  userId: string;
  title: string;
  description?: string;
  sourceType: SourceType;
  sourceUrl?: string;
  filePath?: string;
  fileSize?: number;
  extractedText: string;
  wordCount: number;
  metadata?: SourceMetadata;
}

/**
 * 生成投稿作成用の入力データ
 */
export interface CreateGeneratedPostInput {
  userId: string;
  sourceId: string;
  style: GenerationStyle;
  content: string;
  charCount: number;
}

/**
 * ユーザーのソース一覧を取得
 */
export async function getSourcesByUserId(userId: string): Promise<Source[]> {
  const results = await db
    .select()
    .from(sources)
    .where(eq(sources.user_id, userId))
    .orderBy(desc(sources.created_at));

  return results.map(mapSourceToType);
}

/**
 * ソースをIDで取得
 */
export async function getSourceById(sourceId: string): Promise<Source | null> {
  const results = await db
    .select()
    .from(sources)
    .where(eq(sources.id, sourceId))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  return mapSourceToType(results[0]);
}

/**
 * ソースを作成
 */
export async function createSource(input: CreateSourceInput): Promise<Source> {
  const [result] = await db
    .insert(sources)
    .values({
      user_id: input.userId,
      title: input.title,
      description: input.description,
      source_type: input.sourceType,
      source_url: input.sourceUrl,
      file_path: input.filePath,
      file_size: input.fileSize,
      extracted_text: input.extractedText,
      word_count: input.wordCount,
      metadata: input.metadata,
    })
    .returning();

  return mapSourceToType(result);
}

/**
 * ソースを削除
 */
export async function deleteSource(sourceId: string): Promise<boolean> {
  const result = await db
    .delete(sources)
    .where(eq(sources.id, sourceId))
    .returning({ id: sources.id });

  return result.length > 0;
}

/**
 * ソースの生成投稿一覧を取得
 */
export async function getGeneratedPostsBySourceId(
  sourceId: string
): Promise<GeneratedPost[]> {
  const results = await db
    .select()
    .from(generatedPosts)
    .where(eq(generatedPosts.source_id, sourceId))
    .orderBy(desc(generatedPosts.created_at));

  return results.map(mapGeneratedPostToType);
}

/**
 * ユーザーの全生成投稿を取得
 */
export async function getGeneratedPostsByUserId(
  userId: string
): Promise<GeneratedPost[]> {
  const results = await db
    .select()
    .from(generatedPosts)
    .where(eq(generatedPosts.user_id, userId))
    .orderBy(desc(generatedPosts.created_at));

  return results.map(mapGeneratedPostToType);
}

/**
 * 生成投稿をIDで取得
 */
export async function getGeneratedPostById(
  generatedPostId: string
): Promise<GeneratedPost | null> {
  const results = await db
    .select()
    .from(generatedPosts)
    .where(eq(generatedPosts.id, generatedPostId))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  return mapGeneratedPostToType(results[0]);
}

/**
 * 生成投稿を作成
 */
export async function createGeneratedPost(
  input: CreateGeneratedPostInput
): Promise<GeneratedPost> {
  const [result] = await db
    .insert(generatedPosts)
    .values({
      user_id: input.userId,
      source_id: input.sourceId,
      style: input.style,
      content: input.content,
      char_count: input.charCount,
    })
    .returning();

  return mapGeneratedPostToType(result);
}

/**
 * 複数の生成投稿を一括作成
 */
export async function createGeneratedPosts(
  inputs: CreateGeneratedPostInput[]
): Promise<GeneratedPost[]> {
  if (inputs.length === 0) {
    return [];
  }

  const results = await db
    .insert(generatedPosts)
    .values(
      inputs.map((input) => ({
        user_id: input.userId,
        source_id: input.sourceId,
        style: input.style,
        content: input.content,
        char_count: input.charCount,
      }))
    )
    .returning();

  return results.map(mapGeneratedPostToType);
}

/**
 * 生成投稿を削除
 */
export async function deleteGeneratedPost(
  generatedPostId: string
): Promise<boolean> {
  const result = await db
    .delete(generatedPosts)
    .where(eq(generatedPosts.id, generatedPostId))
    .returning({ id: generatedPosts.id });

  return result.length > 0;
}

/**
 * 生成投稿のスケジュール済み投稿IDを更新
 */
export async function updateGeneratedPostScheduledPostId(
  generatedPostId: string,
  scheduledPostId: string
): Promise<boolean> {
  const result = await db
    .update(generatedPosts)
    .set({ scheduled_post_id: scheduledPostId })
    .where(eq(generatedPosts.id, generatedPostId))
    .returning({ id: generatedPosts.id });

  return result.length > 0;
}

// =====================================
// ヘルパー関数
// =====================================

/**
 * データベース結果をSource型にマッピング
 */
function mapSourceToType(row: typeof sources.$inferSelect): Source {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    source_type: row.source_type as SourceType,
    source_url: row.source_url ?? undefined,
    file_path: row.file_path ?? undefined,
    file_size: row.file_size ?? undefined,
    extracted_text: row.extracted_text,
    word_count: row.word_count,
    metadata: row.metadata as SourceMetadata | undefined,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

/**
 * データベース結果をGeneratedPost型にマッピング
 */
function mapGeneratedPostToType(
  row: typeof generatedPosts.$inferSelect
): GeneratedPost {
  return {
    id: row.id,
    source_id: row.source_id,
    style: row.style as GenerationStyle,
    content: row.content,
    char_count: row.char_count,
    created_at: row.created_at.toISOString(),
  };
}
