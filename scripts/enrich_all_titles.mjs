import fs from 'fs';

const API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const TMDB_GENRES = {
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

function toTitleCase(str) {
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
      if (index === 0 || index === arr.length - 1 || !minorWords.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ')
    .replace(/([:\-–]\s*)([a-z])/g, (_, sep, letter) => sep + letter.toUpperCase())
    .replace(/\b(ii|iii|iv|v|vi|vii|viii|ix|x)\b/gi, (m) => m.toUpperCase())
    .replace(/\b(se7en)\b/gi, 'Se7en')
    .replace(/\b(1899)\b/gi, '1899')
    .replace(/\b(365)\b/gi, '365');
}

function cleanTitle(raw) {
  let t = raw.trim().replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[⭐★☆]/gu, '').trim();
  let season = null;
  const match = t.match(/\s*[-–]?\s*(?:(?:S\d+\s*[-–]\s*S\d+)|(?:S(?:EASON)?\s*\d+(?:\s*[-–]\s*\d+)?)|(?:PART\s*\d+))\s*$/i);
  if (match) {
    season = match[0].replace(/^[\s-–]+/, '').trim();
    t = t.replace(/\s*[-–]?\s*(?:(?:S\d+\s*[-–]\s*S\d+)|(?:S(?:EASON)?\s*\d+(?:\s*[-–]\s*\d+)?)|(?:PART\s*\d+))\s*$/i, '').trim();
  }
  t = t.replace(/\s*[\(\[](?:season\s*\d+|s\d+)[\)\]]\s*$/i, '').trim();
  t = t.replace(/[\s-–]+$/, '').trim();
  return { clean: toTitleCase(t), rawClean: t, season };
}

function parseSeasonCount(seasonStr) {
  if (!seasonStr) return 1;
  const matchRange = seasonStr.match(/S\d+\s*[-–]\s*S?(\d+)/i);
  if (matchRange) return parseInt(matchRange[1], 10);
  const matchSingle = seasonStr.match(/S(?:EASON)?\s*(\d+)/i);
  if (matchSingle) return parseInt(matchSingle[1], 10);
  return 1;
}

const movieCSV = fs.readFileSync('notion_data/Movie/Movie 366dfa2deed38012aa64ec28b3cf8744_all.csv', 'utf-8');
const seriesCSV = fs.readFileSync('notion_data/Series/Series 366dfa2deed380c1a6fde30702df1fb2_all.csv', 'utf-8');

const movieLines = movieCSV.split('\n').map((l) => l.trim()).filter((l) => l.length > 0).slice(1);
const seriesLines = seriesCSV.split('\n').map((l) => l.trim()).filter((l) => l.length > 0).slice(1);

async function searchTMDB(query, type) {
  const endpoint = type === 'movie' ? 'search/movie' : 'search/tv';
  const url = `${TMDB_BASE_URL}/${endpoint}?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0]; // Best match
    }
  } catch (e) {
    // fallback multi
  }

  // Fallback multi-search
  try {
    const multiUrl = `${TMDB_BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;
    const res = await fetch(multiUrl);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results.find((r) => r.media_type === type) || data.results[0];
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function run() {
  console.log('Starting enrichment for 243 titles from Notion...');
  const allItems = [];

  // 1. Process Movies (184)
  console.log(`Fetching TMDB metadata for ${movieLines.length} movies...`);
  for (let i = 0; i < movieLines.length; i++) {
    const line = movieLines[i];
    const parts = line.split(',');
    const raw = parts[0].trim();
    const notionGenre = parts.slice(1).join(',').trim();
    const { clean, rawClean } = cleanTitle(raw);

    const tmdb = await searchTMDB(rawClean, 'movie');
    const releaseDate = tmdb?.release_date || '';
    const year = releaseDate ? parseInt(releaseDate.slice(0, 4), 10) : null;
    const genres = tmdb?.genre_ids
      ? tmdb.genre_ids.map((id) => TMDB_GENRES[id]).filter(Boolean)
      : [notionGenre.split('/')[0].trim() || 'Drama'];

    allItems.push({
      id: `movie-${tmdb?.id || (100000 + i)}`,
      tmdb_id: tmdb?.id || (100000 + i),
      title: tmdb?.title ? toTitleCase(tmdb.title) : clean,
      original_title: tmdb?.original_title || raw,
      media_type: 'movie',
      release_year: year,
      poster_path: tmdb?.poster_path || null,
      backdrop_path: tmdb?.backdrop_path || null,
      genres: genres.length > 0 ? genres : ['Drama'],
      season_count: null,
      overview: tmdb?.overview || 'Archived from Notion completed collection.',
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
    });

    if ((i + 1) % 25 === 0 || i === movieLines.length - 1) {
      console.log(`Movies processed: ${i + 1}/${movieLines.length}`);
    }
  }

  // 2. Process Series (59)
  console.log(`Fetching TMDB metadata for ${seriesLines.length} series...`);
  for (let j = 0; j < seriesLines.length; j++) {
    const line = seriesLines[j];
    const parts = line.split(',');
    const raw = parts[0].trim();
    const notionGenre = parts.slice(1).join(',').trim();
    const { clean, rawClean, season } = cleanTitle(raw);
    const parsedSeasons = parseSeasonCount(season);

    const tmdb = await searchTMDB(rawClean, 'tv');
    const airDate = tmdb?.first_air_date || '';
    const year = airDate ? parseInt(airDate.slice(0, 4), 10) : null;
    const genres = tmdb?.genre_ids
      ? tmdb.genre_ids.map((id) => TMDB_GENRES[id]).filter(Boolean)
      : [notionGenre.split('/')[0].trim() || 'Drama'];

    allItems.push({
      id: `tv-${tmdb?.id || (200000 + j)}`,
      tmdb_id: tmdb?.id || (200000 + j),
      title: tmdb?.name ? toTitleCase(tmdb.name) : clean,
      original_title: tmdb?.original_name || raw,
      media_type: 'tv',
      release_year: year,
      poster_path: tmdb?.poster_path || null,
      backdrop_path: tmdb?.backdrop_path || null,
      genres: genres.length > 0 ? genres : ['Drama'],
      season_count: parsedSeasons,
      overview: tmdb?.overview || 'Archived from Notion completed collection.',
      created_at: new Date(Date.now() - (movieLines.length + j) * 3600000).toISOString(),
    });

    if ((j + 1) % 15 === 0 || j === seriesLines.length - 1) {
      console.log(`Series processed: ${j + 1}/${seriesLines.length}`);
    }
  }

  fs.writeFileSync('src/data/seed_watchlist.json', JSON.stringify(allItems, null, 2));
  console.log(`DONE! Total ${allItems.length} titles enriched with TMDB posters, years & genres.`);
}

run();
