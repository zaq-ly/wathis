'use client';

import React, { useState } from 'react';
import { useWatchlist } from '@/context/WatchlistContext';
import { Search, Database, LogIn, LogOut, LayoutList, LayoutGrid, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  onOpenMigration: () => void;
  viewMode: 'table' | 'grid';
  setViewMode: (mode: 'table' | 'grid') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenAuth,
  onOpenMigration,
  viewMode,
  setViewMode,
}) => {
  const { items, user, isConfigured, filterType, setFilterType, selectedGenre, setSelectedGenre, genresList, resetToNotionArchive } = useWatchlist();
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const filmCount = items.filter((i) => i.media_type === 'movie').length;
  const seriesCount = items.filter((i) => i.media_type === 'tv').length;

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#08080a]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with Satoshi Watanabe monogram inspired branding */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6 sm:space-x-8">
            {/* Monogram Brand */}
            <button
              type="button"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
              className="flex items-center font-mono-code font-bold text-sm tracking-tight text-white focus:outline-none select-none group"
            >
              <div className="flex items-center h-6 overflow-hidden">
                <span className="text-white text-base">W.</span>
                <span className={`text-zinc-500 text-xs transition-all duration-300 overflow-hidden whitespace-nowrap ${isLogoHovered ? 'max-w-xs opacity-100 pl-0.5 pr-1' : 'max-w-0 opacity-0'}`}>
                  ATCH
                </span>
                <span className="text-white text-base">L.</span>
                <span className={`text-zinc-500 text-xs transition-all duration-300 overflow-hidden whitespace-nowrap ${isLogoHovered ? 'max-w-xs opacity-100 pl-0.5' : 'max-w-0 opacity-0'}`}>
                  IST
                </span>
              </div>
            </button>

            {/* Editorial Nav Tabs */}
            <nav className="flex items-center space-x-4 sm:space-x-6 font-mono-code text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`transition-colors relative py-1 ${
                  filterType === 'all'
                    ? 'text-white font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                All,
                {filterType === 'all' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white rounded-full" />
                )}
              </button>

              <button
                onClick={() => setFilterType('movie')}
                className={`transition-colors relative py-1 ${
                  filterType === 'movie'
                    ? 'text-white font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Film <span className="text-[10px] text-zinc-500 font-normal">({filmCount})</span>,
                {filterType === 'movie' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white rounded-full" />
                )}
              </button>

              <button
                onClick={() => setFilterType('tv')}
                className={`transition-colors relative py-1 ${
                  filterType === 'tv'
                    ? 'text-white font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Series <span className="text-[10px] text-zinc-500 font-normal">({seriesCount})</span>
                {filterType === 'tv' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white rounded-full" />
                )}
              </button>
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Sync TMDB Data Button */}
            <button
              onClick={() => {
                resetToNotionArchive();
                setIsSynced(true);
                setTimeout(() => setIsSynced(false), 2000);
              }}
              className="flex items-center space-x-1.5 text-xs font-mono-code text-zinc-400 hover:text-white px-2.5 py-1.5 rounded transition-colors"
              title="Sync & Reload All TMDB Posters and Years"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${isSynced ? 'animate-spin text-white' : ''}`} />
              <span className="hidden sm:inline">{isSynced ? 'Synced!' : 'Sync TMDB'}</span>
            </button>

            {/* Notion Migration Tool */}
            <button
              onClick={onOpenMigration}
              className="flex items-center space-x-1.5 text-xs font-mono-code text-zinc-400 hover:text-white px-2.5 py-1.5 rounded transition-colors"
              title="Notion 183 Titles Migration Assistant"
            >
              <Database className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Migrate</span>
            </button>

            {/* Quick Search Shortcut */}
            <button
              onClick={onOpenSearch}
              className="flex items-center space-x-2 text-xs font-mono-code bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3 py-1.5 rounded border border-white/[0.08] hover:border-white/[0.2] transition-all"
              title="Search and Add Movie/Series (Shortcut: /)"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden md:inline">Search</span>
              <kbd className="text-[10px] bg-zinc-800/80 px-1 py-0.5 rounded text-zinc-400 border border-zinc-700/60">
                /
              </kbd>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-900 border border-white/[0.08] rounded p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Editorial Table View"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Grid Posters View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Auth / Account */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-zinc-800">
                <span className="text-xs text-zinc-400 font-mono-code hidden md:inline truncate max-w-[100px]">
                  {user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-zinc-500 hover:text-red-400 rounded transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 text-xs font-mono-code bg-white text-zinc-950 font-bold px-3 py-1.5 rounded hover:bg-zinc-200 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isConfigured ? 'Sign In' : 'Auth'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-bar: Genre horizontal strip */}
        {genresList.length > 0 && (
          <div className="py-2 flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs font-mono-code border-t border-white/[0.04]">
            <span className="text-zinc-600 text-[10px] uppercase tracking-wider pl-1 shrink-0">Genres:</span>
            <button
              onClick={() => setSelectedGenre(null)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors whitespace-nowrap ${
                selectedGenre === null
                  ? 'bg-white text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-white/[0.06]'
              }`}
            >
              All
            </button>
            {genresList.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors whitespace-nowrap ${
                  selectedGenre === genre
                    ? 'bg-white text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-white/[0.06]'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

