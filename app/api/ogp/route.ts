// app/api/ogp/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OGP-Bot',
      },
    });

    const html = await res.text();

    // 簡易的な正規表現でOGPタグを抽出
    const getMetaContent = (property: string) => {
      const match = html.match(new RegExp(`<meta[^>]*property=["'](?:og:${property}|twitter:${property})["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i')) ||
                    html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["'](?:og:${property}|twitter:${property})["'][^>]*>`, 'i'));
      return match ? match[1] : null;
    };

    const title = getMetaContent('title') || html.match(/<title>([^<]+)<\/title>/i)?.[1] || targetUrl;
    const description = getMetaContent('description') || '';
    const image = getMetaContent('image') || '';

    let domain = targetUrl;
    try {
      domain = new URL(targetUrl).hostname;
    } catch (e) {}

    return NextResponse.json({
      title,
      description,
      image,
      domain,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch OGP' }, { status: 500 });
  }
}