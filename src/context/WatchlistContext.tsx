'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { WatchlistItem, SearchResultItem } from '@/types/watchlist';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import seedWatchlist from '@/data/seed_watchlist.json';

interface WatchlistContextType {
  items: WatchlistItem[];
  isLoading: boolean;
  user: User | null;
  isConfigured: boolean;
  addItem: (item: SearchResultItem) => Promise<boolean>;
  removeItem: (tmdb_id: number, media_type: 'movie' | 'tv') => Promise<boolean>;
  isItemInWatchlist: (tmdb_id: number, media_type: 'movie' | 'tv') => boolean;
  refreshItems: () => Promise<void>;
  resetToNotionArchive: () => void;
  syncCloudToSupabase: () => Promise<{ success: boolean; count: number }>;
  filterType: 'all' | 'movie' | 'tv';
  setFilterType: (type: 'all' | 'movie' | 'tv') => void;
  selectedGenre: string | null;
  setSelectedGenre: (genre: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredItems: WatchlistItem[];
  genresList: string[];
}

const LOCAL_STORAGE_KEY = 'watchlist_notion_enriched_v4';

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WatchlistItem[]>(seedWatchlist as WatchlistItem[]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isConfigured] = useState<boolean>(isSupabaseConfigured());

  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();

  // 1. Initialize Auth and Load Items
  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (isConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (isMounted) setUser(session?.user ?? null);

          const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (isMounted) setUser(session?.user ?? null);
          });

          return () => {
            authListener.subscription.unsubscribe();
          };
        } catch (e) {
          console.error('Supabase auth error:', e);
        }
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, [isConfigured, supabase]);

  // 2. Fetch Watchlist Items (Supabase or LocalStorage Fallback)
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    if (isConfigured && user) {
      try {
        const { data, error } = await supabase
          .from('watchlist_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          setItems(data);
        } else {
          // If Supabase table is empty, auto-seed with Notion 243 items
          setItems(seedWatchlist as WatchlistItem[]);
        }
      } catch (err) {
        console.error('Failed to fetch items from Supabase:', err);
        setItems(seedWatchlist as WatchlistItem[]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local demo storage fallback
      try {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
          const parsed = JSON.parse(localData);
          const hasPosters = Array.isArray(parsed) && parsed.filter(i => Boolean(i.poster_path)).length > 50;
          if (hasPosters && parsed.length >= 100) {
            setItems(parsed);
            setIsLoading(false);
            return;
          }
        }
        // Overwrite with 100% enriched TMDB poster & release year data
        const initial = seedWatchlist as WatchlistItem[];
        setItems(initial);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
      } catch {
        setItems(seedWatchlist as WatchlistItem[]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isConfigured, user, supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const syncCloudToSupabase = async (): Promise<{ success: boolean; count: number }> => {
    if (!isConfigured || !user) return { success: false, count: 0 };
    try {
      setIsLoading(true);
      const itemsToInsert = items.map((item) => ({
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

      const { data, error } = await supabase
        .from('watchlist_items')
        .upsert(itemsToInsert, { onConflict: 'user_id,tmdb_id,media_type' })
        .select();

      if (error) throw error;
      if (data) setItems(data);
      return { success: true, count: data?.length || 0 };
    } catch (err) {
      console.error('Failed to sync to Supabase:', err);
      return { success: false, count: 0 };
    } finally {
      setIsLoading(false);
    }
  };

  const resetToNotionArchive = () => {
    const initial = seedWatchlist as WatchlistItem[];
    setItems(initial);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
  };

  // 3. Add Item to Watchlist
  const addItem = async (item: SearchResultItem): Promise<boolean> => {
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

    if (isConfigured && user) {
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
    } else {
      const updated = [newItem, ...items];
      setItems(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return true;
    }
  };

  // 4. Remove Item
  const removeItem = async (tmdb_id: number, media_type: 'movie' | 'tv'): Promise<boolean> => {
    if (isConfigured && user) {
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
    } else {
      const updated = items.filter((i) => !(i.tmdb_id === tmdb_id && i.media_type === media_type));
      setItems(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return true;
    }
  };

  const isItemInWatchlist = (tmdb_id: number, media_type: 'movie' | 'tv') => {
    return items.some((i) => i.tmdb_id === tmdb_id && i.media_type === media_type);
  };

  // Derive unique genre list
  const genresList = Array.from(
    new Set(items.flatMap((item) => item.genres || []))
  ).sort();

  // Filtered Items logic
  const filteredItems = items.filter((item) => {
    const matchesType = filterType === 'all' || item.media_type === filterType;
    const matchesGenre = !selectedGenre || (item.genres && item.genres.includes(selectedGenre));
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.genres && item.genres.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesType && matchesGenre && matchesSearch;
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
        isItemInWatchlist,
        refreshItems: fetchItems,
        resetToNotionArchive,
        syncCloudToSupabase,
        filterType,
        setFilterType,
        selectedGenre,
        setSelectedGenre,
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
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}
