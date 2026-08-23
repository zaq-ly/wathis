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

async function executeTMDBSearch(queryText: string, apiKey: string): Promise<TMDBRawSearchResult[]> {
  const encodedQuery = encodeURIComponent(queryText.trim());
  const idUrl = `${TMDB_BASE_URL}/search/multi?query=${encodedQuery}&api_key=${apiKey}&include_adult=false&language=id-ID&page=1`;
  const enUrl = `${TMDB_BASE_URL}/search/multi?query=${encodedQuery}&api_key=${apiKey}&include_adult=false&language=en-US&page=1`;

  const [idRes, enRes] = await Promise.all([
    fetch(idUrl, { next: { revalidate: 3600 } }),
    fetch(enUrl, { next: { revalidate: 3600 } }),
  ]);

  const idData = idRes.ok ? await idRes.json() : { results: [] };
  const enData = enRes.ok ? await enRes.json() : { results: [] };

  const idResults: TMDBRawSearchResult[] = idData.results || [];
  const enResults: TMDBRawSearchResult[] = enData.results || [];

  // Merge results: keep all unique items from EN and ID
  const itemMap = new Map<number, { idItem?: TMDBRawSearchResult; enItem?: TMDBRawSearchResult }>();

  // Add EN results first (broadest coverage)
  for (const item of enResults) {
    if (item.media_type === 'movie' || item.media_type === 'tv' || (!item.media_type && (item.title || item.name))) {
      itemMap.set(item.id, { enItem: item });
    }
  }

  // Overlay ID results where available
  for (const item of idResults) {
    if (item.media_type === 'movie' || item.media_type === 'tv' || (!item.media_type && (item.title || item.name))) {
      const existing = itemMap.get(item.id);
      if (existing) {
        existing.idItem = item;
      } else {
        itemMap.set(item.id, { idItem: item });
      }
    }
  }

  const results: TMDBRawSearchResult[] = [];
  for (const [, { idItem, enItem }] of itemMap.entries()) {
    const primary = enItem || idItem;
    if (primary) {
      const enTitle = enItem?.title || enItem?.name;
      const idTitle = idItem?.title || idItem?.name;
      const primaryTitle = enTitle || idTitle || primary.title || primary.name || 'Untitled';
      const origTitle =
        enItem?.original_title ||
        enItem?.original_name ||
        idItem?.original_title ||
        idItem?.original_name ||
        primary.original_title ||
        primary.original_name;

      const merged: TMDBRawSearchResult = {
        ...primary,
        title: primaryTitle,
        name: primaryTitle,
        original_title: origTitle,
        original_name: origTitle,
        overview: idItem?.overview?.trim() || enItem?.overview?.trim() || primary.overview || '',
        poster_path: enItem?.poster_path || idItem?.poster_path || primary.poster_path,
        backdrop_path: enItem?.backdrop_path || idItem?.backdrop_path || primary.backdrop_path,
        vote_average: enItem?.vote_average || idItem?.vote_average || primary.vote_average,
        genre_ids: enItem?.genre_ids?.length ? enItem.genre_ids : idItem?.genre_ids || primary.genre_ids,
        first_air_date: enItem?.first_air_date || idItem?.first_air_date || primary.first_air_date,
        original_language: enItem?.original_language || idItem?.original_language || primary.original_language,
        origin_country: enItem?.origin_country || idItem?.origin_country || primary.origin_country,
      };
      results.push(merged);
    }
  }

  return results;
}

