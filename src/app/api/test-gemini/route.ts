/**
 * Test Gemini API Route
 *
 * GET /api/test-gemini
 * Gemini APIの動作確認用エンドポイント
 */

import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json({
        status: 'error',
        message: 'GEMINI_API_KEY is not configured',
        keyLength: 0
      }, { status: 500 });
    }

    // APIキーの最初と最後の4文字を表示（セキュリティのため中間は隠す）
    const maskedKey = apiKey.length > 8
      ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
      : '****';

    // 簡単なGemini APIテスト（gemini-pro、v1beta API）
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Say "Hello" in Japanese.' }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 50,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({
        status: 'error',
        message: 'Gemini API call failed',
        httpStatus: response.status,
        error: errorData,
        keyLength: apiKey.length,
        maskedKey
      }, { status: 500 });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({
      status: 'success',
      message: 'Gemini API is working',
      keyLength: apiKey.length,
      maskedKey,
      generatedText
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
