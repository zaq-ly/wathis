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

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json;charset=utf-8',
  };
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN;
  if (token && token !== 'your_tmdb_access_token_here') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function getApiKeyParam(): string {
  const key = process.env.TMDB_API_KEY;
  if (key && key !== 'your_tmdb_api_key_here') {
    return `api_key=${key}`;
  }
  return '';
}

export async function searchTMDB(query: string): Promise<SearchResultItem[]> {
  if (!query || !query.trim()) return [];

  const headers = getAuthHeaders();
  const apiKeyParam = getApiKeyParam();

  let url = `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;
  if (apiKeyParam && !headers.Authorization) {
    url += `&${apiKeyParam}`;
  }

  try {
    const res = await fetch(url, { headers, next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error(`TMDB search error: ${res.status} ${res.statusText}`);
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
        const releaseDate = isTv ? item.first_air_date : item.release_date;
        const genres = (item.genre_ids || []).map((id) => TMDB_GENRES[id]).filter(Boolean);

        return {
          tmdb_id: item.id,
          title,
          media_type: isTv ? 'tv' : 'movie',
          release_year: formatYear(releaseDate),
          poster_path: item.poster_path || null,
          backdrop_path: item.backdrop_path || null,
          genres,
          season_count: isTv ? 1 : null,
          overview: item.overview || '',
        };
      });
  } catch (error) {
    console.error('Failed to query TMDB:', error);
    return [];
  }
}

export async function getTMDBDetails(id: number, mediaType: 'movie' | 'tv'): Promise<SearchResultItem | null> {
  const headers = getAuthHeaders();
  const apiKeyParam = getApiKeyParam();

  let url = `${TMDB_BASE_URL}/${mediaType}/${id}?language=en-US`;
  if (apiKeyParam && !headers.Authorization) {
    url += `&${apiKeyParam}`;
  }

  try {
    const res = await fetch(url, { headers, next: { revalidate: 86400 } });
    if (!res.ok) {
      console.error(`TMDB details error: ${res.status}`);
      return null;
    }

    const data: TMDBRawDetail = await res.json();
    const isTv = mediaType === 'tv';
    const title = isTv ? (data.name || data.original_name || 'Untitled') : (data.title || data.original_title || 'Untitled');
    const releaseDate = isTv ? data.first_air_date : data.release_date;
    const genres = (data.genres || []).map((g) => g.name);

    return {
      tmdb_id: data.id,
      title,
      media_type: mediaType,
      release_year: formatYear(releaseDate),
      poster_path: data.poster_path || null,
      backdrop_path: data.backdrop_path || null,
      genres,
      season_count: isTv ? (data.number_of_seasons || 1) : null,
      overview: data.overview || '',
    };
  } catch (error) {
    console.error('Failed to get TMDB details:', error);
    return null;
  }
}
