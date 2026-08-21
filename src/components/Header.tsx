'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWatchlist } from '@/context/WatchlistContext';
import { Search, Database, LogIn, LogOut, LayoutList, LayoutGrid, RefreshCw, MoreVertical, Film, Tv, Layers } from 'lucide-react';
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
    filterType,
    setFilterType,
    selectedGenre,
    setSelectedGenre,
    genresList,
    resetToNotionArchive,
  } = useWatchlist();
  const [isSynced, setIsSynced] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const filmCount = items.filter((i) => i.media_type === 'movie').length;
  const seriesCount = items.filter((i) => i.media_type === 'tv').length;
  const totalCount = items.length;

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050507]/95 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Main Navbar Row */}
        <div className="flex items-center justify-between h-14">
          {/* Left: Brand Logo & Desktop Nav Tabs */}
          <div className="flex items-center space-x-6 sm:space-x-8">
            <button
              type="button"
              onClick={() => {
                setFilterType('all');
                setSelectedGenre(null);
              }}
              className="flex items-center font-mono-code font-bold text-base tracking-tight text-white select-none group"
            >
              <span className="text-white hover:text-zinc-300 transition-colors">
                wathis<span className="text-zinc-500 group-hover:text-white transition-colors">.</span>
              </span>
            </button>

            {/* Desktop Navigation Tabs (Hidden on Mobile) */}
            <nav className="hidden md:flex items-center space-x-6 text-xs font-mono-code">
              <button
                onClick={() => setFilterType('all')}
                className={`transition-colors relative py-1.5 flex items-center space-x-1.5 ${
                  filterType === 'all' ? 'text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'
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
                  filterType === 'movie' ? 'text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'
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
                  filterType === 'tv' ? 'text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'
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

          {/* Right Action Controls (Desktop + Mobile Responsive) */}
          <div className="flex items-center space-x-2">
            {/* Search Trigger Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center space-x-2 text-xs font-mono-code bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-md border border-white/[0.08] hover:border-white/[0.2] transition-all"
              title="Search and Add (Shortcut: /)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Search</span>
              <kbd className="hidden md:inline text-[9px] bg-white/[0.06] px-1.5 py-0.5 rounded text-zinc-500 border border-white/[0.08]">
                /
              </kbd>
            </button>

            {/* View Mode Toggle Switch */}
            <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-md p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
                title="List / Table View"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
                title="Poster Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Desktop Only Tools: Sync, Migrate, Profile */}
            <div className="hidden md:flex items-center space-x-1.5 pl-1.5 border-l border-white/[0.06]">
              <button
                onClick={() => {
                  resetToNotionArchive();
                  setIsSynced(true);
                  setTimeout(() => setIsSynced(false), 2000);
                }}
                className="p-1.5 text-zinc-400 hover:text-white rounded transition-colors"
                title="Reload TMDB Archive"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSynced ? 'animate-spin text-white' : ''}`} />
              </button>

              <button
                onClick={onOpenMigration}
                className="flex items-center space-x-1.5 text-xs font-mono-code text-zinc-400 hover:text-white px-2 py-1.5 rounded transition-colors"
                title="Data Import & Migration"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="text-[11px]">Import</span>
              </button>

              {user ? (
                <div className="flex items-center space-x-2 pl-2 border-l border-white/[0.06]">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.full_name || 'User'}
                      className="w-5 h-5 rounded-full border border-white/[0.2] object-cover"
                    />
                  ) : null}
                  <span className="text-xs text-zinc-300 font-mono-code truncate max-w-[100px]">
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
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile Dropdown Overflow Menu */}
            <div className="relative md:hidden" ref={mobileMenuRef}>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-md bg-white/[0.04] border border-white/[0.08]"
                title="Menu"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#0e0f13] border border-white/[0.12] rounded-lg shadow-2xl p-1.5 space-y-1 font-mono-code text-xs z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      resetToNotionArchive();
                      setIsSynced(true);
                      setTimeout(() => setIsSynced(false), 2000);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-2 text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded transition-colors text-left"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSynced ? 'animate-spin' : ''}`} />
                    <span>Sync Archive</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenMigration();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-2 text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded transition-colors text-left"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Import Data</span>
                  </button>

                  <div className="border-t border-white/[0.06] my-1" />

                  {user ? (
                    <div className="px-2 py-1 space-y-1">
                      <div className="text-[10px] text-zinc-500 truncate">
                        {user.user_metadata?.full_name || user.email}
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-2 py-1.5 text-red-400 hover:text-red-300 text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        onOpenAuth();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 text-white bg-white/[0.08] hover:bg-white/[0.15] rounded transition-colors text-left font-bold"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In with Google</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Segmented Category Bar (All / Films / Series) */}
        <div className="flex md:hidden py-2 border-t border-white/[0.04]">
          <div className="grid grid-cols-3 w-full bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.06] text-xs font-mono-code">
            <button
              onClick={() => setFilterType('all')}
              className={`py-1.5 rounded-md text-center flex items-center justify-center space-x-1 transition-all ${
                filterType === 'all'
                  ? 'bg-white text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>All ({totalCount})</span>
            </button>

            <button
              onClick={() => setFilterType('movie')}
              className={`py-1.5 rounded-md text-center flex items-center justify-center space-x-1 transition-all ${
                filterType === 'movie'
                  ? 'bg-white text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Film className="w-3 h-3" />
              <span>Films ({filmCount})</span>
            </button>

            <button
              onClick={() => setFilterType('tv')}
              className={`py-1.5 rounded-md text-center flex items-center justify-center space-x-1 transition-all ${
                filterType === 'tv'
                  ? 'bg-white text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Tv className="w-3 h-3" />
              <span>Series ({seriesCount})</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

