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
const DEFAULT_TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY || '';


function getApiKey(): string {
  const key = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || DEFAULT_TMDB_KEY;
  if (!key) {
    throw new Error('TMDB API Key is not configured. Please set NEXT_PUBLIC_TMDB_API_KEY in your environment variables.');
  }
  return key;
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

    // 2. Fallback: only clean punctuation if primary returns 0 results
    if (rawResults.length === 0) {
      // Remove common punctuation/brackets while preserving year numbers
      const withoutPunctuation = trimmed.replace(/[\(\)\[\]]/g, '').trim();
      if (withoutPunctuation !== trimmed && withoutPunctuation.length >= 2) {
        rawResults = await executeTMDBSearch(withoutPunctuation, apiKey);
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
      // Save full release date (YYYY-MM-DD) if available, otherwise use year
      const releaseYear = releaseDate ? formatYear(releaseDate) : null;
      const fullReleaseDate = releaseDate || null;

      return {
        tmdb_id: item.id,
        title,
        original_title: origTitle && origTitle !== title ? origTitle : undefined,
        media_type: isTv ? 'tv' : 'movie',
        release_year: releaseYear,
        release_date: fullReleaseDate,
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
      // Save full release date (YYYY-MM-DD) if available
      const fullReleaseDate = releaseDate || null;
      const releaseYear = releaseDate ? formatYear(releaseDate) : null;

      return {
        tmdb_id: id,
        title,
        original_title: origTitle && origTitle !== title ? origTitle : undefined,
        media_type: mediaType,
        release_year: releaseYear,
        release_date: fullReleaseDate,
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

export const MOVIE_GENRE_MAP: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  'Sci-Fi': 878,
  Thriller: 53,
  War: 10752,
  Western: 37,
};

export const TV_GENRE_MAP: Record<string, number> = {
  Action: 10759,
  Adventure: 10759,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Mystery: 9648,
  'Sci-Fi': 10765,
  Fantasy: 10765,
  Western: 37,
};

export const DISCOVER_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
];

export interface DiscoverOptions {
  mediaType?: 'all' | 'movie' | 'tv' | 'anime';
  genre?: string;
  minRating?: number;
  sortBy?: 'rating' | 'popularity';
  page?: number;
  language?: string;
}

function parseRawToSearchResult(item: any, forceType?: 'movie' | 'tv'): SearchResultItem {
  const isTv = forceType ? forceType === 'tv' : (item.media_type === 'tv' || (!item.title && !!item.name));
  const title = isTv ? item.name || item.original_name || 'Untitled' : item.title || item.original_title || 'Untitled';
  const origTitle = isTv ? item.original_name : item.original_title;
  const releaseDate = isTv ? item.first_air_date : item.release_date;
  const genres = (item.genre_ids || []).map((id: number) => TMDB_GENRES[id]).filter(Boolean);

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
  const releaseYear = releaseDate ? formatYear(releaseDate) : null;

  return {
    tmdb_id: item.id,
    title,
    original_title: origTitle && origTitle !== title ? origTitle : undefined,
    media_type: isTv ? 'tv' : 'movie',
    release_year: releaseYear,
    release_date: releaseDate || null,
    poster_path: item.poster_path || null,
    backdrop_path: item.backdrop_path || null,
    genres,
    season_count: isTv ? 1 : null,
    overview: item.overview?.trim() || '',
    vote_average: rating,
  };
}

export async function discoverTMDB(options: DiscoverOptions = {}): Promise<SearchResultItem[]> {
  const {
    mediaType = 'all',
    genre,
    minRating = 0,
    sortBy = 'popularity',
    page = 1,
    language = 'id',
  } = options;

  const apiKey = getApiKey();
  const sortParam = sortBy === 'popularity' ? 'popularity.desc' : 'vote_average.desc';
  const voteCountMin = sortBy === 'rating' ? 150 : 30;

  const fetchEndpoint = async (endpoint: 'movie' | 'tv', extraParams: Record<string, string> = {}) => {
    const makeParams = (langLocale: string) => {
      const params = new URLSearchParams({
        api_key: apiKey,
        sort_by: sortParam,
        'vote_count.gte': String(voteCountMin),
        include_adult: 'false',
        language: langLocale,
        page: String(page),
        ...extraParams,
      });

      if (minRating > 0) {
        params.set('vote_average.gte', String(minRating));
      }

      if (genre) {
        const gId = endpoint === 'movie' ? MOVIE_GENRE_MAP[genre] : TV_GENRE_MAP[genre];
        if (gId) {
          params.set('with_genres', String(gId));
        }
      }
      return params;
    };

    if (language === 'id') {
      const idUrl = `${TMDB_BASE_URL}/discover/${endpoint}?${makeParams('id-ID').toString()}`;
      const enUrl = `${TMDB_BASE_URL}/discover/${endpoint}?${makeParams('en-US').toString()}`;

      const [idRes, enRes] = await Promise.all([
        fetch(idUrl, { next: { revalidate: 3600 } }),
        fetch(enUrl, { next: { revalidate: 3600 } }),
      ]);

      const idData = idRes.ok ? await idRes.json() : { results: [] };
      const enData = enRes.ok ? await enRes.json() : { results: [] };

      const enMap = new Map<number, any>((enData.results || []).map((it: any) => [it.id, it]));
      const HAS_NON_LATIN = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\u0400-\u04ff\u0600-\u06ff\u0e00-\u0e7f]/;

      return (idData.results || []).map((idItem: any) => {
        const enItem = enMap.get(idItem.id);
        const rawIdTitle = idItem.title || idItem.name || '';
        const rawEnTitle = enItem?.title || enItem?.name || '';

        // If Indonesian title contains non-Latin characters (Kanji, Hangul, Kana, etc.),
        // fallback to Romanized English title so titles are always readable.
        let finalTitle = rawIdTitle;
        if (!finalTitle || HAS_NON_LATIN.test(finalTitle)) {
          finalTitle = rawEnTitle || finalTitle || 'Untitled';
        }

        // If Indonesian overview is available, use it. Otherwise fallback to English overview.
        const finalOverview = idItem.overview?.trim() || enItem?.overview?.trim() || '';

        const mergedItem = {
          ...idItem,
          title: finalTitle,
          name: finalTitle,
          overview: finalOverview,
          poster_path: idItem.poster_path || enItem?.poster_path,
          backdrop_path: idItem.backdrop_path || enItem?.backdrop_path,
          genre_ids: idItem.genre_ids?.length ? idItem.genre_ids : enItem?.genre_ids,
        };
        return parseRawToSearchResult(mergedItem, endpoint);
      });
    }

    const enUrl = `${TMDB_BASE_URL}/discover/${endpoint}?${makeParams('en-US').toString()}`;
    const res = await fetch(enUrl, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((it: any) => parseRawToSearchResult(it, endpoint));
  };

  try {
    if (mediaType === 'movie') {
      return await fetchEndpoint('movie');
    }

    if (mediaType === 'tv') {
      return await fetchEndpoint('tv');
    }

    if (mediaType === 'anime') {
      return await fetchEndpoint('tv', {
        with_genres: '16',
        with_original_language: 'ja',
      });
    }

    // mediaType === 'all'
    const [movies, tvs] = await Promise.all([
      fetchEndpoint('movie'),
      fetchEndpoint('tv'),
    ]);

    const combined = [...movies, ...tvs];
    if (sortBy === 'rating') {
      combined.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    } else {
      // Interleave movies and tvs for a balanced feed
      const interleaved: SearchResultItem[] = [];
      const maxLen = Math.max(movies.length, tvs.length);
      for (let i = 0; i < maxLen; i++) {
        if (movies[i]) interleaved.push(movies[i]);
        if (tvs[i]) interleaved.push(tvs[i]);
      }
      return interleaved;
    }

    return combined;
  } catch (error) {
    console.error('Failed to discover from TMDB:', error);
    return [];
  }
}

