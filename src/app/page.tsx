'use client';

import React, { useState, useEffect } from 'react';
import { useWatchlist } from '@/context/WatchlistContext';
import { Header } from '@/components/Header';
import { SearchModal } from '@/components/SearchModal';
import { AuthModal } from '@/components/AuthModal';
import { MigrationModal } from '@/components/MigrationModal';
import { EditorialTableView } from '@/components/EditorialTableView';
import { GridView } from '@/components/GridView';
import { Search, Loader2, Sparkles, Filter } from 'lucide-react';
import { CustomSelect } from '@/components/CustomSelect';

export default function HomePage() {
  const {
    filteredItems,
    isLoading,
    searchQuery,
    setSearchQuery,
    filterType,
    selectedGenre,
    setSelectedGenre,
    genresList,
    sortBy,
    setSortBy,
  } = useWatchlist();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);

  // Global Keyboard Shortcuts (like '/' or 'Ctrl+K' to open search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sortOptions = [
    { value: 'year-desc', label: 'Year: Newest' },
    { value: 'year-asc', label: 'Year: Oldest' },
    { value: 'default', label: 'Recently Added' },
    { value: 'alpha-asc', label: 'Title: A → Z' },
    { value: 'alpha-desc', label: 'Title: Z → A' },
    { value: 'rating-desc', label: 'Rating: Highest ★' },
    { value: 'seasons-desc', label: 'Seasons: Most' },
  ];

  const genreOptions = [
    { value: '', label: 'All Genres' },
    ...genresList.map((g) => ({ value: g, label: g })),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* Apple Navigation Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenMigration={() => setIsMigrationOpen(true)}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5">
        {/* Category Header & Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-2">
          {/* Headline & Title Count */}
          <div className="flex items-baseline space-x-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {filterType === 'movie' ? 'Films' : filterType === 'tv' ? 'Series' : 'Archive'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-xs font-medium text-muted-foreground">
              {filteredItems.length} titles
            </span>
          </div>

          {/* Apple Toolbar: Sort + Genre Filter + Search Pill */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sort Dropdown */}
            <CustomSelect
              value={sortBy}
              options={sortOptions}
              onChange={(val) => setSortBy(val as any)}
            />

            {/* Genre Dropdown */}
            {genresList.length > 0 && (
              <CustomSelect
                value={selectedGenre || ''}
                options={genreOptions}
                onChange={(val) => setSelectedGenre(val || null)}
                placeholder="All Genres"
              />
            )}

            {/* Quick Search Input Pill */}
            <div className="relative flex-1 sm:w-52 min-w-[140px]">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter in archive..."
                className="h-9 w-full bg-black/[0.03] dark:bg-white/[0.07] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] focus:bg-white dark:focus:bg-zinc-900 rounded-full pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200 border border-black/[0.06] dark:border-white/[0.08]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="text-xs text-muted-foreground font-medium">Loading your archive...</span>
          </div>
        ) : viewMode === 'table' ? (
          <EditorialTableView
            items={filteredItems}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        ) : (
          <GridView
            items={filteredItems}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        )}
      </main>

      {/* Apple Style Minimalist Footer */}
      <footer className="border-t border-black/[0.06] dark:border-white/[0.08] py-8 text-xs text-muted-foreground bg-transparent mt-auto transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-foreground">wathis.</span>
            <span>— Personal Cinema & Series Archive</span>
          </div>
          <span className="text-muted-foreground">Powered by TMDB Metadata</span>
        </div>
      </footer>

      {/* Apple Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
      <MigrationModal
        isOpen={isMigrationOpen}
        onClose={() => setIsMigrationOpen(false)}
      />
    </div>
  );
}


