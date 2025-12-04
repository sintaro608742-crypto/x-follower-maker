/**
 * Google Gemini API Integration
 *
 * このファイルはGoogle Gemini APIを使用してAI投稿を生成する機能を提供します。
 *
 * 使用モデル: gemini-2.0-flash
 * レート制限: 15 RPM（無料枠）
 * 無料枠: 1,500リクエスト/日
 */

import { ExternalServiceError, RateLimitError } from '@/lib/errors';

/**
 * Gemini API投稿生成オプション
 */
export interface GeneratePostOptions {
  keywords: string[];
  count?: number;
  tone?: string;
}

/**
 * トーンに応じた指示文を取得
 */
function getToneInstruction(tone: string): string {
  const toneInstructions: Record<string, string> = {
    casual: '親しみやすく気軽な雰囲気で、フランクな語調で書いてください。',
    professional: '信頼感のある丁寧な表現で、専門性を感じさせる内容にしてください。',
    humorous: '面白く印象に残る内容で、ユーモアのセンスを交えてください。',
    educational: '役立つ情報を分かりやすく、教育的な視点で書いてください。',
  };
  return toneInstructions[tone] || toneInstructions.casual;
}

/**
 * Gemini API投稿生成レスポンス
 */
export interface GeneratePostResponse {
  tweets: string[];
}

/**
 * Gemini APIエラー型
 */
interface GeminiApiError {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

/**
 * 待機関数（指数バックオフ用）
 *
 * @param ms - ミリ秒
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gemini APIを使用して投稿を生成（リトライ機能付き）
 *
 * @param options - 投稿生成オプション
 * @returns 生成された投稿配列
 * @throws {RateLimitError} レート制限超過
 * @throws {ExternalServiceError} Gemini APIエラー
 */
export async function generatePosts(options: GeneratePostOptions): Promise<string[]> {
  const { keywords, count = 1, tone = 'casual' } = options;

  // APIキーの確認（改行文字を除去）
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new ExternalServiceError('Gemini API', new Error('GEMINI_API_KEY is not configured'));
  }

  // トーン指示を取得
  const toneInstruction = getToneInstruction(tone);

  // プロンプト構築
  const systemPrompt = `あなたはX（Twitter）の投稿を生成する専門家です。
ユーザーの興味関心に基づいて、エンゲージメントが高い魅力的なツイートを作成してください。`;

