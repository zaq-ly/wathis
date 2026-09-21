import { NextResponse } from 'next/server';
import { discoverTMDB } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaType = (searchParams.get('type') as any) || 'all';
    const genre = searchParams.get('genre') || undefined;
    const minRating = searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined;
    const sortBy = (searchParams.get('sort') as any) || 'popularity';
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const language = searchParams.get('lang') || 'id';

    const results = await discoverTMDB({
      mediaType,
      genre,
      minRating,
      sortBy,
      page,
      language,
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('API TMDB Discover error:', error);
    return NextResponse.json({ results: [] });
  }
}
