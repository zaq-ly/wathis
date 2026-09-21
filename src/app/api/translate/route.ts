import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, from = 'en', to = 'id' } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ translatedText: '' });
    }

    const trimmed = text.trim();

    // Split text into chunks under 400 chars to respect API limits
    const sentences = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [trimmed];
    const chunks: string[] = [];
    let current = '';

    for (const s of sentences) {
      if ((current + s).length > 400) {
        if (current) chunks.push(current.trim());
        current = s;
      } else {
        current += s;
      }
    }
    if (current.trim()) chunks.push(current.trim());

    const results = await Promise.all(
      chunks.map(async (c) => {
        try {
          const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(c)}&langpair=${from}|${to}&de=wathis_app@gmail.com`;
          const res = await fetch(url, { next: { revalidate: 86400 } });
          if (!res.ok) return c;
          const data = await res.json();
          return data.responseData?.translatedText || c;
        } catch {
          return c;
        }
      })
    );

    const translatedText = results.join(' ');
    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ translatedText: '' }, { status: 500 });
  }
}
