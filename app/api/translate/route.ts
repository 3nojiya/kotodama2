import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, targetLang } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'テキストがありません。' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({ error: 'APIキーがサーバーに設定されていません。' }, { status: 500 });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Translate the following text to the target language code (${targetLang}). Output only the translated text without extra explanation:\n\n${text}` }]
        }]
      })
    });

    const data = await response.json();
    const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('サーバーサイド翻訳エラー:', error);
    return NextResponse.json({ error: '翻訳処理に失敗しました。' }, { status: 500 });
  }
}