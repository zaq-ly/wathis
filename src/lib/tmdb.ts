import { SearchResultItem, TMDBRawDetail, TMDBRawSearchResult } from '@/types/watchlist';
import { formatYear } from './utils';

// Standard TMDB Genre ID dictionary
export const TMDB_GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const DEFAULT_TMDB_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb';

function getApiKey(): string {
  return process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || DEFAULT_TMDB_KEY;
}

export async function searchTMDB(query: string): Promise<SearchResultItem[]> {
  if (!query || !query.trim()) return [];

  const apiKey = getApiKey();
  const url = `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(query.trim())}&api_key=${apiKey}&include_adult=false&language=en-US&page=1`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error(`TMDB search HTTP error: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const results: TMDBRawSearchResult[] = data.results || [];

    // Filter only movie & tv (skip persons)
    return results
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv' || (!item.media_type && (item.title || item.name)))
      .map((item) => {
        const isTv = item.media_type === 'tv' || (!item.title && !!item.name);
        const title = isTv ? (item.name || item.original_name || 'Untitled') : (item.title || item.original_title || 'Untitled');
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
  } catch (error) {
    console.error('Failed to query TMDB:', error);
    return [];
  }
}

export async function getTMDBDetails(id: number, mediaType: 'movie' | 'tv'): Promise<SearchResultItem | null> {
  const apiKey = getApiKey();
  const url = `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${apiKey}&language=en-US`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      console.error(`TMDB details error: ${res.status}`);
      return null;
    }

    const data: TMDBRawDetail = await res.json();
    const isTv = mediaType === 'tv';
    const title = isTv ? (data.name || data.original_name || 'Untitled') : (data.title || data.original_title || 'Untitled');
    const origTitle = isTv ? data.original_name : data.original_title;
    const releaseDate = isTv ? data.first_air_date : data.release_date;
    const genres = (data.genres || []).map((g) => g.name);
    const rating = data.vote_average ? Math.round(data.vote_average * 10) / 10 : null;

    return {
      tmdb_id: data.id,
      title,
      original_title: origTitle && origTitle !== title ? origTitle : undefined,
      media_type: mediaType,
      release_year: formatYear(releaseDate),
      poster_path: data.poster_path || null,
      backdrop_path: data.backdrop_path || null,
      genres,
      season_count: isTv ? (data.number_of_seasons || 1) : null,
      overview: data.overview || '',
      vote_average: rating,
    };
  } catch (error) {
    console.error('Failed to get TMDB details:', error);
    return null;
  }
}
