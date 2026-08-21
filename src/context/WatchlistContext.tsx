'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { WatchlistItem, SearchResultItem } from '@/types/watchlist';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import seedWatchlist from '@/data/seed_watchlist.json';

export type SortOption =
  | 'default'
  | 'alpha-asc'
  | 'alpha-desc'
  | 'year-desc'
  | 'year-asc'
  | 'rating-desc'
  | 'seasons-desc';

interface WatchlistContextType {
  items: WatchlistItem[];
  isLoading: boolean;
  user: User | null;
  isConfigured: boolean;
  addItem: (item: SearchResultItem) => Promise<boolean>;
  removeItem: (tmdb_id: number, media_type: 'movie' | 'tv') => Promise<boolean>;
  replaceItem: (target: WatchlistItem, replacement: SearchResultItem) => Promise<boolean>;
  isItemInWatchlist: (tmdb_id: number, media_type: 'movie' | 'tv') => boolean;
  refreshItems: () => Promise<void>;
  resetToNotionArchive: () => void;
  syncCloudToSupabase: () => Promise<{ success: boolean; count: number }>;
  filterType: 'all' | 'movie' | 'tv';
  setFilterType: (type: 'all' | 'movie' | 'tv') => void;
  selectedGenre: string | null;
  setSelectedGenre: (genre: string | null) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredItems: WatchlistItem[];
  genresList: string[];
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isConfigured] = useState<boolean>(isSupabaseConfigured());

  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();

  // 1. Initialize Auth and Listen for User Changes
  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (isConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (isMounted) {
            const initialUser = session?.user ?? null;
            setUser(initialUser);
            if (!initialUser) {
              setItems([]);
              setIsLoading(false);
            }
          }

          const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (isMounted) {
              const currentUser = session?.user ?? null;
              setUser(currentUser);
              // Clear items on logout or account switch
              setItems([]);
              if (!currentUser) {
                setIsLoading(false);
              }
            }
          });

          return () => {
            authListener.subscription.unsubscribe();
          };
        } catch (e) {
          console.error('Supabase auth error:', e);
          setIsLoading(false);
        }
      } else {
        // Unconfigured fallback (offline standalone demo)
        setItems(seedWatchlist as WatchlistItem[]);
        setIsLoading(false);
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, [isConfigured, supabase]);

  // 2. Fetch Watchlist Items strictly for the Authenticated User
  const fetchItems = useCallback(async () => {
    if (!isConfigured) {
      setItems(seedWatchlist as WatchlistItem[]);
      setIsLoading(false);
      return;
    }

    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Strictly query items owned by this specific user_id
      const { data, error } = await supabase
        .from('watchlist_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const seedMap = new Map((seedWatchlist as WatchlistItem[]).map((i) => [`${i.media_type}-${i.tmdb_id}`, i]));
        const enriched = data.map((item) => {
          const seed = seedMap.get(`${item.media_type}-${item.tmdb_id}`);
          return {
            ...item,
            season_label: item.season_label ?? seed?.season_label ?? (item.media_type === 'tv' && item.season_count ? `S${item.season_count}` : null),
            season_count: item.season_count ?? seed?.season_count ?? (item.media_type === 'tv' ? 1 : null),
            vote_average: item.vote_average ?? seed?.vote_average ?? null,
          };
        });
        setItems(enriched);
      } else {
        // New account has 0 items (clean slate)
        setItems([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn('Supabase fetch notice:', errorMessage);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, user, supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const syncCloudToSupabase = async (): Promise<{ success: boolean; count: number }> => {
    if (!isConfigured || !user) {
      setItems(seedWatchlist as WatchlistItem[]);
      return { success: true, count: seedWatchlist.length };
    }
    try {
      setIsLoading(true);
      const seen = new Set<string>();
      const itemsToInsert = (seedWatchlist as WatchlistItem[])
        .filter((item) => {
          const key = `${item.media_type}-${item.tmdb_id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((item) => ({
          user_id: user.id,
          tmdb_id: item.tmdb_id,
          title: item.title,
          original_title: item.original_title || item.title,
          media_type: item.media_type,
          release_year: item.release_year,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          genres: item.genres || [],
          season_count: item.season_count,
          overview: item.overview,
        }));

      // Delete existing rows for this user to ensure 100% clean sync with new fixed files
      await supabase.from('watchlist_items').delete().eq('user_id', user.id);

      const { data, error } = await supabase
        .from('watchlist_items')
        .insert(itemsToInsert)
        .select();

      if (error) throw error;
      if (data) setItems(data);
      return { success: true, count: data?.length || 0 };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn('Sync to Supabase notice:', errorMessage);
      setItems(seedWatchlist as WatchlistItem[]);
      return { success: false, count: 0 };
    } finally {
      setIsLoading(false);
    }
  };

  const resetToNotionArchive = () => {
    if (user && isConfigured) {
      syncCloudToSupabase();
    } else {
      setItems(seedWatchlist as WatchlistItem[]);
    }
  };

  // 3. Add Item to Watchlist
  const addItem = async (item: SearchResultItem): Promise<boolean> => {
    if (!user) return false;

    // Check if already in list
    if (items.some((i) => i.tmdb_id === item.tmdb_id && i.media_type === item.media_type)) {
      return false;
    }

    const newItem: WatchlistItem = {
      tmdb_id: item.tmdb_id,
      title: item.title,
      media_type: item.media_type,
      release_year: item.release_year,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      genres: item.genres || [],
      season_count: item.season_count,
      overview: item.overview,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('watchlist_items')
        .insert([{ ...newItem, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setItems((prev) => [data, ...prev]);
      return true;
    } catch (err) {
      console.error('Failed to add item to Supabase:', err);
      return false;
    }
  };

  // 4. Remove Item
  const removeItem = async (tmdb_id: number, media_type: 'movie' | 'tv'): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('watchlist_items')
        .delete()
        .match({ tmdb_id, media_type, user_id: user.id });

      if (error) throw error;
      setItems((prev) => prev.filter((i) => !(i.tmdb_id === tmdb_id && i.media_type === media_type)));
      return true;
    } catch (err) {
      console.error('Failed to remove item from Supabase:', err);
      return false;
    }
  };

  // 5. Replace / Re-match Item
  const replaceItem = async (
    target: WatchlistItem,
    replacement: SearchResultItem
  ): Promise<boolean> => {
    const updatedFields: Partial<WatchlistItem> = {
      tmdb_id: replacement.tmdb_id,
      title: replacement.title,
      original_title: replacement.title,
      media_type: replacement.media_type,
      release_year: replacement.release_year,
      poster_path: replacement.poster_path,
      backdrop_path: replacement.backdrop_path,
      genres: replacement.genres || [],
      season_count: replacement.season_count,
      overview: replacement.overview,
    };

    if (user && isConfigured) {
      try {
        let query = supabase.from('watchlist_items').update(updatedFields);
        if (target.id) {
          query = query.eq('id', target.id);
        } else {
          query = query
            .eq('user_id', user.id)
            .eq('tmdb_id', target.tmdb_id)
            .eq('media_type', target.media_type);
        }

        const { error } = await query;
        if (error) {
          console.warn('Supabase update notice:', error.message || error);
        }
      } catch (err) {
        console.warn('Supabase update notice:', err);
      }
    }

    // Update local state immediately
    setItems((prev) =>
      prev.map((item) => {
        const isMatch = target.id
          ? item.id === target.id
          : item.tmdb_id === target.tmdb_id && item.media_type === target.media_type;
        if (isMatch) {
          return {
            ...item,
            ...updatedFields,
          };
        }
        return item;
      })
    );

    return true;
  };

  const isItemInWatchlist = (tmdb_id: number, media_type: 'movie' | 'tv') => {
    return items.some((i) => i.tmdb_id === tmdb_id && i.media_type === media_type);
  };

  // Derive unique genre list
  const genresList = Array.from(
    new Set(items.flatMap((item) => item.genres || []))
  ).sort();

  // Filtered & Sorted Items logic
  const filteredItems = items
    .filter((item) => {
      const matchesType = filterType === 'all' || item.media_type === filterType;
      const matchesGenre = !selectedGenre || (item.genres && item.genres.includes(selectedGenre));
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.genres && item.genres.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesType && matchesGenre && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'alpha-asc':
          return (a.title || '').localeCompare(b.title || '', 'id', { sensitivity: 'base', numeric: true });
        case 'alpha-desc':
          return (b.title || '').localeCompare(a.title || '', 'id', { sensitivity: 'base', numeric: true });
        case 'year-desc': {
          const aYear = Number(a.release_year) || 0;
          const bYear = Number(b.release_year) || 0;
          return bYear - aYear;
        }
        case 'year-asc': {
          const aYear = Number(a.release_year) || 9999;
          const bYear = Number(b.release_year) || 9999;
          return aYear - bYear;
        }
        case 'rating-desc': {
          const aRating = Number(a.vote_average) || 0;
          const bRating = Number(b.vote_average) || 0;
          return bRating - aRating;
        }
        case 'seasons-desc': {
          const aSeasons = Number(a.season_count) || (a.season_label ? 2 : (a.media_type === 'tv' ? 1 : 0));
          const bSeasons = Number(b.season_count) || (b.season_label ? 2 : (b.media_type === 'tv' ? 1 : 0));
          return bSeasons - aSeasons;
        }
        case 'default':
        default:
          return 0;
      }
    });

  return (
    <WatchlistContext.Provider
      value={{
        items,
        isLoading,
        user,
        isConfigured,
        addItem,
        removeItem,
        replaceItem,
        isItemInWatchlist,
        refreshItems: fetchItems,
        resetToNotionArchive,
        syncCloudToSupabase,
        filterType,
        setFilterType,
        selectedGenre,
        setSelectedGenre,
        sortBy,
        setSortBy,
        searchQuery,
        setSearchQuery,
        filteredItems,
        genresList,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWathis must be used within a WathisProvider');
  }
  return context;
}

export const useWathis = useWatchlist;
export const WathisProvider = WatchlistProvider;
export const WathisContext = WatchlistContext;