export async function searchTMDB(query: string): Promise<SearchResultItem[]> {
  if (!query || !query.trim()) return [];

  const apiKey = getApiKey();
  const trimmed = query.trim();

  try {
    // 1. Primary search
    let rawResults = await executeTMDBSearch(trimmed, apiKey);

    // 2. Fallback: if 0 results, clean punctuation and retry
    if (rawResults.length === 0) {
      // Remove years like (2023) or 2024
      const withoutYear = trimmed.replace(/\b[12]\d{3}\b/g, '').replace(/[\(\)\[\]]/g, '').trim();
      // Remove special symbols like dashes, colons
      const withoutSymbols = withoutYear.replace(/[:\-–_.,\/]/g, ' ').replace(/\s+/g, ' ').trim();

      if (withoutSymbols.length >= 2 && withoutSymbols.toLowerCase() !== trimmed.toLowerCase()) {
        rawResults = await executeTMDBSearch(withoutSymbols, apiKey);
      }
    }

    // 3. Fallback: if still 0 results, try first 3 words
    if (rawResults.length === 0 && trimmed.split(/\s+/).length > 2) {
      const firstWords = trimmed.split(/\s+/).slice(0, 2).join(' ');
      if (firstWords.length >= 3) {
        rawResults = await executeTMDBSearch(firstWords, apiKey);
      }
    }

    return rawResults.map((item) => {
      const isTv = item.media_type === 'tv' || (!item.title && !!item.name);
      const title = isTv
        ? item.name || item.original_name || 'Untitled'
        : item.title || item.original_title || 'Untitled';
      const origTitle = isTv ? item.original_name : item.original_title;
      const releaseDate = isTv ? item.first_air_date : item.release_date;
      const genres = (item.genre_ids || []).map((id) => TMDB_GENRES[id]).filter(Boolean);
      
      // Robust Anime detection
      const hasJapaneseOrigin =
        item.original_language === 'ja' ||
        item.origin_country?.includes('JP') ||
        /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(origTitle || '') ||
        /anime/i.test(title || '');
      const hasAnimationGenre = item.genre_ids?.includes(16) || genres.includes('Animation');

      if (hasAnimationGenre && (hasJapaneseOrigin || item.original_language === 'ja')) {
        if (!genres.includes('Anime')) genres.unshift('Anime');
      }

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
        overview: item.overview?.trim() || '',
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
  const idUrl = `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${apiKey}&language=id-ID`;
  const enUrl = `${TMDB_BASE_URL}/${mediaType}/${id}?api_key=${apiKey}&language=en-US`;

  try {
    const [idRes, enRes] = await Promise.all([
      fetch(idUrl, { next: { revalidate: 86400 } }),
      fetch(enUrl, { next: { revalidate: 86400 } }),
    ]);

    if (!idRes.ok && !enRes.ok) {
      console.error(`TMDB details error`);
      return null;
    }

    const idData: Partial<TMDBRawDetail> = idRes.ok ? await idRes.json() : {};
    const enData: Partial<TMDBRawDetail> = enRes.ok ? await enRes.json() : {};

    const isTv = mediaType === 'tv';
    const enTitle = isTv ? enData.name : enData.title;
    const idTitle = isTv ? idData.name : idData.title;
    const origTitle = isTv ? (enData.original_name || idData.original_name) : (enData.original_title || idData.original_title);
    const title = enTitle || idTitle || origTitle || 'Untitled';
    const releaseDate = isTv ? (enData.first_air_date || idData.first_air_date) : (enData.release_date || idData.release_date);
    const genres = ((enData.genres && enData.genres.length > 0) ? enData.genres : idData.genres || []).map((g) => g.name);
    
    // Robust Anime detection
    const hasJapaneseOrigin =
      enData.original_language === 'ja' ||
      idData.original_language === 'ja' ||
      enData.origin_country?.includes('JP') ||
      idData.origin_country?.includes('JP') ||
      /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(origTitle || '') ||
      /anime/i.test(title || '');
    const hasAnimationGenre = genres.includes('Animation') || (enData.genres || []).some(g => g.id === 16) || (idData.genres || []).some(g => g.id === 16);

    if (hasAnimationGenre && (hasJapaneseOrigin || enData.original_language === 'ja' || idData.original_language === 'ja')) {
      if (!genres.includes('Anime')) genres.unshift('Anime');
    }

    const rating = enData.vote_average || idData.vote_average ? Math.round((enData.vote_average || idData.vote_average || 0) * 10) / 10 : null;
    const overview = idData.overview?.trim() || enData.overview?.trim() || '';

    return {
      tmdb_id: id,
      title,
      original_title: origTitle && origTitle !== title ? origTitle : undefined,
      media_type: mediaType,
      release_year: formatYear(releaseDate),
      poster_path: enData.poster_path || idData.poster_path || null,
      backdrop_path: enData.backdrop_path || idData.backdrop_path || null,
      genres,
      season_count: isTv ? (enData.number_of_seasons || idData.number_of_seasons || 1) : null,
      overview,
      vote_average: rating,
    };
  } catch (error) {
    console.error('Failed to get TMDB details:', error);
    return null;
  }
}
