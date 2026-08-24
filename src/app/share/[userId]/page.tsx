'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { WatchlistItem } from '@/types/watchlist';
import { EditorialTableView } from '@/components/EditorialTableView';
import { GridView } from '@/components/GridView';
import { Search, Loader2, LayoutList, LayoutGrid } from 'lucide-react';
import { CustomSelect } from '@/components/CustomSelect';
import { WathisContext, SortOption } from '@/context/WatchlistContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useParams } from 'next/navigation';
import { isAnimeItem, normalizeWatchlistItems, sortByRelease } from '@/lib/utils';

export default function SharePage() {
  const params = useParams();
  const rawUserId = typeof params?.userId === 'string' ? params.userId : Array.isArray(params?.userId) ? params.userId[0] : '';
  const userId = decodeURIComponent(rawUserId || '');

  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv' | 'anime'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('year-desc');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchSharedItems() {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/share/${encodeURIComponent(userId)}`);
        if (!res.ok) {
          console.error('Failed to fetch shared items');
          setItems([]);
          return;
        }
        const { items: data } = await res.json();
        if (data && data.length > 0) {
          setItems(normalizeWatchlistItems(data));
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error('Failed to fetch shared items', err);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSharedItems();
  }, [userId]);

  const genresList = Array.from(new Set(items.flatMap((item) => item.genres || []))).sort();

