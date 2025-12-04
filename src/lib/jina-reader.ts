/**
 * Jina.ai Reader API ユーティリティ
 *
 * WebページからLLM向けのMarkdownテキストを抽出します。
 * 無料で利用可能（20 RPM制限）
 *
 * @see https://jina.ai/reader
 */

export interface JinaReaderResult {
  title: string;
  content: string;
  url: string;
  wordCount: number;
  metadata: {
    domain: string;
    description?: string;
    author?: string;
    publishedDate?: string;
  };
}

export interface JinaReaderError {
  error: string;
  message: string;
}

/**
 * Jina Reader JSON レスポンス型
 */
interface JinaJsonResponse {
  code: number;
  status: number;
  data: {
    title: string;
    description?: string;
    url: string;
    content: string;
    publishedTime?: string;
    author?: string;
  };
}

/**
 * URLからコンテンツを取得する
 * Jina.ai Reader APIを使用してWebページをMarkdown形式で取得
 *
 * @param url 取得するURL
 * @returns 抽出されたコンテンツ
 */
export async function fetchUrlContent(url: string): Promise<JinaReaderResult> {
  // URL のバリデーション
  const parsedUrl = new URL(url);
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('http/https のみ対応しています');
  }

  // Jina.ai Reader API を呼び出し（JSON形式）
  const jinaUrl = `https://r.jina.ai/${url}`;

  const response = await fetch(jinaUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jina Reader API エラー: ${response.status} - ${errorText}`);
  }

  // JSON レスポンスをパース
  const jsonResponse = await response.json() as JinaJsonResponse;

  // デバッグログ
  console.log('[Jina Reader] Response:', {
    code: jsonResponse.code,
    status: jsonResponse.status,
    title: jsonResponse.data?.title,
    hasContent: !!jsonResponse.data?.content,
    contentLength: jsonResponse.data?.content?.length || 0,
    contentPreview: jsonResponse.data?.content?.substring(0, 500) || '(empty)',
  });

  // データが空の場合
  if (!jsonResponse.data || !jsonResponse.data.content) {
    throw new Error('コンテンツを取得できませんでした。URLを確認してください。');
  }

  const { data } = jsonResponse;

  // タイトルを取得（優先順位: API title > ドメイン名）
  // 動的ページでは content から取得すると「loading」等のゴミが取れるため、
  // API title がない場合はドメイン名を使用
  let title = '';
  if (data.title && data.title.trim().length > 0 && !isUselessTitle(data.title)) {
    title = data.title.trim();
  } else {
    // ドメイン名を読みやすい形式に（例: utage-system.com → Utage System）
    title = formatDomainAsTitle(parsedUrl.hostname);
  }

  console.log('[Jina Reader] Extracted title:', title);

  // 単語数（日本語文字数）をカウント
  const wordCount = countWords(data.content);

  return {
    title,
    content: data.content,
    url: data.url || url,
    wordCount,
    metadata: {
      domain: parsedUrl.hostname,
      description: data.description || extractDescription(data.content),
      author: data.author,
      publishedDate: data.publishedTime,
    },
  };
}

/**
 * 意味のないタイトルかどうかをチェック
 */
function isUselessTitle(title: string): boolean {
  const uselessPatterns = [
    /^loading/i,
    /^please wait/i,
    /^読み込み中/i,
    /^お待ちください/i,
    /^untitled/i,
    /^無題/i,
    /^video player/i,
    /^404/i,
    /^error/i,
  ];

  const normalizedTitle = title.trim().toLowerCase();
  return uselessPatterns.some(pattern => pattern.test(normalizedTitle));
}

/**
 * 有名サイトの日本語/ブランド名マッピング
 */
const SITE_NAME_MAPPING: Record<string, string> = {
  // 日本の有名サービス
  'gigazine': 'GIGAZINE',
  'utage-system': 'UTAGE（ウタゲ）',
  'note': 'note',
  'qiita': 'Qiita',
  'zenn': 'Zenn',
  'hatena': 'はてな',
  'hatenablog': 'はてなブログ',
  'ameblo': 'アメブロ',
  'livedoor': 'livedoor',
  'yahoo': 'Yahoo! JAPAN',
  'rakuten': '楽天',
  'mercari': 'メルカリ',
  'cookpad': 'クックパッド',
  'tabelog': '食べログ',
  'hotpepper': 'ホットペッパー',
  'recruit': 'リクルート',
  'cyberagent': 'サイバーエージェント',
  'dena': 'DeNA',
  'gree': 'GREE',
  'mixi': 'mixi',
  'line': 'LINE',
  'pixiv': 'pixiv',
  'niconico': 'ニコニコ',
  'nicovideo': 'ニコニコ動画',
  'abema': 'ABEMA',
  'newspicks': 'NewsPicks',
  'prtimes': 'PR TIMES',
  'itmedia': 'ITmedia',
  'impress': 'Impress Watch',
  'ascii': 'ASCII.jp',
  'gizmodo': 'ギズモード・ジャパン',
  'lifehacker': 'ライフハッカー',
  'techcrunch': 'TechCrunch Japan',
  'wired': 'WIRED.jp',
  'nikkei': '日本経済新聞',
  'asahi': '朝日新聞',
  'yomiuri': '読売新聞',
  'mainichi': '毎日新聞',
  'sankei': '産経新聞',
  'nhk': 'NHK',
  'tv-asahi': 'テレビ朝日',
  'tbs': 'TBS',
  'fujitv': 'フジテレビ',
  'ntv': '日本テレビ',
  // 海外サービス
  'github': 'GitHub',
  'twitter': 'X（旧Twitter）',
  'x': 'X',
  'facebook': 'Facebook',
  'instagram': 'Instagram',
  'youtube': 'YouTube',
  'tiktok': 'TikTok',
  'linkedin': 'LinkedIn',
  'medium': 'Medium',
  'substack': 'Substack',
  'reddit': 'Reddit',
  'stackoverflow': 'Stack Overflow',
  'wikipedia': 'Wikipedia',
  'amazon': 'Amazon',
  'google': 'Google',
  'apple': 'Apple',
  'microsoft': 'Microsoft',
};

/**
 * ドメイン名を読みやすいタイトルに変換
 * 例: utage-system.com → UTAGE（ウタゲ）
 *     gigazine.net → GIGAZINE
 */
function formatDomainAsTitle(hostname: string): string {
  // www. を除去
  let domain = hostname.replace(/^www\./, '');

  // TLD (.com, .net, .co.jp 等) を除去
  domain = domain.replace(/\.(com|net|org|co\.jp|jp|io|app|dev|me|tv|blog)$/i, '');

  // サブドメインを除去（例: blog.example → example）
  const parts = domain.split('.');
  if (parts.length > 1) {
    domain = parts[parts.length - 1];
  }

  // 既知のサイト名マッピングをチェック
  const lowerDomain = domain.toLowerCase();
  if (SITE_NAME_MAPPING[lowerDomain]) {
    return SITE_NAME_MAPPING[lowerDomain];
  }

  // 一般的な接尾辞を除去（-system, -app, -web 等）
  const cleanDomain = domain
    .replace(/[-_](system|app|web|site|online|japan|jp|official)$/i, '')
    .replace(/^(the|my)[-_]/i, '');

  // クリーンなドメインでもう一度マッピングをチェック
  const cleanLower = cleanDomain.toLowerCase();
  if (SITE_NAME_MAPPING[cleanLower]) {
    return SITE_NAME_MAPPING[cleanLower];
  }

  // マッピングにない場合は大文字で表示（ブランド名らしく）
  return cleanDomain.toUpperCase();
}

/**
 * URLからタイトルを生成
 */
function extractTitleFromUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;

    // パス名からタイトルを生成
    if (pathname && pathname !== '/') {
      const segments = pathname.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      // ファイル拡張子を除去
      const title = lastSegment.replace(/\.(html?|php|aspx?)$/i, '');
      // ハイフンやアンダースコアをスペースに変換
      return title.replace(/[-_]/g, ' ');
    }

    return parsedUrl.hostname;
  } catch {
    return 'Untitled';
  }
}

/**
 * コンテンツから説明文を抽出
 */
function extractDescription(content: string): string | undefined {
  // 最初の段落を説明として使用
  const lines = content.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith('#') && !trimmed.startsWith('!');
  });

  if (lines.length > 0) {
    const firstParagraph = lines[0].trim();
    // 200文字に制限
    return firstParagraph.length > 200
      ? firstParagraph.substring(0, 200) + '...'
      : firstParagraph;
  }

  return undefined;
}

/**
 * 単語数（文字数）をカウント
 * 日本語の場合は文字数、英語の場合は単語数
 */
function countWords(text: string): number {
  // HTMLタグを除去
  const cleanText = text.replace(/<[^>]*>/g, '');

  // Markdown記法を除去
  const plainText = cleanText
    .replace(/#{1,6}\s/g, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // 文字数をカウント（空白を除く）
  return plainText.replace(/\s/g, '').length;
}

/**
 * URLが有効かどうかをチェック
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}
