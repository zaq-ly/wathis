import { NextRequest, NextResponse } from 'next/server';
import { getTMDBDetails } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const idStr = searchParams.get('id');
  const type = searchParams.get('type') as 'movie' | 'tv' | null;

  if (!idStr || !type) {
    return NextResponse.json({ error: 'Missing id or type parameters' }, { status: 400 });
  }

  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const details = await getTMDBDetails(id, type);
    if (!details) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ item: details });
  } catch (error) {
    console.error('API TMDB Detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
  }
}
