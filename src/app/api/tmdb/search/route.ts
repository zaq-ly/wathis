import { NextResponse } from 'next/server';
import { searchTMDB } from '@/lib/tmdb';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || !query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchTMDB(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('API TMDB Search error:', error);
    return NextResponse.json({ results: [] });
  }
}
