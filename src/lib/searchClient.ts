import { SearchResultItem, TMDBRawSearchResult } from '@/types/watchlist';
import { TMDB_GENRES } from './tmdb';
import { formatYear } from './utils';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const CLIENT_TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '15d2ea6d0dc1d476efbca3eba2b9bbfb';

export async function fetchTMDBSearch(query: string): Promise<SearchResultItem[]> {
  if (!query || !query.trim()) return [];

  // 1. Try local Next.js API Route first
  try {
    const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query.trim())}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        return data.results;
      }
    }
  } catch {
    // Continue to fallback
  }

  // 2. Direct TMDB API Fallback (CORS-enabled public API)
  try {
    const directUrl = `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(
      query.trim()
    )}&api_key=${CLIENT_TMDB_KEY}&include_adult=false&language=id-ID&page=1`;

    const res = await fetch(directUrl);
    if (!res.ok) return [];

    const data = await res.json();
    const results: TMDBRawSearchResult[] = data.results || [];

    return results
      .filter(
        (item) =>
          item.media_type === 'movie' ||
          item.media_type === 'tv' ||
          (!item.media_type && (item.title || item.name))
      )
      .map((item) => {
        const isTv = item.media_type === 'tv' || (!item.title && !!item.name);
        const title = isTv
          ? item.name || item.original_name || 'Untitled'
          : item.title || item.original_title || 'Untitled';
        const origTitle = isTv ? item.original_name : item.original_title;
        const releaseDate = isTv ? item.first_air_date : item.release_date;
        const genres = (item.genre_ids || []).map((id) => TMDB_GENRES[id]).filter(Boolean);
        const rating = item.vote_average ? Math.round(item.vote_average * 10) / 10 : null;

        return {
          tmdb_id: item.id,
          title,
          original_title: origTitle && origTitle !== title ? origTitle : undefined,
          media_type: isTv ? 'tv' : 'movie',
          release_year: formatYear(releaseDate),
          poster_path: item.poster_path || null,
          backdrop_path: item.backdrop_path || null,
          genres,
          season_count: isTv ? 1 : null,
          overview: item.overview || '',
          vote_average: rating,
        };
      });
  } catch (err) {
    console.warn('Direct TMDB query notice:', err);
    return [];
  }
}
