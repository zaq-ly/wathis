'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useWatchlist } from '@/context/WatchlistContext';
import { useLanguage } from '@/context/LanguageContext';
import { SearchResultItem } from '@/types/watchlist';
import { fetchTMDBSearch } from '@/lib/searchClient';
import { getTMDBImageUrl, isAnimeItem } from '@/lib/utils';
import { Search, Plus, Check, Loader2, X, Film, Tv, Sparkles, Clock, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onOpenAuth }) => {
  const { addItem, isItemInWatchlist, user } = useWatchlist();
  const { language, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [selectedSeasons, setSelectedSeasons] = useState<Record<number, number>>({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load history from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('wathis_search_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setSearchHistory(parsed);
        }
      } catch {}
    }
  }, [isOpen]);

  const saveToHistory = (term: string) => {
    const clean = term.trim();
    if (clean.length < 2) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('wathis_search_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeHistoryItem = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item !== term);
      try {
        localStorage.setItem('wathis_search_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory([]);
    try {
      localStorage.removeItem('wathis_search_history');
    } catch {}
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced TMDB API Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await fetchTMDBSearch(query);
        setResults(data);
        if (data.length > 0 && query.trim().length >= 2) {
          saveToHistory(query);
        }
        const initialSeasons: Record<number, number> = {};
        data.forEach((item) => {
          if (item.media_type === 'tv') {
            initialSeasons[item.tmdb_id] = item.season_count || 1;
          }
        });
        setSelectedSeasons((prev) => ({ ...initialSeasons, ...prev }));

        // Background auto-enrich real season count for TV series (batch of 5 max)
        const tvItems = data.filter((i) => i.media_type === 'tv');
        if (tvItems.length > 0) {
          Promise.all(
            tvItems.slice(0, 5).map(async (tv) => {
              try {
                const res = await fetch(`/api/tmdb/detail?id=${tv.tmdb_id}&type=tv`);
                if (res.ok) {
                  const detail = await res.json();
                  const realCount = detail?.item?.season_count;
                  // Only update if real count suggests more seasons than default
                  if (realCount && realCount > 1 && realCount > (tv.season_count || 1)) {
                    setResults((prev) =>
                      prev.map((p) =>
                        p.tmdb_id === tv.tmdb_id && p.media_type === 'tv'
                          ? { ...p, season_count: realCount }
                          : p
                      )
                    );
                    setSelectedSeasons((prev) => ({
                      ...prev,
                      [tv.tmdb_id]: prev[tv.tmdb_id] === 1 ? realCount : prev[tv.tmdb_id],
                    }));
                  }
                }
              } catch {}
            })
          );
        }
      } catch (err) {
        console.error('TMDB Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAdd = async (item: SearchResultItem) => {
    if (!user) {
      if (onOpenAuth) {
        onClose();
        onOpenAuth();
      }
      return;
    }
    const key = `${item.media_type}_${item.tmdb_id}`;
    const seasonCount = item.media_type === 'tv' ? (selectedSeasons[item.tmdb_id] || item.season_count || 1) : null;
    const seasonLabel = seasonCount ? (seasonCount > 1 ? `S1-S${seasonCount}` : `S${seasonCount}`) : null;

    const success = await addItem(item, seasonCount, seasonLabel);
    if (success) {
      setAddedIds((prev) => ({ ...prev, [key]: true }));
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-8 sm:pt-20 px-3 sm:px-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-2xl bg-card border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[82vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple Style Search Input Bar */}
        <div className="flex items-center px-4 sm:px-5 py-3.5 sm:py-4 border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03]">
          <Search className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim().length >= 2) {
                saveToHistory(query);
              }
            }}
            placeholder={t.searchTMDBPlaceholder}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none font-medium"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin mr-2 shrink-0" />}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.06] p-3 sm:p-4 space-y-2">
          {results.length > 0 ? (
            results.map((item, index) => {
              const alreadyAdded = isItemInWatchlist(item.tmdb_id, item.media_type) || addedIds[`${item.media_type}_${item.tmdb_id}`];
              const posterUrl = getTMDBImageUrl(item.poster_path, 'w300');
              const currentSeasonChoice = selectedSeasons[item.tmdb_id] || item.season_count || 1;

              return (
                <div
                  key={`${item.media_type}-${item.tmdb_id}-${index}`}
                  className="p-3 bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-2xl flex items-center justify-between space-x-3 hover:border-black/[0.12] dark:hover:border-white/[0.16] shadow-2xs transition-all duration-200"
                >
                  {/* Left info */}
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    {/* Thumbnail Poster */}
                    <div className="relative w-12 h-16 bg-muted rounded-xl overflow-hidden shrink-0 border border-black/5 dark:border-white/10 shadow-2xs">
                      {posterUrl ? (
                        <Image
                          src={posterUrl}
                          alt={item.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          {item.media_type === 'movie' ? <Film className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="font-semibold text-foreground text-sm truncate">
                          {item.title}
                        </span>
                        {item.release_year && (
                          <span className="text-xs text-muted-foreground shrink-0 font-normal">
                            ({item.release_year})
                          </span>
                        )}
                      </div>

                      {/* Meta badges: Type & Rating & Season */}
                      <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                        <span className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-md ${
                          isAnimeItem(item)
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : item.media_type === 'movie'
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {isAnimeItem(item) ? t.anime : item.media_type === 'movie' ? t.films : t.series}
                        </span>
                        {item.vote_average ? (
                          <span className="text-[11px] font-semibold text-amber-500 flex items-center space-x-0.5">
                            <span>★</span>
                            <span>{item.vote_average.toFixed(1)}</span>
                          </span>
                        ) : null}
                        {item.genres && item.genres.length > 0 && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[160px] hidden sm:inline">
                            {item.genres.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right actions: Season selector (if TV) & Add Button */}
                  <div className="shrink-0 flex items-center space-x-2">
                    {item.media_type === 'tv' && !alreadyAdded && (
                      <div className="flex items-center space-x-1">
                        <select
                          value={currentSeasonChoice}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSelectedSeasons((prev) => ({ ...prev, [item.tmdb_id]: val }));
                          }}
                          className="bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.08] text-foreground text-xs font-medium rounded-full px-3 py-1.5 focus:outline-none cursor-pointer"
                          title="Select watched seasons"
                        >
                          {Array.from({ length: Math.min(item.season_count || 1, 20) }, (_, i) => i + 1).map((s) => (
                            <option key={s} value={s} className="bg-card text-foreground">
                              {s === 1 ? `${t.seasons} 1` : `${t.seasons} 1-${s}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {alreadyAdded ? (
                      <span className="inline-flex items-center space-x-1 text-xs font-medium text-muted-foreground bg-black/[0.04] dark:bg-white/[0.08] px-3.5 py-1.5 rounded-full">
                        <Check className="w-3.5 h-3.5 text-blue-500" />
                        <span className="hidden sm:inline">{t.added}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAdd(item)}
                        className="inline-flex items-center space-x-1 text-xs font-semibold bg-foreground hover:opacity-90 text-background px-4 py-1.5 rounded-full transition-all active:scale-95 shadow-sm cursor-pointer apple-btn-active"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.add}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : query.trim() && !isLoading ? (
            <div className="py-12 text-center text-muted-foreground text-xs font-medium">
              {t.noTitlesFound} &ldquo;{query}&rdquo;
            </div>
          ) : !query.trim() && searchHistory.length > 0 ? (
            <div className="py-2 px-1 space-y-3">
              <div className="flex items-center justify-between px-2 text-xs font-semibold text-muted-foreground select-none">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{t.recentSearches}</span>
                </div>
                <button
                  onClick={clearAllHistory}
                  className="text-[11px] text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                >
                  {t.clearHistory}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 px-1">
                {searchHistory.map((item) => (
                  <div
                    key={item}
                    onClick={() => {
                      setQuery(item);
                      saveToHistory(item);
                    }}
                    className="group inline-flex items-center space-x-2 pl-3.5 pr-2 py-1.5 bg-black/[0.04] dark:bg-white/[0.07] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] border border-black/[0.06] dark:border-white/[0.08] rounded-full text-xs text-foreground cursor-pointer transition-all duration-150 active:scale-95 shadow-2xs"
                  >
                    <span className="font-medium">{item}</span>
                    <button
                      type="button"
                      onClick={(e) => removeHistoryItem(item, e)}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-black/10 dark:hover:bg-white/20 transition-colors cursor-pointer"
                      title="Hapus"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : !query.trim() ? (
            <div className="py-16 text-center text-muted-foreground text-xs flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.08] flex items-center justify-center text-muted-foreground mb-1">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-foreground font-semibold text-sm">{t.searchTMDBPlaceholder}</span>
              <span className="text-muted-foreground text-xs">{t.footerDesc}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
};
