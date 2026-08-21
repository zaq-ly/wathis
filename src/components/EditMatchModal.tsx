'use client';

import React, { useState, useEffect } from 'react';
import { useWatchlist } from '@/context/WatchlistContext';
import { WathisItem, SearchResultItem } from '@/types/watchlist';
import { getTMDBImageUrl } from '@/lib/utils';
import { fetchTMDBSearch } from '@/lib/searchClient';
import { X, Search, Check, RefreshCw, Loader2, ArrowLeftRight, Film, Tv } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-xl bg-[#0f1013] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-white/[0.08] bg-zinc-950">
          <div className="flex items-center space-x-2">
            <ArrowLeftRight className="w-4 h-4 text-zinc-400" />
            <span className="font-bold text-xs text-white font-mono-code uppercase tracking-wider">
              Adjust / Re-match Film or Series
            </span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 font-mono-code">
          {/* Current Selection Indicator */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-white/[0.08] space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Currently In List:</div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase truncate pr-2">
                {item.title} {item.release_year ? `(${item.release_year})` : ''}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 shrink-0">
                {item.media_type === 'movie' ? 'Film' : 'Series'}
              </span>
            </div>
          </div>

          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 uppercase tracking-wider">
              Search Correct Title on TMDB:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  searchTMDB(e.target.value);
                }}
                placeholder="Type movie or series title..."
                autoFocus
                className="w-full bg-zinc-950 border border-white/[0.1] rounded-lg pl-9 pr-8 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/[0.3] transition-colors"
              />
              {isLoading && (
                <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin absolute right-3 top-3.5" />
              )}
            </div>
          </div>

          {/* TMDB Results */}
          <div className="space-y-2">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Select the Correct Version:
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {results.map((result) => {
                const isExactCurrent =
                  result.tmdb_id === item.tmdb_id && result.media_type === item.media_type;
                const posterUrl = getTMDBImageUrl(result.poster_path, 'w300');

                return (
                  <div
                    key={`${result.media_type}-${result.tmdb_id}`}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                      isExactCurrent
                        ? 'bg-white/[0.04] border-white/[0.25]'
                        : 'bg-zinc-950 border-white/[0.08] hover:border-white/[0.2]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div className="relative w-10 h-14 bg-zinc-900 rounded overflow-hidden shrink-0 border border-white/[0.08]">
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
                        <div className="font-semibold text-xs text-white truncate uppercase">
                          {result.title} {result.release_year ? `(${result.release_year})` : ''}
                        </div>
                        {result.original_title && result.original_title !== result.title && (
                          <div className="text-[10px] text-zinc-500 truncate">
                            {result.original_title}
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-[10px] text-zinc-500 mt-0.5">
                          <span>{result.media_type === 'movie' ? 'Film' : 'Series'}</span>
                          {result.vote_average ? (
                            <span className="text-amber-400 font-mono-code font-medium">
                              ★ {result.vote_average}
                            </span>
                          ) : null}
                          <span>• {result.genres.slice(0, 2).join(', ') || 'General'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectReplacement(result)}
                      disabled={isUpdating || isExactCurrent}
                      className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded transition-all active:scale-95 flex items-center space-x-1 ${
                        isExactCurrent
                          ? 'bg-zinc-800 text-zinc-500 cursor-default'
                          : 'bg-white hover:bg-zinc-200 text-zinc-950 shadow-sm'
                      }`}
                    >
                      {isExactCurrent ? (
                        <span>Current</span>
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Replace</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}

              {results.length === 0 && !isLoading && (
                <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-950 rounded-lg border border-white/[0.08]">
                  No matching titles found on TMDB.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
