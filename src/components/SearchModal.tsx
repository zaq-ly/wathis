'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWatchlist } from '@/context/WatchlistContext';
import { SearchResultItem } from '@/types/watchlist';
import { getTMDBImageUrl } from '@/lib/utils';
import { fetchTMDBSearch } from '@/lib/searchClient';
import { Search, X, Check, Plus, Loader2, Film, Tv, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const { addItem, isItemInWatchlist } = useWatchlist();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const items = await fetchTMDBSearch(query);
        setResults(items);
      } catch (err) {
        console.warn('Search notice:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAdd = async (item: SearchResultItem) => {
    const key = `${item.media_type}_${item.tmdb_id}`;
    const success = await addItem(item);
    if (success) {
      setAddedIds((prev) => ({ ...prev, [key]: true }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-20 px-2.5 sm:px-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#0e0f13] border border-white/[0.1] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-3 sm:px-4 py-3 sm:py-3.5 border-b border-white/[0.08] bg-zinc-950/80">
          <Search className="w-4 h-4 text-zinc-400 mr-2.5 sm:mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search TMDB titles (e.g. Inception)..."
            className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-xs sm:text-sm outline-none font-mono-code"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin mr-2 shrink-0" />}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-zinc-400 hover:text-zinc-200 p-1 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[11px] font-mono-code bg-zinc-900 hover:bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-white/[0.08] shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 p-2">
          {results.length > 0 ? (
            results.map((item, index) => {
              const alreadyAdded = isItemInWatchlist(item.tmdb_id, item.media_type) || addedIds[`${item.media_type}_${item.tmdb_id}`];
              const posterUrl = getTMDBImageUrl(item.poster_path, 'w300');

              return (
                <div
                  key={`${item.media_type}-${item.tmdb_id}-${index}`}
                  className="p-2 sm:p-3 bg-[#0c0d10] border border-white/[0.06] rounded-lg flex items-center justify-between space-x-2.5 sm:space-x-3 hover:border-white/[0.2] transition-colors"
                >
                  {/* Left info */}
                  <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 pr-2 sm:pr-3">
                    {/* Thumbnail Poster */}
                    <div className="relative w-10 h-14 sm:w-12 sm:h-16 bg-zinc-800 rounded overflow-hidden shrink-0 border border-zinc-700/50">
                      {posterUrl ? (
                        <Image
                          src={posterUrl}
                          alt={item.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-500 font-mono">
                          NO IMG
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm text-zinc-100 truncate">
                          {item.title}
                        </span>
                        {item.release_year && (
                          <span className="text-xs text-zinc-400 font-mono shrink-0">
                            ({item.release_year})
                          </span>
                        )}
                      </div>

                      {item.original_title && item.original_title !== item.title && (
                        <div className="text-[11px] text-zinc-500 font-mono-code truncate">
                          {item.original_title}
                        </div>
                      )}

                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`inline-flex items-center space-x-1 text-[10px] font-mono-code uppercase px-1.5 py-0.5 rounded border ${
                            item.media_type === 'movie'
                              ? 'bg-zinc-800 text-zinc-300 border-white/[0.1]'
                              : 'bg-zinc-800 text-zinc-300 border-white/[0.1]'
                          }`}
                        >
                          {item.media_type === 'movie' ? (
                            <>
                              <Film className="w-2.5 h-2.5" />
                              <span>Film</span>
                            </>
                          ) : (
                            <>
                              <Tv className="w-2.5 h-2.5" />
                              <span>Series {item.season_count ? `• ${item.season_count}S` : ''}</span>
                            </>
                          )}
                        </span>

                        {item.vote_average ? (
                          <span className="text-[10px] text-amber-400 font-mono-code font-medium bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                            ★ {item.vote_average}
                          </span>
                        ) : null}

                        {item.genres && item.genres.length > 0 && (
                          <span className="text-xs text-zinc-500 font-mono-code truncate hidden sm:inline">
                            {item.genres.slice(0, 3).join(', ')}
                          </span>
                        )}
                      </div>

                      {item.overview && (
                        <p className="text-[11px] text-zinc-500 font-mono-code line-clamp-1 mt-1 hidden sm:block">
                          {item.overview}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Add Button Action */}
                  <div className="shrink-0">
                    {alreadyAdded ? (
                      <span className="inline-flex items-center space-x-1 text-xs font-mono-code text-white bg-zinc-800 border border-white/[0.1] px-3 py-1.5 rounded">
                        <Check className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Saved</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAdd(item)}
                        className="inline-flex items-center space-x-1 text-xs font-mono-code bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-3 py-1.5 rounded transition-all active:scale-95 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : query.trim() && !isLoading ? (
            <div className="py-12 text-center text-zinc-500 font-mono-code text-xs">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : !query.trim() ? (
            <div className="py-12 text-center text-zinc-500 font-mono-code text-xs flex flex-col items-center">
              <Sparkles className="w-5 h-5 text-zinc-600 mb-2" />
              <span>Search TMDB database for any completed movie or TV series</span>
              <span className="text-zinc-600 text-[10px] mt-1">Enriched with official genres, release year & posters</span>
            </div>
          ) : null}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-zinc-950 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono-code text-zinc-500">
          <span>Powered by TMDB API</span>
          <span>Only completed titles</span>
        </div>
      </div>
    </div>
  );
};
