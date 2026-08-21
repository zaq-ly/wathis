'use client';

import React, { useState, useEffect } from 'react';
import { useWatchlist } from '@/context/WatchlistContext';
import { Header } from '@/components/Header';
import { SearchModal } from '@/components/SearchModal';
import { AuthModal } from '@/components/AuthModal';
import { MigrationModal } from '@/components/MigrationModal';
import { EditorialTableView } from '@/components/EditorialTableView';
import { GridView } from '@/components/GridView';
import { Search, Loader2 } from 'lucide-react';

export default function HomePage() {
  const { filteredItems, isLoading, searchQuery, setSearchQuery } = useWatchlist();
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
    <div className="min-h-screen flex flex-col bg-[#08080a]">
      {/* Top Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenMigration={() => setIsMigrationOpen(true)}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Local Search and Filter In-Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-mono-code uppercase">
              Catalogue,
            </h1>
            <p className="text-xs text-zinc-500 font-mono-code mt-0.5">
              Personal record of completed cinematography & series.
            </p>
          </div>

          {/* Quick Filter in list */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter list..."
              className="w-full bg-zinc-900/60 border border-white/[0.08] rounded pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 font-mono-code focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="py-28 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
            <span className="text-xs text-zinc-500 font-mono-code">Loading archive...</span>
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
      <footer className="border-t border-white/[0.06] py-8 text-center text-xs font-mono-code text-zinc-600 bg-[#08080a]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="tracking-wide">WATCHLIST — Minimalist Editorial Database</span>
          <span className="text-zinc-600">TMDB API Verified Metadata</span>
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
