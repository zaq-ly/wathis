'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useWatchlist } from '@/context/WatchlistContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Search, Database, LogIn, LogOut, LayoutList, LayoutGrid, Film, Tv, Sparkles, Monitor, Moon, Sun, ChevronRight, RefreshCw, Loader2, Share2, CheckCircle2, Download, Globe, HelpCircle } from 'lucide-react';
import { isAnimeItem } from '@/lib/utils';

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
  const { language, setLanguage, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSignOut = async () => {
    setShowLogoutConfirm(false);
    setIsMobileMenuOpen(false);
    await signOut();
  };

  const handleExportCSV = () => {
    if (!items || items.length === 0) {
      showToast(t.noExportData);
      return;
    }
    const headers = ['title', 'media_type', 'release_year', 'release_date', 'vote_average', 'genres', 'poster_path', 'overview', 'season_count', 'season_label', 'tmdb_id'];
    const rows = items.map(item => [
      `"${(item.title || '').replace(/"/g, '""')}"`,
      item.media_type || '',
      item.release_year || '',
      item.release_date || '',
      item.vote_average || '',
      `"${(item.genres || []).join(', ')}"`,
      item.poster_path || '',
      `"${(item.overview || '').replace(/"/g, '""')}"`,
      item.season_count || '',
      item.season_label || '',
      item.tmdb_id || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wathis_archive_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(t.exportFinished);
    setIsMobileMenuOpen(false);
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
  const filmCount = items.filter((i) => i.media_type === 'movie' && !isAnimeItem(i)).length;
  const tvCount = items.filter((i) => i.media_type === 'tv' && !isAnimeItem(i)).length;
  const animeCount = items.filter((i) => isAnimeItem(i)).length;

  return (
    <>
      <header className="sticky top-0 z-40 apple-glass-nav border-b border-black/[0.06] dark:border-white/[0.08] transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Apple Navbar */}
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left: Brand Logo & Segmented Navigation */}
          <div className="flex items-center space-x-4 sm:space-x-8 min-w-0">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center space-x-2 sm:space-x-2.5 font-semibold text-sm sm:text-base tracking-tight text-foreground select-none group cursor-pointer apple-btn-active shrink-0"
              title="Beranda wathis"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src="/logo_zoomed.jpg"
                  alt="wathis logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-semibold tracking-tight text-foreground">
                wathis<span className="text-zinc-400">.</span>
              </span>
            </Link>

            {/* Apple Segmented Pill Switcher (Desktop) */}
            <nav className="hidden md:flex items-center p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08] border border-black/10 dark:border-white/10 shrink-0">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${
                  filterType === 'all'
                    ? 'bg-foreground text-background font-bold shadow-md'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                <span>{t.all}</span>
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
                <span>{t.films}</span>
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
                <span>{t.series}</span>
                <span className="text-[11px] opacity-70">({tvCount})</span>
              </button>

              <button
                onClick={() => setFilterType('anime')}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${
                  filterType === 'anime'
                    ? 'bg-foreground text-background font-bold shadow-md'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                <span>{t.anime}</span>
                <span className="text-[11px] opacity-70">({animeCount})</span>
              </button>
            </nav>
          </div>

          {/* Right: Controls & Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            {/* Tampilan List / Grid Toggle */}
            <div className="flex items-center p-0.5 sm:p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08] border border-black/10 dark:border-white/10">
              <button
                onClick={() => setViewMode('table')}
                className={`h-7 w-7 sm:w-auto sm:px-2.5 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-foreground text-background shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={t.viewList}
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`h-7 w-7 sm:w-auto sm:px-2.5 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-foreground text-background shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={t.viewGrid}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* When Logged In: Share & Profile Popover */}
            {user ? (
              <>
                {/* Share Button */}
                <button
                  onClick={async () => {
                    const url = `${window.location.origin}/share/${user.id}`;
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      try {
                        await navigator.share({
                          title: 'wathis - Personal Cinema Archive',
                          text: language === 'id' ? 'Lihat koleksi tontonan film & series saya di wathis' : 'Check out my personal cinema & series archive on wathis',
                          url,
                        });
                        return;
                      } catch (err: any) {
                        if (err.name === 'AbortError') return;
                      }
                    }
                    try {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(url);
                      } else {
                        const textArea = document.createElement('textarea');
                        textArea.value = url;
                        textArea.style.position = 'fixed';
                        textArea.style.opacity = '0';
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                      }
                      showToast(t.linkCopied);
                    } catch {
                      showToast('Link: ' + url);
                    }
                  }}
                  className="h-7 w-7 sm:h-8 sm:w-auto sm:px-3 rounded-full text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all flex items-center justify-center space-x-1.5 cursor-pointer apple-btn-active shrink-0"
                  title={t.share}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.share}</span>
                </button>

                {/* Profile Akun Button & Popover Popup Menu */}
                <div className="relative" ref={mobileMenuRef}>
                  <button
                    onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                    className={`flex items-center p-1 sm:pl-1 sm:pr-3 space-x-0 sm:space-x-2 rounded-full transition-all cursor-pointer apple-btn-active border shrink-0 ${
                      isMobileMenuOpen
                        ? 'bg-black/[0.08] dark:bg-white/[0.16] border-black/20 dark:border-white/20'
                        : 'bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] border-black/10 dark:border-white/10'
                    }`}
                    title="Menu & Settings"
                  >
                    {avatarUrl && !avatarError ? (
                      <img
                        src={avatarUrl}
                        alt={user.user_metadata?.full_name || 'User'}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={() => setAvatarError(true)}
                        className="w-7 h-7 rounded-full border border-black/10 dark:border-white/15 object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs select-none">
                        {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:inline text-xs text-foreground font-medium whitespace-nowrap">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                  </button>

                  {/* Popover Dropdown Menu (Refined Apple Dimensions) */}
                  {isMobileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 sm:w-76 max-w-[calc(100vw-24px)] bg-card/95 dark:bg-zinc-900/95 backdrop-blur-3xl border border-black/10 dark:border-white/12 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      {/* User Info Header */}
                      <div className="p-2 border-b border-black/[0.06] dark:border-white/[0.08] mb-1.5 flex items-center space-x-2.5">
                        {avatarUrl && !avatarError ? (
                          <img
                            src={avatarUrl}
                            alt={user.user_metadata?.full_name || 'User'}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={() => setAvatarError(true)}
                            className="w-8 h-8 rounded-full border border-black/10 dark:border-white/15 object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs select-none">
                            {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-foreground truncate text-xs">
                            {user.user_metadata?.full_name || 'User'}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate" title={user.email || ''}>
                            {user.email}
                          </div>
                        </div>
                      </div>

                      {/* Section: Tema */}
                      <div className="px-1.5 py-1 space-y-1">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-1">
                          {t.theme}
                        </div>
                        <div className="grid grid-cols-3 p-0.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
                          <button
                            onClick={() => setTheme('system')}
                            className={`py-1.5 rounded-lg flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                              theme === 'system'
                                ? 'bg-foreground text-background font-semibold shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Monitor className="w-3.5 h-3.5" />
                            <span className="text-[10px]">{t.auto}</span>
                          </button>
                          <button
                            onClick={() => setTheme('light')}
                            className={`py-1.5 rounded-lg flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                              theme === 'light'
                                ? 'bg-foreground text-background font-semibold shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Sun className="w-3.5 h-3.5" />
                            <span className="text-[10px]">{t.light}</span>
                          </button>
                          <button
                            onClick={() => setTheme('dark')}
                            className={`py-1.5 rounded-lg flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-foreground text-background font-semibold shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Moon className="w-3.5 h-3.5" />
                            <span className="text-[10px]">{t.dark}</span>
                          </button>
                        </div>
                      </div>

                      {/* Section: Bahasa */}
                      <div className="px-1.5 py-1 space-y-1">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-1">
                          {t.language}
                        </div>
                        <div className="grid grid-cols-2 p-0.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
                          <button
                            onClick={() => setLanguage('id')}
                            className={`py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                              language === 'id'
                                ? 'bg-foreground text-background font-semibold shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Indonesia</span>
                          </button>
                          <button
                            onClick={() => setLanguage('en')}
                            className={`py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                              language === 'en'
                                ? 'bg-foreground text-background font-semibold shadow-xs'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span className="text-[10px]">English</span>
                          </button>
                        </div>
                      </div>

                      <div className="my-1 border-t border-black/[0.06] dark:border-white/[0.08]" />

                      {/* Section: Sinkronkan Judul */}
                      <button
                        onClick={async () => {
                          setIsMobileMenuOpen(false);
                          const res = await syncAllTitlesWithTMDB();
                          showToast(`${t.syncFinished} ${res.updated} ${t.titlesCount}`);
                        }}
                        disabled={isSyncing}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors text-left cursor-pointer text-xs font-medium disabled:opacity-60 group"
                      >
                        {isSyncing ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground group-hover:text-foreground shrink-0" />
                        ) : (
                          <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                        )}
                        <span className="truncate">
                          {isSyncing
                            ? `(${syncProgress?.current || 0}/${syncProgress?.total || items.length})...`
                            : t.syncTitles}
                        </span>
                      </button>

                      {/* Section: Import Data */}
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenMigration();
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors text-left cursor-pointer text-xs font-medium group"
                      >
                        <Database className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                        <span>{t.importCSV}</span>
                      </button>

                      {/* Section: Export Backup CSV */}
                      <button
                        onClick={handleExportCSV}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors text-left cursor-pointer text-xs font-medium group"
                      >
                        <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                        <span>{t.exportCSV}</span>
                      </button>

                      {/* Section: Bantuan */}
                      <Link
                        href="/help"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors text-left cursor-pointer text-xs font-medium group"
                      >
                        <HelpCircle className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                        <span>{t.help}</span>
                      </Link>

                      {/* Section: Logout */}
                      <div className="my-1 border-t border-black/[0.06] dark:border-white/[0.08]" />
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-left cursor-pointer text-xs font-medium"
                      >
                        <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                        <span>{t.signOut}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* When Not Logged In: Language Toggle, Theme Toggle & Direct 1-Click Sign In */
              <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                <button
                  onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
                  className="h-7 px-2 sm:h-8 sm:px-2.5 rounded-full flex items-center justify-center text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer border border-black/10 dark:border-white/10"
                  title={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
                >
                  {language.toUpperCase()}
                </button>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title={t.theme}
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
                <Link
                  href="/help"
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title={t.help}
                >
                  <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
                <button
                  onClick={onOpenAuth}
                  className="h-7 sm:h-8 px-3 sm:px-4 rounded-full text-xs font-semibold bg-foreground text-background hover:opacity-90 transition-opacity shadow-sm flex items-center space-x-1.5 cursor-pointer apple-btn-active shrink-0"
                  title={t.signIn}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t.signIn}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Segmented Category Bar */}
        <div className="flex md:hidden py-2 border-t border-black/[0.06] dark:border-white/[0.08]">
          <div className="grid grid-cols-4 w-full bg-black/[0.04] dark:bg-white/[0.08] p-1 rounded-full text-[10px] sm:text-xs font-medium border border-black/10 dark:border-white/10">
            <button
              onClick={() => setFilterType('all')}
              className={`py-1.5 rounded-full text-center flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-foreground text-background font-bold shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{t.all} ({totalCount})</span>
            </button>

            <button
              onClick={() => setFilterType('movie')}
              className={`py-1.5 rounded-full text-center flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                filterType === 'movie'
                  ? 'bg-foreground text-background font-bold shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{t.films} ({filmCount})</span>
            </button>

            <button
              onClick={() => setFilterType('tv')}
              className={`py-1.5 rounded-full text-center flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                filterType === 'tv'
                  ? 'bg-foreground text-background font-bold shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{t.series} ({tvCount})</span>
            </button>

            <button
              onClick={() => setFilterType('anime')}
              className={`py-1.5 rounded-full text-center flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                filterType === 'anime'
                  ? 'bg-foreground text-background font-bold shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{t.anime} ({animeCount})</span>
            </button>
          </div>
        </div>
      </div>
    </header>

      {/* Toast Notification (Mobile-Friendly Placement) */}
      {toastMessage && (
        <div className="fixed bottom-5 inset-x-4 sm:inset-x-auto sm:right-6 z-[100] max-w-sm mx-auto bg-black/90 dark:bg-zinc-900/95 text-white dark:text-white px-4 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center space-x-2.5 animate-in fade-in slide-in-from-bottom-5 duration-300 border border-white/15 backdrop-blur-xl">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Custom Logout Confirmation Modal (Portal to body for absolute mobile centering) */}
      {mounted && showLogoutConfirm && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-card border border-black/10 dark:border-white/12 rounded-3xl shadow-2xl w-full max-w-[340px] sm:max-w-sm p-5 sm:p-6 overflow-hidden space-y-3.5 text-center animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-1">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                {t.logoutConfirmTitle}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t.logoutConfirmDesc}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 px-3 text-xs sm:text-sm font-semibold text-foreground bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 rounded-full transition-all cursor-pointer apple-btn-active"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="py-2.5 px-3 text-xs sm:text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-full transition-all shadow-md active:scale-95 cursor-pointer apple-btn-active"
              >
                {t.signOut}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
