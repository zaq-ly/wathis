'use client';

import React, { useState, useEffect } from 'react';
import { useWatchlist } from '@/context/WatchlistContext';
import { useLanguage } from '@/context/LanguageContext';
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
  const { t } = useLanguage();
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
    { value: 'year-desc', label: t.sortYearDesc },
    { value: 'year-asc', label: t.sortYearAsc },
    { value: 'default', label: t.sortRecent },
    { value: 'alpha-asc', label: t.sortAlphaAsc },
    { value: 'alpha-desc', label: t.sortAlphaDesc },
    { value: 'rating-desc', label: t.sortRatingDesc },
    { value: 'seasons-desc', label: t.sortSeasonsDesc },
  ];

  const genreOptions = [
    { value: '', label: t.allGenres },
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
        {/* YouTube-Style Dedicated Search Bar */}
        <div className="w-full max-w-2xl mx-auto pt-1 pb-2">
          <div
            onClick={() => setIsSearchOpen(true)}
            className="group flex items-center h-11 sm:h-12 w-full bg-black/[0.03] dark:bg-zinc-900/90 hover:bg-black/[0.05] dark:hover:bg-zinc-900 border border-black/10 dark:border-zinc-700/80 hover:border-black/20 dark:hover:border-zinc-500 rounded-full shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
          >
            <div className="flex-1 flex items-center px-4 space-x-3 text-muted-foreground group-hover:text-foreground transition-colors min-w-0">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs sm:text-sm font-normal truncate">
                {t.searchHeroPlaceholder}
              </span>
            </div>

            <div className="hidden sm:flex items-center space-x-1 pr-3">
              <kbd className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-[10px] font-mono font-semibold text-muted-foreground border border-black/5 dark:border-white/10">
                Ctrl K
              </kbd>
            </div>

            {/* YouTube-like Search Button Cap */}
            <div className="h-full px-5 sm:px-6 bg-black/[0.04] dark:bg-zinc-800/80 group-hover:bg-black/[0.08] dark:group-hover:bg-zinc-700/90 border-l border-black/10 dark:border-zinc-700/80 flex items-center justify-center transition-colors">
              <Search className="w-4 h-4 text-foreground" />
            </div>
          </div>
        </div>

        {/* Category Header & Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-2">
          {/* Headline & Title Count */}
          <div className="flex items-baseline space-x-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {filterType === 'movie' ? t.films : filterType === 'tv' ? t.series : filterType === 'anime' ? t.anime : t.all}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-xs font-medium text-muted-foreground">
              {filteredItems.length} {t.titlesCount}
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
                placeholder={t.allGenres}
              />
            )}

            {/* Quick Search Input Pill */}
            <div className="relative flex-1 sm:w-52 min-w-[140px]">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.filterInArchive}
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
            <span className="text-xs text-muted-foreground font-medium">Loading...</span>
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
            <span className="font-semibold text-foreground">wathis<span className="text-zinc-400">.</span></span>
            <span className="text-muted-foreground">{t.footerDesc}</span>
          </div>
          <div className="flex items-center space-x-3 text-muted-foreground text-[11px]">
            <span>{t.poweredBy}</span>
            <span>•</span>
            <span>{t.safeData}</span>
          </div>
        </div>
      </footer>

      {/* Apple Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
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