  const userPrompt = `以下のキーワードに関する有益で魅力的なツイートを${count}件生成してください。
キーワード: ${keywords.join(', ')}

トーン・スタイル: ${toneInstruction}

条件:
- 各ツイートは280文字以内（日本語）
- 自然で読みやすい表現
- ハッシュタグは最大2つまで
- 絵文字は控えめに使用
- スパムと判定されない内容
- 指定されたトーンを一貫して維持

JSON形式で返却:
{"tweets": ["ツイート1", "ツイート2", ...]}`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: systemPrompt + '\n\n' + userPrompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  };

  // リトライロジック（最大3回、指数バックオフ: 1秒、2秒、4秒）
  const maxRetries = 3;
  const retryDelays = [1000, 2000, 4000]; // ミリ秒

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Gemini API呼び出し
      // Using v1beta API with gemini-2.0-flash model
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      // レスポンス確認
      if (!response.ok) {
        const errorData = (await response.json()) as GeminiApiError;

        // デバッグ用：エラーの詳細をログ出力（開発環境のみ）
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
          console.error('Gemini API Error:', {
            attempt: attempt + 1,
            status: response.status,
            statusText: response.statusText,
            errorData,
          });
        }

        // レート制限エラー（リトライしない、即座に失敗）
        if (response.status === 429) {
          throw new RateLimitError(
            'Gemini API rate limit exceeded. Please try again in a few moments.'
          );
        }

        // その他のAPIエラー（リトライ対象）
        lastError = new ExternalServiceError(
          'Gemini API',
          new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
        );

        // 最後の試行でない場合はリトライ
        if (attempt < maxRetries - 1) {
          const delay = retryDelays[attempt];
          if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
            console.log(`Retrying in ${delay}ms... (attempt ${attempt + 2}/${maxRetries})`);
          }
          await sleep(delay);
          continue;
        }

        // 最後の試行で失敗した場合はエラーをスロー
        throw lastError;
      }

      const data = await response.json() as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      };

      // レスポンスのパース
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        lastError = new ExternalServiceError(
          'Gemini API',
          new Error('Invalid response format: missing generated text')
        );

        // 最後の試行でない場合はリトライ
        if (attempt < maxRetries - 1) {
          const delay = retryDelays[attempt];
          if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
            console.log(`Invalid response format, retrying in ${delay}ms... (attempt ${attempt + 2}/${maxRetries})`);
          }
          await sleep(delay);
          continue;
        }

        throw lastError;
      }

      // JSONパース（マークダウンコードブロックを除去）
      let jsonText = generatedText.trim();
      // ```json ... ``` や ``` ... ``` を除去
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      console.log('[Gemini API] Parsing JSON response:', jsonText.substring(0, 200));

      let parsedResponse: GeneratePostResponse;
      try {
        parsedResponse = JSON.parse(jsonText) as GeneratePostResponse;
      } catch (parseError) {
        console.error('[Gemini API] JSON parse failed. Raw text:', generatedText.substring(0, 500));
        lastError = new ExternalServiceError(
          'Gemini API',
          new Error(`Failed to parse JSON response: ${(parseError as Error).message}`)
        );

        // 最後の試行でない場合はリトライ
        if (attempt < maxRetries - 1) {
          const delay = retryDelays[attempt];
          if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
            console.log(`JSON parse error, retrying in ${delay}ms... (attempt ${attempt + 2}/${maxRetries})`);
          }
          await sleep(delay);
          continue;
        }

        throw lastError;
      }

      // 検証
      if (!parsedResponse.tweets || !Array.isArray(parsedResponse.tweets)) {
        lastError = new ExternalServiceError(
          'Gemini API',
          new Error('Invalid response format: tweets array is missing')
        );

        // 最後の試行でない場合はリトライ
        if (attempt < maxRetries - 1) {
          const delay = retryDelays[attempt];
          if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
            console.log(`Invalid tweets array, retrying in ${delay}ms... (attempt ${attempt + 2}/${maxRetries})`);
          }
          await sleep(delay);
          continue;
        }

        throw lastError;
      }

      if (parsedResponse.tweets.length === 0) {
        lastError = new ExternalServiceError(
          'Gemini API',
          new Error('No tweets generated')
        );

        // 最後の試行でない場合はリトライ
        if (attempt < maxRetries - 1) {
          const delay = retryDelays[attempt];
          if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
            console.log(`No tweets generated, retrying in ${delay}ms... (attempt ${attempt + 2}/${maxRetries})`);
          }
          await sleep(delay);
          continue;
        }

        throw lastError;
      }

      // 280文字制限チェック
      const validTweets = parsedResponse.tweets.filter((tweet) => tweet.length <= 280 && tweet.length > 0);

      if (validTweets.length === 0) {
        lastError = new ExternalServiceError(
          'Gemini API',
          new Error('All generated tweets exceed 280 characters or are empty')
        );

        // 最後の試行でない場合はリトライ
        if (attempt < maxRetries - 1) {
          const delay = retryDelays[attempt];
          if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
            console.log(`Invalid tweet length, retrying in ${delay}ms... (attempt ${attempt + 2}/${maxRetries})`);
          }
          await sleep(delay);
          continue;
        }

        throw lastError;
      }

      // 成功した場合は結果を返す
      return validTweets;
    } catch (error) {
      // RateLimitErrorは即座に失敗（リトライしない）
      if (error instanceof RateLimitError) {
        throw error;
      }

      // ExternalServiceErrorはリトライ対象
      if (error instanceof ExternalServiceError) {
        lastError = error;

        // 最後の試行でない場合はリトライ
        if (attempt < maxRetries - 1) {
          const delay = retryDelays[attempt];
          if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
            console.log(`External service error, retrying in ${delay}ms... (attempt ${attempt + 2}/${maxRetries})`);
          }
          await sleep(delay);
          continue;
        }

        throw lastError;
      }

      // ネットワークエラーなど（リトライ対象）
      lastError = new ExternalServiceError(
        'Gemini API',
        error instanceof Error ? error : new Error('Unknown error occurred')
      );

      // 最後の試行でない場合はリトライ
      if (attempt < maxRetries - 1) {
        const delay = retryDelays[attempt];
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
          console.log(`Network error, retrying in ${delay}ms... (attempt ${attempt + 2}/${maxRetries})`);
        }
        await sleep(delay);
        continue;
      }

      throw lastError;
    }
  }

  // すべてのリトライが失敗した場合
  throw lastError || new ExternalServiceError('Gemini API', new Error('All retries failed'));
}

