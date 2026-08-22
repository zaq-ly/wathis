'use client';

import React, { useState, useEffect } from 'react';
import { useWatchlist } from '@/context/WatchlistContext';
import { WathisItem, SearchResultItem } from '@/types/watchlist';
import { getTMDBImageUrl } from '@/lib/utils';
import { fetchTMDBSearch } from '@/lib/searchClient';
import { X, Search, Check, Loader2, ArrowLeftRight, Film, Tv } from 'lucide-react';
import Image from 'next/image';

interface EditMatchModalProps {
  item: WathisItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditMatchModal: React.FC<EditMatchModalProps> = ({ item, isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { replaceItem } = useWatchlist();

  // Reset and prefill query when item opens
  useEffect(() => {
    if (item && isOpen) {
      setQuery(item.title);
      searchTMDB(item.title);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [item, isOpen]);

  const searchTMDB = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const items = await fetchTMDBSearch(searchTerm);
      setResults(items);
    } catch (err) {
      console.warn('Edit match search notice:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectReplacement = async (match: SearchResultItem) => {
    if (!item) return;
    setIsUpdating(true);
    try {
      await replaceItem(item, match);
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-xl bg-card border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03]">
          <div className="flex items-center space-x-2">
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm text-foreground tracking-tight">
              Re-match Title with TMDB
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Current Selection Indicator */}
          <div className="p-3.5 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] space-y-1">
            <div className="text-[11px] text-muted-foreground font-medium">Currently In Archive:</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground truncate pr-2">
                {item.title} {item.release_year ? `(${item.release_year})` : ''}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.1] text-muted-foreground shrink-0 font-medium">
                {item.media_type === 'movie' ? 'Film' : 'Series'}
              </span>
            </div>
          </div>

          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">
              Search Correct Title:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  searchTMDB(e.target.value);
                }}
                placeholder="Type movie or series title..."
                autoFocus
                className="w-full bg-black/[0.03] dark:bg-white/[0.07] border border-black/[0.06] dark:border-white/[0.08] rounded-full pl-9 pr-8 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
              {isLoading && (
                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-3.5 top-3" />
              )}
            </div>
          </div>

          {/* TMDB Results */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-foreground/80">
              Select Correct Version:
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {results.map((result) => {
                const isIdentical =
                  result.tmdb_id === item.tmdb_id &&
                  result.media_type === item.media_type &&
                  result.title.trim().toLowerCase() === item.title.trim().toLowerCase();
                const isSameTMDBDifferentTitle =
                  result.tmdb_id === item.tmdb_id &&
                  result.media_type === item.media_type &&
                  !isIdentical;
                const posterUrl = getTMDBImageUrl(result.poster_path, 'w300');

                return (
                  <div
                    key={`${result.media_type}-${result.tmdb_id}`}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isIdentical
                        ? 'bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.08] dark:border-white/[0.1]'
                        : isSameTMDBDifferentTitle
                        ? 'bg-blue-500/[0.06] dark:bg-blue-500/[0.1] border-blue-500/30'
                        : 'bg-card border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.15] dark:hover:border-white/[0.2]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div className="relative w-10 h-14 bg-muted rounded-lg overflow-hidden shrink-0 border border-black/5 dark:border-white/10 shadow-2xs">
                        {posterUrl ? (
                          <Image
                            src={posterUrl}
                            alt={result.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-foreground truncate flex items-center space-x-1.5">
                          <span>{result.title}</span>
                          {isSameTMDBDifferentTitle && (
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-medium shrink-0">
                              Judul Baru TMDB
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-0.5">
                          <span>{result.release_year || '—'}</span>
                          <span>•</span>
                          <span>
                            {result.media_type === 'movie' ? 'Film' : 'Series'}
                          </span>
                          {result.vote_average && (
                            <>
                              <span>•</span>
                              <span className="text-amber-500 dark:text-amber-400 font-semibold">
                                ★ {result.vote_average}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectReplacement(result)}
                      disabled={isUpdating || isIdentical}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer apple-btn-active ${
                        isIdentical
                          ? 'bg-black/[0.04] dark:bg-white/[0.08] text-muted-foreground cursor-default opacity-80'
                          : isSameTMDBDifferentTitle
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                          : 'bg-foreground text-background hover:opacity-90 shadow-sm'
                      }`}
                    >
                      {isUpdating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isIdentical ? (
                        <span className="flex items-center space-x-1">
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Saat Ini</span>
                        </span>
                      ) : isSameTMDBDifferentTitle ? (
                        'Gunakan Judul Ini'
                      ) : (
                        'Pilih Versi Ini'
                      )}
                    </button>
                  </div>
                );
              })}

              {!isLoading && results.length === 0 && query && (
                <div className="text-center py-8 text-xs text-muted-foreground font-medium">
                  No matching cinema titles found for &ldquo;{query}&rdquo;
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-black/[0.02] dark:bg-white/[0.03] border-t border-black/[0.06] dark:border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

