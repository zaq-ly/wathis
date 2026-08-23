'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { WatchlistItem, SearchResultItem } from '@/types/watchlist';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { isAnimeItem, normalizeWatchlistItems } from '@/lib/utils';

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
  addItem: (item: SearchResultItem, customSeasonCount?: number | null, customSeasonLabel?: string | null) => Promise<boolean>;
  removeItem: (tmdb_id: number, media_type: 'movie' | 'tv') => Promise<boolean>;
  replaceItem: (target: WatchlistItem, replacement: SearchResultItem) => Promise<boolean>;
  updateSeason: (tmdb_id: number, media_type: 'movie' | 'tv', season_count: number | null, season_label: string | null) => Promise<boolean>;
  isItemInWatchlist: (tmdb_id: number, media_type: 'movie' | 'tv') => boolean;
  refreshItems: () => Promise<void>;
  clearWatchlist: () => Promise<boolean>;
  signOut: () => Promise<void>;
  filterType: 'all' | 'movie' | 'tv' | 'anime';
  setFilterType: (type: 'all' | 'movie' | 'tv' | 'anime') => void;
  selectedGenre: string | null;
  setSelectedGenre: (genre: string | null) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredItems: WatchlistItem[];
  genresList: string[];
  syncAllTitlesWithTMDB: () => Promise<{ updated: number; total: number }>;
  isSyncing: boolean;
  syncProgress: { current: number; total: number } | null;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isConfigured] = useState<boolean>(isSupabaseConfigured());

  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv' | 'anime'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('year-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);

  const supabase = createClient();

  // 1. Initialize Auth and Listen for User Changes
  useEffect(() => {
    let isMounted = true;

    if (!isConfigured) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      const initialUser = session?.user ?? null;
      setUser(initialUser);
      if (!initialUser) {
        setItems([]);
        setIsLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user ?? null;
      setUser((prevUser) => {
        if (prevUser?.id !== currentUser?.id) {
          setItems([]); // Clean slate whenever account changes or logs out
        }
        return currentUser;
      });
      if (!currentUser) {
        setItems([]);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [isConfigured, supabase]);

  const signOut = async () => {
    setUser(null);
    setItems([]);
    if (isConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('SignOut error:', e);
      }
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const clearWatchlist = async (): Promise<boolean> => {
    if (!user) {
      setItems([]);
      return true;
    }
    try {
      setIsLoading(true);
      const { error } = await supabase.from('watchlist_items').delete().eq('user_id', user.id);
      if (error) throw error;
      setItems([]);
      return true;
    } catch (err) {
      console.error('Failed to clear watchlist:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch Watchlist Items strictly for the Authenticated User
  const fetchItems = useCallback(async () => {
    if (!isConfigured || !user) {
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
      let loadedItems: WatchlistItem[] = normalizeWatchlistItems(data || []);

      // LocalStorage persistence fallback for season_label
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('wathis_season_labels') || '{}';
          const cachedLabels = JSON.parse(raw);
          loadedItems = loadedItems.map((it) => {
            const key = `${it.media_type}_${it.tmdb_id}`;
            if (!it.season_label && cachedLabels[key]) {
              return { ...it, season_label: cachedLabels[key] };
            }
            return it;
          });
        } catch {}
      }

      setItems(loadedItems);

      // Background auto-enrichment for items missing vote_average
      const missingRating = loadedItems.filter((i) => (i.vote_average === null || i.vote_average === undefined) && i.tmdb_id);
      if (missingRating.length > 0) {
        Promise.all(
          missingRating.slice(0, 15).map(async (it) => {
            try {
              const res = await fetch(`/api/tmdb/detail?id=${it.tmdb_id}&type=${it.media_type}`);
              if (res.ok) {
                const resData = await res.json();
                const vote = resData?.item?.vote_average;
                if (vote) {
                  setItems((prev) =>
                    prev.map((p) =>
                      p.tmdb_id === it.tmdb_id && p.media_type === it.media_type
                        ? { ...p, vote_average: vote }
                        : p
                    )
                  );
                }
              }
            } catch {}
          })
        );
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

  // 3. Add Item to Watchlist
  const addItem = async (
    item: SearchResultItem,
    customSeasonCount?: number | null,
    customSeasonLabel?: string | null
  ): Promise<boolean> => {
    // Check if already in list
    if (items.some((i) => i.tmdb_id === item.tmdb_id && i.media_type === item.media_type)) {
      return false;
    }

    const sCount = customSeasonCount !== undefined ? customSeasonCount : item.season_count;
    const sLabel = customSeasonLabel !== undefined ? customSeasonLabel : (item.media_type === 'tv' && sCount ? `S${sCount}` : null);

    const newItem: WatchlistItem = {
      tmdb_id: item.tmdb_id,
      title: item.title,
      original_title: item.original_title,
      media_type: item.media_type,
      release_year: item.release_year,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      genres: item.genres || [],
      season_count: sCount || null,
      season_label: sLabel || null,
      overview: item.overview,
      vote_average: item.vote_average,
      created_at: new Date().toISOString(),
    };

    // Always persist to local cache so page refresh never loses custom labels
    if (typeof window !== 'undefined' && sLabel) {
      try {
        const raw = localStorage.getItem('wathis_season_labels') || '{}';
        const labels = JSON.parse(raw);
        labels[`${item.media_type}_${item.tmdb_id}`] = sLabel;
        localStorage.setItem('wathis_season_labels', JSON.stringify(labels));
      } catch {}
    }

    // If not logged in, add to local state
    if (!user || !isConfigured) {
      setItems((prev) => [newItem, ...prev]);
      return true;
    }

    try {
      // 1. Try full insert payload
      let insertPayload: Record<string, any> = {
        user_id: user.id,
        tmdb_id: item.tmdb_id,
        title: item.title,
        original_title: item.original_title || null,
        media_type: item.media_type,
        release_year: item.release_year || null,
        poster_path: item.poster_path || null,
        backdrop_path: item.backdrop_path || null,
        genres: item.genres || [],
        season_count: sCount || null,
        season_label: sLabel || null,
        overview: item.overview || null,
        vote_average: item.vote_average || null,
      };

      let { data, error } = await supabase
        .from('watchlist_items')
        .insert([insertPayload])
        .select()
        .single();

      // If column does not exist in user's Supabase table schema, strip optional columns and retry
      if (error && (error.code === '42703' || error.message?.toLowerCase().includes('column') || error.message?.includes('does not exist'))) {
        delete insertPayload.season_label;
        delete insertPayload.vote_average;
        const retry = await supabase
          .from('watchlist_items')
          .insert([insertPayload])
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.warn('Supabase insert notice (using local state):', error.message || error);
        setItems((prev) => [newItem, ...prev.filter(i => !(i.tmdb_id === newItem.tmdb_id && i.media_type === newItem.media_type))]);
        return true;
      }

      setItems((prev) => [
        { ...newItem, id: data?.id || newItem.id },
        ...prev.filter((i) => !(i.tmdb_id === newItem.tmdb_id && i.media_type === newItem.media_type)),
      ]);
      return true;
    } catch (err) {
      console.warn('Adding item locally due to network/auth fallback:', err);
      setItems((prev) => [newItem, ...prev]);
      return true;
    }
  };

  // 4. Update Season Count & Label
  const updateSeason = async (
    tmdb_id: number,
    media_type: 'movie' | 'tv',
    season_count: number | null,
    season_label: string | null
  ): Promise<boolean> => {
    // Persist custom label to localStorage cache
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('wathis_season_labels') || '{}';
        const labels = JSON.parse(raw);
        const key = `${media_type}_${tmdb_id}`;
        if (season_label) {
          labels[key] = season_label;
        } else {
          delete labels[key];
        }
        localStorage.setItem('wathis_season_labels', JSON.stringify(labels));
      } catch {}
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.tmdb_id === tmdb_id && item.media_type === media_type) {
          return {
            ...item,
            season_count,
            season_label,
          };
        }
        return item;
      })
    );

    if (user && isConfigured) {
      try {
        let updatePayload: Record<string, any> = { season_count, season_label };
        let { error } = await supabase
          .from('watchlist_items')
          .update(updatePayload)
          .match({ tmdb_id, media_type, user_id: user.id });

        if (error) {
          console.warn('updateSeason error:', error.code, error.message);
          if (error.code === '42703' || error.message?.toLowerCase().includes('column') || error.message?.includes('does not exist')) {
            console.warn('⚠️ Kolom "season_label" tidak ada di tabel Supabase. Season label disimpan di cache browser.');
            delete updatePayload.season_label;
            await supabase
              .from('watchlist_items')
              .update(updatePayload)
              .match({ tmdb_id, media_type, user_id: user.id });
          }
        }
      } catch (err) {
        console.warn('Supabase update notice:', err);
      }
    }
    return true;
  };

  // 5. Remove Item
  const removeItem = async (tmdb_id: number, media_type: 'movie' | 'tv'): Promise<boolean> => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('wathis_season_labels') || '{}';
        const labels = JSON.parse(raw);
        delete labels[`${media_type}_${tmdb_id}`];
        localStorage.setItem('wathis_season_labels', JSON.stringify(labels));
      } catch {}
    }

    setItems((prev) => prev.filter((i) => !(i.tmdb_id === tmdb_id && i.media_type === media_type)));

    if (user && isConfigured) {
      try {
        await supabase
          .from('watchlist_items')
          .delete()
          .match({ tmdb_id, media_type, user_id: user.id });
      } catch (err) {
        console.warn('Supabase remove notice:', err);
      }
    }
    return true;
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

  const syncAllTitlesWithTMDB = async (): Promise<{ updated: number; total: number }> => {
    if (items.length === 0 || isSyncing) return { updated: 0, total: items.length };

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: items.length });

    let updatedCount = 0;
    const updatedItems = [...items];

    // Process in batches of 4 concurrent requests
    const batchSize = 4;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (item) => {
          try {
            const res = await fetch(`/api/tmdb/detail?id=${item.tmdb_id}&type=${item.media_type}`);
            if (!res.ok) return;
            const data = await res.json();
            const fresh: SearchResultItem | undefined = data.item;
            if (!fresh || !fresh.title) return;
            const titleChanged = fresh.title !== item.title || fresh.original_title !== item.original_title;
            if (titleChanged || !item.backdrop_path || !item.overview || fresh.season_count !== item.season_count) {
              const dbPayload = {
                title: fresh.title,
                original_title: fresh.original_title || null,
                backdrop_path: fresh.backdrop_path || item.backdrop_path,
                poster_path: fresh.poster_path || item.poster_path,
                overview: item.overview || fresh.overview || null,
                vote_average: fresh.vote_average || item.vote_average,
                season_count: fresh.season_count ?? item.season_count ?? null,
              };

              if (user && isConfigured) {
                let q = supabase.from('watchlist_items').update(dbPayload);
                if (item.id) {
                  q = q.eq('id', item.id);
                } else {
                  q = q.eq('user_id', user.id).eq('tmdb_id', item.tmdb_id).eq('media_type', item.media_type);
                }
                await q;
              }

              const idx = updatedItems.findIndex(
                (x) => (item.id ? x.id === item.id : x.tmdb_id === item.tmdb_id && x.media_type === item.media_type)
              );
              if (idx !== -1) {
                updatedItems[idx] = {
                  ...updatedItems[idx],
                  title: fresh.title,
                  original_title: fresh.original_title || undefined,
                  backdrop_path: fresh.backdrop_path || item.backdrop_path,
                  poster_path: fresh.poster_path || item.poster_path,
                  overview: item.overview || fresh.overview,
                  vote_average: fresh.vote_average || item.vote_average,
                  season_count: fresh.season_count ?? item.season_count,
                };
              }
              updatedCount++;
            }
          } catch (e) {
            console.warn('Sync item failed:', item.title, e);
          }
        })
      );

      setSyncProgress({ current: Math.min(i + batchSize, items.length), total: items.length });
    }

    setItems(updatedItems);
    setIsSyncing(false);
    setSyncProgress(null);
    return { updated: updatedCount, total: items.length };
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
      const isAnime = isAnimeItem(item);
      const matchesType = filterType === 'all' ||
        (filterType === 'anime' && isAnime) ||
        (filterType === 'movie' && item.media_type === 'movie' && !isAnime) ||
        (filterType === 'tv' && item.media_type === 'tv' && !isAnime);
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
        updateSeason,
        isItemInWatchlist,
        refreshItems: fetchItems,
        clearWatchlist,
        signOut,
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
        syncAllTitlesWithTMDB,
        isSyncing,
        syncProgress,
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