/**
 * 単一の投稿を再生成
 *
 * @param keywords - キーワード配列
 * @returns 生成された投稿内容
 * @throws {RateLimitError} レート制限超過
 * @throws {ExternalServiceError} Gemini APIエラー
 */
export async function regenerateSinglePost(keywords: string[]): Promise<string> {
  const tweets = await generatePosts({ keywords, count: 1 });
  return tweets[0];
}

/**
 * 生成スタイル型
 */
export type SourceGenerationStyle = 'summary' | 'opinion' | 'quote';

/**
 * スタイルに応じたプロンプト指示を取得
 */
function getStyleInstruction(style: SourceGenerationStyle): string {
  const styleInstructions: Record<SourceGenerationStyle, string> = {
    summary: `【要約・解説型】
- ソースの内容を読者にわかりやすく要約・解説してください
- 専門用語があれば噛み砕いて説明
- 「〜とは」「〜のポイントは」などの表現を使用
- 読者が学びを得られる内容に`,
    opinion: `【意見・考察型】
- ソースの内容を踏まえた自分の意見や考察を発信
- 「〜と思う」「〜ではないだろうか」などの主観的表現を使用
- 独自の視点や気づきを加える
- 読者の共感や議論を促す内容に`,
    quote: `【引用＋補足型】
- ソースから重要なポイントを引用（「」で囲む）
- 引用部分に対する補足説明や解釈を加える
- 「これは〜を意味する」「つまり〜ということ」などの表現
- 出典を示唆する表現を含める`,
  };
  return styleInstructions[style];
}

/**
 * ソースからの投稿生成オプション
 */
export interface GenerateFromSourceOptions {
  sourceContent: string;
  sourceTitle: string;
  style: SourceGenerationStyle;
  count: number;
}

/**
 * ソースから投稿を生成
 *
 * @param sourceContent - ソースのテキスト内容
 * @param sourceTitle - ソースのタイトル
 * @param style - 生成スタイル
 * @param count - 生成する投稿数
 * @param customPrompt - カスタム指示（任意）
 * @returns 生成された投稿配列
 * @throws {RateLimitError} レート制限超過
 * @throws {ExternalServiceError} Gemini APIエラー
 */
