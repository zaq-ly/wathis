import { NextRequest, NextResponse } from 'next/server';
import { searchTMDB } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || !query.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchTMDB(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('API TMDB Search error:', error);
    return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
  }
}
