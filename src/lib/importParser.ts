import { cleanMigrationTitle } from './utils';

export interface ParsedImportItem {
  raw: string;
  clean: string;
  year?: number;
  season?: string;
  genre?: string;
  type?: 'movie' | 'tv';
}

export function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let insideQuote = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      if (insideQuote && line[i + 1] === char) {
        current += char;
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export function parseUniversalImport(content: string, filename: string = ''): ParsedImportItem[] {
  if (!content || !content.trim()) return [];

  const lowerFilename = filename.toLowerCase();

  // 1. JSON handling
  if (lowerFilename.endsWith('.json') || (content.trim().startsWith('[') && content.trim().endsWith(']'))) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        const results: ParsedImportItem[] = [];
        for (const item of parsed) {
          if (typeof item === 'string') {
            const { cleanTitle, detectedSeason } = cleanMigrationTitle(item);
            if (cleanTitle) {
              results.push({ raw: item, clean: cleanTitle, season: detectedSeason });
            }
          } else if (item && typeof item === 'object') {
            const raw = item.title || item.name || item.rawTitle || item.film || '';
            if (raw) {
              const { cleanTitle, detectedSeason } = cleanMigrationTitle(String(raw));
              if (cleanTitle) {
                results.push({
                  raw: String(raw),
                  clean: cleanTitle,
                  season: detectedSeason || item.season,
                  year: item.year || item.release_year,
                  genre: Array.isArray(item.genres) ? item.genres.join(', ') : item.genre || item.notionGenre,
                  type: item.type || item.media_type,
                });
              }
            }
          }
        }
        if (results.length > 0) return results;
      }
    } catch {
      // fallback to CSV/line parser
    }
  }

  // 2. CSV / TXT line handling
  const rawLines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) return [];

  // Check if first line contains common CSV headers (Letterboxd, IMDb, Notion, Excel)
  const firstRow = parseCSVLine(rawLines[0]);
  const headerMap: Record<string, number> = {};

  firstRow.forEach((col, idx) => {
    const norm = col.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (['title', 'name', 'film', 'movietitle', 'seriestitle', 'entry', 'rawtitle', 'item'].includes(norm)) {
      headerMap['title'] = idx;
    } else if (['year', 'releaseyear', 'releasedate', 'yearreleased'].includes(norm)) {
      headerMap['year'] = idx;
    } else if (['genre', 'genres', 'tags', 'category', 'notiongenre'].includes(norm)) {
      headerMap['genre'] = idx;
    } else if (['type', 'mediatype', 'kind'].includes(norm)) {
      headerMap['type'] = idx;
    }
  });

  const hasHeader =
    headerMap['title'] !== undefined ||
    (firstRow.length > 1 &&
      ['title', 'name', 'film', 'year', 'genre'].some((h) => rawLines[0].toLowerCase().includes(h)));

  const dataLines = hasHeader ? rawLines.slice(1) : rawLines;
  const titleIdx = headerMap['title'] !== undefined ? headerMap['title'] : 0;

  return dataLines
    .map((line) => {
      // Strip markdown bullets / numbers: e.g. "1. Inception", "- [x] Tenet", "* Shutter Island"
      const cleanedLine = line.replace(/^(\d+[\.\)]|\*|\-|\+)\s*(\[[ xX]\]\s*)?/, '').trim();
      const cols = parseCSVLine(cleanedLine);
      const rawTitle = cols[titleIdx] || cleanedLine;
      const { cleanTitle, detectedSeason } = cleanMigrationTitle(rawTitle);

      let year: number | undefined;
      if (headerMap['year'] !== undefined && cols[headerMap['year']]) {
        const parsedYear = parseInt(cols[headerMap['year']].slice(0, 4), 10);
        if (!isNaN(parsedYear)) year = parsedYear;
      }

      let genre: string | undefined;
      if (headerMap['genre'] !== undefined && cols[headerMap['genre']]) {
        genre = cols[headerMap['genre']];
      }

      let type: 'movie' | 'tv' | undefined;
      if (headerMap['type'] !== undefined && cols[headerMap['type']]) {
        const typeVal = cols[headerMap['type']].toLowerCase();
        if (typeVal.includes('tv') || typeVal.includes('series') || typeVal.includes('show')) type = 'tv';
        else if (typeVal.includes('movie') || typeVal.includes('film')) type = 'movie';
      }

      return {
        raw: rawTitle,
        clean: cleanTitle,
        season: detectedSeason,
        year,
        genre,
        type,
      };
    })
    .filter((item) => item.clean.length > 0);
}