export async function generatePostsFromSource(
  sourceContent: string,
  sourceTitle: string,
  style: SourceGenerationStyle,
  count: number,
  customPrompt?: string
): Promise<string[]> {
  // APIキーの確認
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new ExternalServiceError('Gemini API', new Error('GEMINI_API_KEY is not configured'));
  }

  // スタイル指示を取得
  const styleInstruction = getStyleInstruction(style);

  // コンテンツを適切な長さに切り詰める（トークン制限対策）
  const maxContentLength = 30000; // 約30,000文字まで
  const truncatedContent = sourceContent.length > maxContentLength
    ? sourceContent.substring(0, maxContentLength) + '\n\n[...以下省略]'
    : sourceContent;

  // プロンプト構築
  const systemPrompt = `あなたはX（Twitter）の投稿を生成する専門家です。
与えられたソースコンテンツを深く理解し、そこから価値ある洞察を引き出して魅力的なツイートを作成してください。
表面的な内容ではなく、読者の心に響く深みのある投稿を生成してください。`;

  // カスタム指示セクションを構築
  const customPromptSection = customPrompt
    ? `\n【ユーザーからの追加指示】
${customPrompt}
`
    : '';

  const userPrompt = `以下のソースコンテンツに基づいて、X（Twitter）投稿を${count}件生成してください。

【ソースタイトル】
${sourceTitle}

【ソースコンテンツ】
${truncatedContent}

【生成スタイル】
${styleInstruction}
${customPromptSection}
【条件】
- 各投稿は280文字以内（日本語）
- ソースの内容を深く理解した上で生成
- 単なる要約ではなく、読者に価値を提供する内容
- 自然で読みやすい表現
- ハッシュタグは最大2つまで（関連性の高いもの）
- 絵文字は控えめに使用
- スパムと判定されない内容
- 各投稿は異なる切り口・視点で
${customPrompt ? '- 上記のユーザーからの追加指示を必ず反映' : ''}

JSON形式で返却:
{"tweets": ["投稿1", "投稿2", ...]}`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: systemPrompt + '\n\n' + userPrompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.8, // 創造性を少し高めに
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048, // 複数投稿に対応
    },
  };

  // リトライロジック
  const maxRetries = 3;
  const retryDelays = [1000, 2000, 4000];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as GeminiApiError;

        if (process.env.NODE_ENV === 'development') {
          console.error('[Gemini Source] API Error:', {
            attempt: attempt + 1,
            status: response.status,
            errorData,
          });
        }

        if (response.status === 429) {
          throw new RateLimitError('Gemini API rate limit exceeded');
        }

        lastError = new ExternalServiceError(
          'Gemini API',
          new Error(errorData.error?.message || `HTTP ${response.status}`)
        );

        if (attempt < maxRetries - 1) {
          await sleep(retryDelays[attempt]);
          continue;
        }
        throw lastError;
      }

      const data = await response.json() as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      };

      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        lastError = new ExternalServiceError('Gemini API', new Error('Empty response'));
        if (attempt < maxRetries - 1) {
          await sleep(retryDelays[attempt]);
          continue;
        }
        throw lastError;
      }

      // JSONパース
      let jsonText = generatedText.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }

      let parsedResponse: GeneratePostResponse;
      try {
        parsedResponse = JSON.parse(jsonText) as GeneratePostResponse;
      } catch (parseError) {
        console.error('[Gemini Source] JSON parse failed:', jsonText.substring(0, 500));
        lastError = new ExternalServiceError('Gemini API', new Error('JSON parse failed'));
        if (attempt < maxRetries - 1) {
          await sleep(retryDelays[attempt]);
          continue;
        }
        throw lastError;
      }

      if (!parsedResponse.tweets || !Array.isArray(parsedResponse.tweets) || parsedResponse.tweets.length === 0) {
        lastError = new ExternalServiceError('Gemini API', new Error('No tweets in response'));
        if (attempt < maxRetries - 1) {
          await sleep(retryDelays[attempt]);
          continue;
        }
        throw lastError;
      }

      // 280文字制限チェック
      const validTweets = parsedResponse.tweets.filter((tweet) => tweet.length <= 280 && tweet.length > 0);

      if (validTweets.length === 0) {
        lastError = new ExternalServiceError('Gemini API', new Error('All tweets invalid'));
        if (attempt < maxRetries - 1) {
          await sleep(retryDelays[attempt]);
          continue;
        }
        throw lastError;
      }

      // 要求された数に制限
      return validTweets.slice(0, count);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }

      lastError = error instanceof ExternalServiceError
        ? error
        : new ExternalServiceError('Gemini API', error instanceof Error ? error : new Error('Unknown error'));

      if (attempt < maxRetries - 1) {
        await sleep(retryDelays[attempt]);
        continue;
      }
      throw lastError;
    }
  }

  throw lastError || new ExternalServiceError('Gemini API', new Error('All retries failed'));
}
