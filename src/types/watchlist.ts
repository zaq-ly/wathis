export type MediaType = 'movie' | 'tv';

export interface WathisItem {
  id?: string;
  user_id?: string;
  tmdb_id: number;
  title: string;
  original_title?: string;
  media_type: MediaType;
  release_year: number | null;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: string[];
  season_count?: number | null;
  season_label?: string | null;
  overview?: string;
  vote_average?: number | null;
  created_at?: string;
}

export type WatchlistItem = WathisItem;

export interface TMDBRawSearchResult {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  original_language?: string;
  origin_country?: string[];
  media_type?: 'movie' | 'tv' | 'person';
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genre_ids?: number[];
  overview?: string;
  vote_average?: number;
}

export interface TMDBRawGenre {
  id: number;
  name: string;
}

export interface TMDBRawDetail {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  original_language?: string;
  origin_country?: string[];
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: TMDBRawGenre[];
  number_of_seasons?: number;
  belongs_to_collection?: { id: number; name: string } | null;
  overview?: string;
  vote_average?: number;
}

export interface SearchResultItem {
  tmdb_id: number;
  title: string;
  original_title?: string;
  media_type: MediaType;
  release_year: number | null;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: string[];
  season_count: number | null;
  overview: string;
  vote_average?: number | null;
}
