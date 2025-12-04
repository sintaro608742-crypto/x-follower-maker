/**
 * Sources Service
 *
 * ソースライブラリのビジネスロジック層
 */

import {
  getSourcesByUserId,
  getSourceById,
  createSource,
  deleteSource,
  getGeneratedPostsBySourceId,
  createGeneratedPosts,
  type CreateSourceInput,
  type CreateGeneratedPostInput,
} from '@/repositories/sources.repository';
import { fetchUrlContent, isValidUrl } from '@/lib/jina-reader';
import { generatePostsFromSource } from '@/lib/gemini';
import type {
  Source,
  GeneratedPost,
  SourceType,
  GenerationStyle,
  SourceCreateFromUrlRequest,
  SourceCreateResponse,
  SourceListResponse,
  SourceGeneratePostsRequest,
  SourceGeneratePostsResponse,
} from '@/types';

/**
 * ユーザーのソース一覧を取得
 */
export async function getSourcesService(userId: string): Promise<SourceListResponse> {
  const sources = await getSourcesByUserId(userId);
  return {
    sources,
    total: sources.length,
  };
}

/**
 * ソースをIDで取得（所有権チェック付き）
 */
export async function getSourceByIdService(
  sourceId: string,
  userId: string
): Promise<Source> {
  const source = await getSourceById(sourceId);

  if (!source) {
    throw new Error('ソースが見つかりません');
  }

  if (source.user_id !== userId) {
    throw new Error('このソースにアクセスする権限がありません');
  }

  return source;
}

/**
 * URLからソースを作成
 */
export async function createSourceFromUrlService(
  userId: string,
  request: SourceCreateFromUrlRequest
): Promise<SourceCreateResponse> {
  // URLのバリデーション
  if (!isValidUrl(request.url)) {
    throw new Error('無効なURLです。http:// または https:// で始まるURLを入力してください。');
  }

  // URLからコンテンツを取得
  const content = await fetchUrlContent(request.url);

  // ソースを作成
  const input: CreateSourceInput = {
    userId,
    title: request.title || content.title,
    sourceType: 'url',
    sourceUrl: request.url,
    extractedText: content.content,
    wordCount: content.wordCount,
    metadata: {
      domain: content.metadata.domain,
      author: content.metadata.author,
      published_date: content.metadata.publishedDate,
    },
  };

  const source = await createSource(input);

  return {
    source,
    message: 'ソースを追加しました',
  };
}

/**
 * ファイルからソースを作成
 * （ファイルの解析は呼び出し側で行う必要があります）
 */
export async function createSourceFromFileService(
  userId: string,
  title: string,
  sourceType: SourceType,
  filePath: string,
  fileSize: number,
  extractedText: string,
  wordCount: number
): Promise<SourceCreateResponse> {
  const input: CreateSourceInput = {
    userId,
    title,
    sourceType,
    filePath,
    fileSize,
    extractedText,
    wordCount,
  };

  const source = await createSource(input);

  return {
    source,
    message: 'ソースを追加しました',
  };
}

/**
 * ソースを削除（所有権チェック付き）
 */
export async function deleteSourceService(
  sourceId: string,
  userId: string
): Promise<void> {
  // 所有権チェック
  await getSourceByIdService(sourceId, userId);

  const deleted = await deleteSource(sourceId);

  if (!deleted) {
    throw new Error('ソースの削除に失敗しました');
  }
}

/**
 * ソースから投稿を生成
 */
export async function generatePostsFromSourceService(
  userId: string,
  request: SourceGeneratePostsRequest
): Promise<SourceGeneratePostsResponse> {
  // ソースを取得（所有権チェック付き）
  const source = await getSourceByIdService(request.source_id, userId);

  // Gemini APIを使って投稿を生成
  const generatedContents = await generatePostsFromSource(
    source.extracted_text,
    source.title,
    request.style,
    request.count,
    request.custom_prompt
  );

  // 生成された投稿をデータベースに保存
  const inputs: CreateGeneratedPostInput[] = generatedContents.map((content) => ({
    userId,
    sourceId: source.id,
    style: request.style,
    content,
    charCount: content.length,
  }));

  const generatedPosts = await createGeneratedPosts(inputs);

  return {
    posts: generatedPosts,
    source_title: source.title,
    style: request.style,
    message: `${generatedPosts.length}件の投稿を生成しました`,
  };
}

/**
 * ソースの生成投稿一覧を取得
 */
export async function getGeneratedPostsService(
  sourceId: string,
  userId: string
): Promise<GeneratedPost[]> {
  // 所有権チェック
  await getSourceByIdService(sourceId, userId);

  return await getGeneratedPostsBySourceId(sourceId);
}

/**
 * 生成スタイルの情報を取得
 */
export function getGenerationStyleInfo(style: GenerationStyle) {
  const styles = {
    summary: {
      id: 'summary' as const,
      title: '要約・解説型',
      description: 'ソースの内容をわかりやすく要約して伝える',
      icon: 'book-open',
    },
    opinion: {
      id: 'opinion' as const,
      title: '意見・考察型',
      description: 'ソースを踏まえた自分の意見や考察を発信',
      icon: 'message-circle',
    },
    quote: {
      id: 'quote' as const,
      title: '引用＋補足型',
      description: '重要なポイントを引用し、補足説明を加える',
      icon: 'quote',
    },
  };

  return styles[style];
}
