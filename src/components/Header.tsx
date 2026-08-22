'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWatchlist } from '@/context/WatchlistContext';
import { useTheme } from '@/context/ThemeContext';
import { Search, Database, LogIn, LogOut, LayoutList, LayoutGrid, Layers, Film, Tv, Sparkles, Monitor, Moon, Sun, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

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
    setSelectedGenre,
    signOut,
    syncAllTitlesWithTMDB,
    isSyncing,
    syncProgress,
  } = useWatchlist();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSignOut = async () => {
    setShowLogoutConfirm(false);
    setIsMobileMenuOpen(false);
    await signOut();
  };

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

  const totalCount = items.length;
  const filmCount = items.filter((i) => i.media_type === 'movie').length;
  const tvCount = items.filter((i) => i.media_type === 'tv').length;

  return (
    <header className="sticky top-0 z-40 apple-glass-nav border-b border-black/[0.06] dark:border-white/[0.08] transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Apple Navbar */}
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left: Brand Logo & Segmented Navigation */}
          <div className="flex items-center space-x-6 sm:space-x-8">
            {/* Brand Logo with Page Reload */}
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="flex items-center space-x-2.5 font-semibold text-base tracking-tight text-foreground select-none group cursor-pointer apple-btn-active"
              title="Refresh / Beranda"
            >
              <div className="w-8 h-8 rounded-md overflow-hidden flex items-center justify-center">
                <img
                  src="/logo_zoomed.jpg"
                  alt="wathis logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-semibold text-base tracking-tight text-foreground">
                wathis<span className="text-zinc-400">.</span>
              </span>
            </button>

            {/* Apple Segmented Pill Switcher (Desktop) */}
            <nav className="hidden md:flex items-center p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08] border border-black/10 dark:border-white/10">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${
                  filterType === 'all'
                    ? 'bg-foreground text-background font-bold shadow-md'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                <span>All</span>
                <span className="text-[11px] opacity-70">({totalCount})</span>
              </button>

              <button
                onClick={() => setFilterType('movie')}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${
                  filterType === 'movie'
                    ? 'bg-foreground text-background font-bold shadow-md'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                <span>Films</span>
                <span className="text-[11px] opacity-70">({filmCount})</span>
              </button>

              <button
                onClick={() => setFilterType('tv')}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${
                  filterType === 'tv'
                    ? 'bg-foreground text-background font-bold shadow-md'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                <span>Series</span>
                <span className="text-[11px] opacity-70">({tvCount})</span>
              </button>
            </nav>
          </div>

          {/* Right: Apple Search Bar Trigger & Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Trigger (Icon on mobile, pill on desktop) */}
            <button
              onClick={onOpenSearch}
              className="h-9 px-3 sm:px-4 flex items-center space-x-2 bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] border border-black/[0.04] dark:border-white/[0.06] text-muted-foreground hover:text-foreground rounded-full text-xs font-medium transition-all duration-200 cursor-pointer apple-btn-active"
              title="Cari film & series"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Cari film atau series...</span>
            </button>

            {/* Segmented View Toggle (Always in navbar) */}
            <div className="flex items-center p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08] border border-black/10 dark:border-white/10">
              <button
                onClick={() => setViewMode('table')}
                className={`h-7 px-2.5 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-foreground text-background shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Tampilan List"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`h-7 px-2.5 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-foreground text-background shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Tampilan Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Theme Toggle Button (Desktop & Tablet only) */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Desktop Actions: Import, Sync & Auth */}
            <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-black/[0.08] dark:border-white/[0.1]">
              <button
                onClick={async () => {
                  const res = await syncAllTitlesWithTMDB();
                  showToast(`Sinkronisasi selesai! ${res.updated} judul berhasil diperbarui.`);
                }}
                disabled={isSyncing}
                className="h-9 px-3.5 rounded-full text-xs font-medium text-foreground bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition-all flex items-center space-x-1.5 cursor-pointer apple-btn-active disabled:opacity-60"
                title="Sinkronkan semua judul ke versi standar TMDB"
              >
                {isSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span>
                  {isSyncing
                    ? `Sync (${syncProgress?.current || 0}/${syncProgress?.total || items.length})...`
                    : 'Sync TMDB'}
                </span>
              </button>

              <button
                onClick={onOpenMigration}
                className="h-9 px-3.5 rounded-full text-xs font-medium text-foreground bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition-all flex items-center space-x-1.5 cursor-pointer apple-btn-active"
                title="Import / Export Data"
              >
                <Database className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Import</span>
              </button>

              {user ? (
                <div className="flex items-center space-x-2 pl-2">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.full_name || 'User'}
                      className="w-7 h-7 rounded-full border border-black/10 dark:border-white/15 object-cover"
                    />
                  ) : null}
                  <span className="text-xs text-foreground font-medium whitespace-nowrap max-w-[250px] truncate" title={user.email || ''}>
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="h-9 px-4 rounded-full text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity shadow-sm flex items-center space-x-1.5 cursor-pointer apple-btn-active"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile Hamburger Drawer Trigger */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="h-9 w-9 flex items-center justify-center text-foreground rounded-full bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.08] cursor-pointer apple-btn-active"
                title="Open Navigation Menu"
              >
                <Layers className="w-4 h-4" />
              </button>

              {/* Gmail / iOS Slide-Over Drawer & Backdrop */}
              {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                  {/* Backdrop with Soft Dark Blur */}
                  <div
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
                  />

                  {/* Drawer Canvas with Apple Frosted Glass Blur */}
                  <div
                    ref={mobileMenuRef}
                    className="relative w-[300px] max-w-[85vw] h-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-3xl backdrop-saturate-150 border-l border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-right duration-300"
                  >
                    <div className="space-y-5">
                      {/* Drawer Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                        <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                          Menu
                        </span>

                        <button
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          title="Tutup Menu"
                        >
                          <span className="text-base leading-none font-bold">✕</span>
                        </button>
                      </div>

                      {/* User Card / Authentic Google Login Button */}
                      {user ? (
                        <div className="p-3 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl border border-black/[0.04] dark:border-white/[0.06] flex items-center space-x-3">
                          {user.user_metadata?.avatar_url ? (
                            <img
                              src={user.user_metadata.avatar_url}
                              alt="User"
                              className="w-9 h-9 rounded-full border border-black/10 dark:border-white/15 object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                              {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-foreground truncate text-xs">
                              {user.user_metadata?.full_name || 'Akun'}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            onOpenAuth();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-center space-x-2.5 p-3 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-100 font-semibold rounded-2xl border border-zinc-200 dark:border-zinc-700/80 transition-all shadow-xs cursor-pointer apple-btn-active text-xs"
                        >
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span>Lanjutkan dengan Google</span>
                        </button>
                      )}

                      {/* Section: Tema */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground px-2">Tema</div>
                        <div className="grid grid-cols-3 p-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
                          <button
                            onClick={() => setTheme('system')}
                            className={`py-2 rounded-xl flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                              theme === 'system' ? 'bg-foreground text-background font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Monitor className="w-3 h-3" />
                            <span className="text-[11px]">System</span>
                          </button>
                          <button
                            onClick={() => setTheme('dark')}
                            className={`py-2 rounded-xl flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                              theme === 'dark' ? 'bg-foreground text-background font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Moon className="w-3 h-3" />
                            <span className="text-[11px]">Dark</span>
                          </button>
                          <button
                            onClick={() => setTheme('light')}
                            className={`py-2 rounded-xl flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                              theme === 'light' ? 'bg-foreground text-background font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Sun className="w-3 h-3" />
                            <span className="text-[11px]">Light</span>
                          </button>
                        </div>
                      </div>

                      {/* Section: Sync TMDB English Titles */}
                      <button
                        onClick={async () => {
                          const res = await syncAllTitlesWithTMDB();
                          showToast(`Sinkronisasi selesai! ${res.updated} judul berhasil diperbarui.`);
                          setIsMobileMenuOpen(false);
                        }}
                        disabled={isSyncing}
                        className="w-full flex items-center justify-between p-3 text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-2xl transition-colors text-left cursor-pointer border border-black/[0.04] dark:border-white/[0.06] disabled:opacity-60"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            {isSyncing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-foreground truncate">
                              {isSyncing
                                ? `Sinkronisasi (${syncProgress?.current || 0}/${syncProgress?.total || items.length})...`
                                : 'Sinkronkan Judul Inggris TMDB'}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              Perbarui semua judul arsip ke versi resmi TMDB
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                      </button>

                      {/* Section: Import Data */}
                      <button
                        onClick={() => {
                          onOpenMigration();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-3 text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-2xl transition-colors text-left cursor-pointer border border-black/[0.04] dark:border-white/[0.06]"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Database className="w-4 h-4" />
                          </div>
                          <span className="font-semibold text-xs">Import Data (CSV)</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Drawer Footer: Logout & Brand */}
                    <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-3">
                      {user && (
                        <button
                          onClick={() => setShowLogoutConfirm(true)}
                          className="w-full flex items-center space-x-2.5 p-3 text-red-500 hover:bg-red-500/10 rounded-2xl transition-colors text-left cursor-pointer font-semibold text-xs"
                        >
                          <div className="w-7 h-7 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                            <LogOut className="w-3.5 h-3.5" />
                          </div>
                          <span>Keluar (Sign Out)</span>
                        </button>
                      )}
                      <div className="text-[10px] text-muted-foreground text-center">
                        wathis. — Personal Cinema Archive
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Segmented Category Bar */}
        <div className="flex md:hidden py-2 border-t border-black/[0.06] dark:border-white/[0.08]">
          <div className="grid grid-cols-3 w-full bg-black/[0.04] dark:bg-white/[0.08] p-1 rounded-full text-xs font-medium border border-black/10 dark:border-white/10">
            <button
              onClick={() => setFilterType('all')}
              className={`py-1.5 rounded-full text-center flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-foreground text-background font-bold shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>All ({totalCount})</span>
            </button>

            <button
              onClick={() => setFilterType('movie')}
              className={`py-1.5 rounded-full text-center flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                filterType === 'movie'
                  ? 'bg-foreground text-background font-bold shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Films ({filmCount})</span>
            </button>

            <button
              onClick={() => setFilterType('tv')}
              className={`py-1.5 rounded-full text-center flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                filterType === 'tv'
                  ? 'bg-foreground text-background font-bold shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Series ({tvCount})</span>
            </button>
          </div>
        </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-black/90 dark:bg-white text-white dark:text-black px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-5 duration-300 border border-white/10 dark:border-black/10">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Custom Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-2xl w-full max-w-sm p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-foreground mb-2">Konfirmasi Logout</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Apakah Anda yakin ingin keluar dari akun ini? Anda harus login kembali untuk menyinkronkan data.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-foreground bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 rounded-full transition-colors cursor-pointer apple-btn-active"
              >
                Batal
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-sm cursor-pointer apple-btn-active"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </header>
  );
};
