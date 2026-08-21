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
  const {
    items,
    user,
    isConfigured,
    filterType,
    setFilterType,
    selectedGenre,
    setSelectedGenre,
    genresList,
    resetToNotionArchive,
  } = useWatchlist();
  const [isSynced, setIsSynced] = useState(false);
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const filmCount = items.filter((i) => i.media_type === 'movie').length;
  const seriesCount = items.filter((i) => i.media_type === 'tv').length;
  const totalCount = items.length;

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050507]/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navbar */}
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-6 sm:space-x-8">
            {/* Logo */}
            <button
              type="button"
              className="flex items-center font-mono-code font-bold text-base tracking-tighter text-white select-none group"
            >
              <span className="text-white hover:text-zinc-300 transition-colors">
                wathis<span className="text-zinc-500 group-hover:text-white transition-colors">.</span>
              </span>
            </button>

            {/* Clean Editorial Nav Tabs */}
            <nav className="flex items-center space-x-4 sm:space-x-6 text-xs font-mono-code">
              <button
                onClick={() => setFilterType('all')}
                className={`transition-colors relative py-1.5 flex items-center space-x-1.5 ${
                  filterType === 'all'
                    ? 'text-white font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>All</span>
                <span className="text-[10px] text-zinc-600 font-normal">({totalCount})</span>
                {filterType === 'all' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white rounded-full" />
                )}
              </button>

              <button
                onClick={() => setFilterType('movie')}
                className={`transition-colors relative py-1.5 flex items-center space-x-1.5 ${
                  filterType === 'movie'
                    ? 'text-white font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>Film</span>
                <span className="text-[10px] text-zinc-600 font-normal">({filmCount})</span>
                {filterType === 'movie' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white rounded-full" />
                )}
              </button>

              <button
                onClick={() => setFilterType('tv')}
                className={`transition-colors relative py-1.5 flex items-center space-x-1.5 ${
                  filterType === 'tv'
                    ? 'text-white font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>Series</span>
                <span className="text-[10px] text-zinc-600 font-normal">({seriesCount})</span>
                {filterType === 'tv' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white rounded-full" />
                )}
              </button>
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Search Shortcut */}
            <button
              onClick={onOpenSearch}
              className="flex items-center space-x-2 text-xs font-mono-code bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white px-2.5 py-1.5 rounded border border-white/[0.06] hover:border-white/[0.15] transition-all"
              title="Search and Add Movie/Series (Shortcut: /)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Search</span>
              <kbd className="text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded text-zinc-500 border border-white/[0.08]">
                /
              </kbd>
            </button>

            {/* Sync TMDB Data Button */}
            <button
              onClick={() => {
                resetToNotionArchive();
                setIsSynced(true);
                setTimeout(() => setIsSynced(false), 2000);
              }}
              className="flex items-center space-x-1.5 text-xs font-mono-code text-zinc-500 hover:text-zinc-300 px-2 py-1.5 rounded transition-colors"
              title="Reload TMDB Posters and Years"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSynced ? 'animate-spin text-white' : ''}`} />
            </button>

            {/* Notion Migration Tool */}
            <button
              onClick={onOpenMigration}
              className="flex items-center space-x-1.5 text-xs font-mono-code text-zinc-500 hover:text-zinc-300 px-2 py-1.5 rounded transition-colors"
              title="Notion Migration Assistant"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Migrate</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-white/[0.1] text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Editorial Table View"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-white/[0.1] text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Poster Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Auth Profile / Login Button */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-white/[0.06]">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.full_name || 'User'}
                    className="w-5 h-5 rounded-full border border-white/[0.2] object-cover"
                  />
                ) : null}
                <span className="text-xs text-zinc-300 font-mono-code hidden md:inline truncate max-w-[120px]">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
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
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-bar: Genre horizontal strip */}
        {genresList.length > 0 && (
          <div className="py-2 flex items-center space-x-1.5 overflow-x-auto no-scrollbar text-xs font-mono-code border-t border-white/[0.04]">
            <span className="text-zinc-600 text-[10px] uppercase tracking-wider pr-1 shrink-0 select-none">
              Filter:
            </span>
            <button
              onClick={() => setSelectedGenre(null)}
              className={`px-2.5 py-1 rounded text-[11px] transition-all whitespace-nowrap ${
                selectedGenre === null
                  ? 'bg-white text-zinc-950 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
              }`}
            >
              All
            </button>
            {genresList.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-2.5 py-1 rounded text-[11px] transition-all whitespace-nowrap ${
                  selectedGenre === genre
                    ? 'bg-white text-zinc-950 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
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