const filteredItems = useMemo(() => {
      return items
        .filter((item) => {
          const isAnime = isAnimeItem(item);
          const matchesType =
            filterType === 'all' ||
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
              return sortByRelease([a, b], 'desc')[0] === a ? -1 : 1;
            }
            case 'year-asc': {
              return sortByRelease([a, b], 'asc')[0] === a ? -1 : 1;
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
            default:
              return 0;
          }
        });
    }, [items, filterType, selectedGenre, searchQuery, sortBy]);

  const totalCount = items.length;
  const filmCount = items.filter((i) => i.media_type === 'movie' && !isAnimeItem(i)).length;
  const tvCount = items.filter((i) => i.media_type === 'tv' && !isAnimeItem(i)).length;
  const animeCount = items.filter((i) => isAnimeItem(i)).length;

  const mockContextValue = {
    items,
    isLoading,
    user: null,
    isConfigured: true,
    addItem: async () => false,
    removeItem: async () => false,
    replaceItem: async () => false,
    updateSeason: async () => false,
    isItemInWatchlist: () => false,
    refreshItems: async () => {},
    clearWatchlist: async () => false,
    signOut: async () => {},
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
    syncAllTitlesWithTMDB: async () => ({ updated: 0, total: 0 }),
    isSyncing: false,
    syncProgress: null,
  };

  return (
    <WathisContext.Provider value={mockContextValue as any}>
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
        <header className="sticky top-0 z-40 apple-glass-nav border-b border-black/[0.06] dark:border-white/[0.08] transition-colors">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <div className="flex items-center space-x-6 sm:space-x-8">
                <a href="/" className="flex items-center space-x-2.5 font-semibold text-base tracking-tight text-foreground select-none group cursor-pointer apple-btn-active">
                  <div className="w-8 h-8 rounded-md overflow-hidden flex items-center justify-center">
                    <img src="/logo_zoomed.jpg" alt="wathis logo" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-semibold text-base tracking-tight text-foreground">
                    wathis<span className="text-zinc-400">.</span>
                  </span>
                </a>

                <nav className="hidden md:flex items-center p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08] border border-black/10 dark:border-white/10">
                  <button onClick={() => setFilterType('all')} className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${filterType === 'all' ? 'bg-foreground text-background font-bold shadow-md' : 'text-muted-foreground hover:text-foreground font-medium'}`}>
                    <span>All</span><span className="text-[11px] opacity-70">({totalCount})</span>
                  </button>
                  <button onClick={() => setFilterType('movie')} className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${filterType === 'movie' ? 'bg-foreground text-background font-bold shadow-md' : 'text-muted-foreground hover:text-foreground font-medium'}`}>
                    <span>Films</span><span className="text-[11px] opacity-70">({filmCount})</span>
                  </button>
                  <button onClick={() => setFilterType('tv')} className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${filterType === 'tv' ? 'bg-foreground text-background font-bold shadow-md' : 'text-muted-foreground hover:text-foreground font-medium'}`}>
                    <span>Series</span><span className="text-[11px] opacity-70">({tvCount})</span>
                  </button>
                  <button onClick={() => setFilterType('anime')} className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${filterType === 'anime' ? 'bg-foreground text-background font-bold shadow-md' : 'text-muted-foreground hover:text-foreground font-medium'}`}>
                    <span>Anime</span><span className="text-[11px] opacity-70">({animeCount})</span>
                  </button>
                </nav>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex items-center p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08] border border-black/10 dark:border-white/10">
                  <button onClick={() => setViewMode('table')} className={`h-7 px-2.5 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${viewMode === 'table' ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                    <LayoutList className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setViewMode('grid')} className={`h-7 px-2.5 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${viewMode === 'grid' ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="hidden sm:block">
                  <ThemeToggle />
                </div>
                <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-black/[0.08] dark:border-white/[0.1]">
                   <span className="text-xs font-semibold text-muted-foreground bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-full">Shared Archive</span>
                </div>
              </div>
            </div>
            <div className="flex md:hidden py-2 border-t border-black/[0.06] dark:border-white/[0.08]">
              <div className="grid grid-cols-4 w-full bg-black/[0.04] dark:bg-white/[0.08] p-1 rounded-full text-[10px] font-medium border border-black/10 dark:border-white/10">
                <button onClick={() => setFilterType('all')} className={`py-1.5 rounded-full text-center transition-all cursor-pointer ${filterType === 'all' ? 'bg-foreground text-background font-bold shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>All ({totalCount})</button>
                <button onClick={() => setFilterType('movie')} className={`py-1.5 rounded-full text-center transition-all cursor-pointer ${filterType === 'movie' ? 'bg-foreground text-background font-bold shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Films ({filmCount})</button>
                <button onClick={() => setFilterType('tv')} className={`py-1.5 rounded-full text-center transition-all cursor-pointer ${filterType === 'tv' ? 'bg-foreground text-background font-bold shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Series ({tvCount})</button>
                <button onClick={() => setFilterType('anime')} className={`py-1.5 rounded-full text-center transition-all cursor-pointer ${filterType === 'anime' ? 'bg-foreground text-background font-bold shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>Anime ({animeCount})</button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-2">
            <div className="flex items-baseline space-x-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Shared Archive
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-xs font-medium text-muted-foreground">
                {filteredItems.length} titles
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <CustomSelect value={sortBy} options={[
                { value: 'year-desc', label: 'Year: Newest' },
                { value: 'year-asc', label: 'Year: Oldest' },
                { value: 'alpha-asc', label: 'Title: A → Z' },
                { value: 'alpha-desc', label: 'Title: Z → A' },
                { value: 'rating-desc', label: 'Rating: Highest ★' },
                { value: 'seasons-desc', label: 'Seasons: Most' },
              ]} onChange={(val) => setSortBy(val as any)} />

              {genresList.length > 0 && (
                <CustomSelect value={selectedGenre || ''} options={[{ value: '', label: 'All Genres' }, ...genresList.map((g) => ({ value: g, label: g }))]} onChange={(val) => setSelectedGenre(val || null)} placeholder="All Genres" />
              )}

              <div className="relative flex-1 sm:w-52 min-w-[140px]">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3.5 top-3 pointer-events-none" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter in archive..." className="h-9 w-full bg-black/[0.03] dark:bg-white/[0.07] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] focus:bg-white dark:focus:bg-zinc-900 rounded-full pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 border border-black/[0.06] dark:border-white/[0.08]" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground text-xs cursor-pointer">✕</button>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="text-xs text-muted-foreground font-medium">Loading archive...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-3">
              <span className="text-sm text-muted-foreground font-medium">Archive ini kosong atau tidak dapat diakses (Private).</span>
            </div>
          ) : viewMode === 'table' ? (
            <EditorialTableView items={filteredItems} onOpenSearch={() => {}} readonly={true} />
          ) : (
            <GridView items={filteredItems} onOpenSearch={() => {}} readonly={true} />
          )}
        </main>
      </div>
    </WathisContext.Provider>
  );
}
