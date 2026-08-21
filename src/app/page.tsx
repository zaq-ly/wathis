'use client';

import React, { useState, useEffect } from 'react';
import { useWatchlist } from '@/context/WatchlistContext';
import { Header } from '@/components/Header';
import { SearchModal } from '@/components/SearchModal';
import { AuthModal } from '@/components/AuthModal';
import { MigrationModal } from '@/components/MigrationModal';
import { EditorialTableView } from '@/components/EditorialTableView';
import { GridView } from '@/components/GridView';
import { Search, Loader2, ChevronDown } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex flex-col bg-[#050507]">
      {/* Top Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenMigration={() => setIsMigrationOpen(true)}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        {/* Local Search and Filter In-Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/[0.04]">
          <div className="flex items-baseline space-x-2 shrink-0">
            <h1 className="text-xs sm:text-sm font-mono-code font-semibold tracking-tight text-zinc-100 uppercase">
              {filterType === 'movie' ? 'Films' : filterType === 'tv' ? 'Series' : 'Archive'}
            </h1>
            <span className="text-[10px] sm:text-[11px] text-zinc-600 font-mono-code">
              {filteredItems.length} titles
            </span>
          </div>

          {/* Quick Filters: Sort + Genre Select + Search Text Input */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Sort Selector Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.2] rounded-md pl-2.5 pr-7 py-1.5 text-xs text-zinc-300 font-mono-code focus:outline-none focus:border-white/[0.3] transition-colors appearance-none cursor-pointer"
                title="Sort titles"
              >
                <option value="default" className="bg-[#0e0f13] text-zinc-300">Sort: Default</option>
                <option value="alpha-asc" className="bg-[#0e0f13] text-zinc-300">Abjad: A → Z</option>
                <option value="alpha-desc" className="bg-[#0e0f13] text-zinc-300">Abjad: Z → A</option>
                <option value="year-desc" className="bg-[#0e0f13] text-zinc-300">Tahun: Terbaru</option>
                <option value="year-asc" className="bg-[#0e0f13] text-zinc-300">Tahun: Terlama</option>
                <option value="rating-desc" className="bg-[#0e0f13] text-zinc-300">Rating: Tertinggi ★</option>
                <option value="seasons-desc" className="bg-[#0e0f13] text-zinc-300">Season: Terbanyak</option>
              </select>
              <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Minimal Genre Dropdown */}
            {genresList.length > 0 && (
              <div className="relative shrink-0">
                <select
                  value={selectedGenre || ''}
                  onChange={(e) => setSelectedGenre(e.target.value || null)}
                  className="bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.2] rounded-md pl-2.5 pr-7 py-1.5 text-xs text-zinc-300 font-mono-code focus:outline-none focus:border-white/[0.3] transition-colors appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#0e0f13] text-zinc-300">All Genres</option>
                  {genresList.map((genre) => (
                    <option key={genre} value={genre} className="bg-[#0e0f13] text-zinc-300">
                      {genre}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            )}

            {/* Quick Search in List */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-zinc-600 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter title..."
                className="w-full bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.2] rounded-md pl-8 pr-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 font-mono-code focus:outline-none focus:border-white/[0.3] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
            <span className="text-xs text-zinc-600 font-mono-code">Loading catalogue...</span>
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

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-6 text-xs font-mono-code text-zinc-700 bg-[#050507]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <span>wathis. — Minimalist Film & Series Archive</span>
          <span>Official TMDB Metadata</span>
        </div>
      </footer>

      {/* Modals */}
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
