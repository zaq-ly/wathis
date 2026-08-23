import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toTitleCase(str: string): string {
  if (!str) return '';
  const minorWords = new Set([
    'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from',
    'by', 'in', 'of', 'with', 'as', 'into', 'like', 'through', 'after', 'over',
    'between', 'out', 'against', 'during', 'without', 'before', 'under', 'around', 'among'
  ]);

  return str
    .toLowerCase()
    .split(' ')
    .map((word, index, arr) => {
      if (!word) return '';
      // Capitalize first, last, and non-minor words
      if (index === 0 || index === arr.length - 1 || !minorWords.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ')
    // Capitalize word after colon or dash (e.g., "Mouse: The Movie")
    .replace(/([:\-–]\s*)([a-z])/g, (_, sep, letter) => `${sep}${letter.toUpperCase()}`)
    // Fix Roman numerals (e.g., II, III, IV)
    .replace(/\b(ii|iii|iv|v|vi|vii|viii|ix|x)\b/gi, (m) => m.toUpperCase());
}

export function cleanMigrationTitle(rawTitle: string): { cleanTitle: string; detectedSeason?: string; detectedYear?: number } {
  let cleanTitle = rawTitle.trim();
  let detectedSeason: string | undefined;
  let detectedYear: number | undefined;

  // 1. Remove file extensions & common media tags (e.g., .mkv, 1080p, Bluray, WEB-DL, x264)
  cleanTitle = cleanTitle.replace(/\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i, '');
  cleanTitle = cleanTitle.replace(/\b(1080p|720p|4k|2160p|bluray|web-dl|webrip|hdrip|dvdrip|x264|x265|hevc|aac|dts)\b/gi, ' ');

  // 2. Remove emojis and rating stars
  cleanTitle = cleanTitle.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[⭐★☆]/gu, '').trim();

  // 3. Extract & remove year in parentheses or brackets e.g. "(2024)", "[2021]", " (1999) "
  const yearRegex = /[\(\[]\s*([12]\d{3})\s*[\)\]]/;
  const yearMatch = cleanTitle.match(yearRegex);
  if (yearMatch) {
    detectedYear = parseInt(yearMatch[1], 10);
    cleanTitle = cleanTitle.replace(yearRegex, ' ').trim();
  }

  // 4. Detect & remove season tags like "S1 - S3", "S1-S5", "S1", "Season 2", "PART 1"
  const seasonRegex = /\s*[-–]?\s*(?:(?:S\d+\s*[-–]\s*S\d+)|(?:S(?:EASON)?\s*\d+(?:\s*[-–]\s*\d+)?)|(?:PART\s*\d+))\s*$/i;
  const seasonMatch = cleanTitle.match(seasonRegex);
  if (seasonMatch) {
    detectedSeason = seasonMatch[0].replace(/^[\s-–]+/, '').trim();
    cleanTitle = cleanTitle.replace(seasonRegex, '').trim();
  }

  // 5. Remove trailing brackets like (Season 1) or [S1]
  cleanTitle = cleanTitle.replace(/\s*[\(\[](?:season\s*\d+|s\d+)[\)\]]\s*$/i, '').trim();

  // 6. If cleanTitle ends with standalone 4-digit year, extract and remove it
  const endYearMatch = cleanTitle.match(/\s+([12]\d{3})$/);
  if (endYearMatch && !detectedYear) {
    detectedYear = parseInt(endYearMatch[1], 10);
    cleanTitle = cleanTitle.replace(/\s+[12]\d{3}$/, '').trim();
  }

  // 7. Clean excessive spaces, dashes, dots replaced with spaces
  cleanTitle = cleanTitle.replace(/[._]/g, ' ');
  cleanTitle = cleanTitle.replace(/\s+/g, ' ');
  cleanTitle = cleanTitle.replace(/[\s-–:]+$/, '').trim();

  if (cleanTitle.length > 0) {
    cleanTitle = toTitleCase(cleanTitle);
  }

  return { cleanTitle: cleanTitle || rawTitle.trim(), detectedSeason, detectedYear };
}

export function formatYear(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const year = parseInt(dateStr.slice(0, 4), 10);
  return isNaN(year) ? null : year;
}

export function getTMDBImageUrl(path: string | null | undefined, size: 'w300' | 'w500' | 'w1280' | 'original' = 'w500'): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function formatSeasonDisplay(item?: {
  season_count?: number | null;
  season_label?: string | null;
  genres?: string[];
  media_type?: string;
  title?: string;
  original_title?: string;
} | null): string {
  if (!item) return '';
  if (item.season_label) return item.season_label;
  if (!item.season_count) return '';

  const isAnime = isAnimeItem(item);
  if (item.season_count > 10 || (isAnime && item.season_count > 6)) {
    return `Eps ${item.season_count}`;
  }

  if (item.season_count > 1) {
    return `S1-S${item.season_count}`;
  }

  return 'S1';
}

export function parseSeasonInput(input: string): { count: number | null; label: string | null } {
  const trimmed = input.trim();
  if (!trimmed) return { count: null, label: null };

  const digitsMatch = trimmed.match(/\d+/);
  const num = digitsMatch ? parseInt(digitsMatch[0], 10) : null;

  if (num && num > 10) {
    return { count: num, label: `Eps ${num}` };
  }

  if (num && /^(eps?|episode)\s*\d+$/i.test(trimmed)) {
    return { count: num, label: `Eps ${num}` };
  }

  return { count: num || 1, label: trimmed };
}

export function isAnimeItem(item?: {
  genres?: string[];
  title?: string;
  original_title?: string;
  media_type?: string;
} | null): boolean {
  if (!item) return false;
  if (item.genres && item.genres.includes('Anime')) return true;
  if (item.genres && (item.genres.includes('Animation') || item.genres.includes('Animasi'))) {
    if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(item.original_title || '')) return true;
    if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(item.title || '')) return true;
    if (/anime/i.test(item.title || '')) return true;
    if (/anime/i.test(item.original_title || '')) return true;
  }
  return false;
}

export function normalizeWatchlistItems<T extends { genres?: string[]; original_title?: string; title?: string; media_type?: string }>(items: T[]): T[] {
  return (items || []).map((it) => {
    if (isAnimeItem(it)) {
      const currentGenres = it.genres || [];
      if (!currentGenres.includes('Anime')) {
        return { ...it, genres: ['Anime', ...currentGenres] };
      }
    }
    return it;
  });
}
