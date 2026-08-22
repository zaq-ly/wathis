'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWatchlist } from '@/context/WatchlistContext';
import { SearchResultItem } from '@/types/watchlist';
import { fetchTMDBSearch } from '@/lib/searchClient';
import { getTMDBImageUrl } from '@/lib/utils';
import { Search, Plus, Check, Loader2, X, Film, Tv, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { addItem, isItemInWatchlist } = useWatchlist();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [selectedSeasons, setSelectedSeasons] = useState<Record<number, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);

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
        const initialSeasons: Record<number, number> = {};
        data.forEach((item) => {
          if (item.media_type === 'tv') {
            initialSeasons[item.tmdb_id] = item.season_count || 1;
          }
        });
        setSelectedSeasons((prev) => ({ ...initialSeasons, ...prev }));
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
    const key = `${item.media_type}_${item.tmdb_id}`;
    const seasonCount = item.media_type === 'tv' ? (selectedSeasons[item.tmdb_id] || item.season_count || 1) : null;
    const seasonLabel = seasonCount ? (seasonCount > 1 ? `S1-S${seasonCount}` : `S${seasonCount}`) : null;

    const success = await addItem(item, seasonCount, seasonLabel);
    if (success) {
      setAddedIds((prev) => ({ ...prev, [key]: true }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-20 px-3 sm:px-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
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
            placeholder="Search TMDB titles (e.g. Inception, Shogun)..."
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
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">
                          No Art
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {item.title}
                        </span>
                        {item.release_year && (
                          <span className="text-xs text-muted-foreground font-medium shrink-0">
                            ({item.release_year})
                          </span>
                        )}
                      </div>

                      {item.original_title && item.original_title !== item.title && (
                        <div className="text-[11px] text-muted-foreground truncate">
                          {item.original_title}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="inline-flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-muted-foreground">
                          {item.media_type === 'movie' ? (
                            <>
                              <Film className="w-2.5 h-2.5" />
                              <span>Film</span>
                            </>
                          ) : (
                            <>
                              <Tv className="w-2.5 h-2.5 text-blue-500" />
                              <span>Series</span>
                            </>
                          )}
                        </span>

                        {item.vote_average ? (
                          <span className="text-[10px] text-amber-500 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08]">
                            ★ {item.vote_average}
                          </span>
                        ) : null}

                        {item.genres && item.genres.length > 0 && (
                          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                            {item.genres.slice(0, 3).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Season Picker & Add Button */}
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
                          {Array.from({ length: Math.max(item.season_count || 1, 1) }, (_, i) => i + 1).map((s) => (
                            <option key={s} value={s} className="bg-card text-foreground">
                              {s === 1 ? 'Season 1' : `Seasons 1-${s}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {alreadyAdded ? (
                      <span className="inline-flex items-center space-x-1 text-xs font-medium text-muted-foreground bg-black/[0.04] dark:bg-white/[0.08] px-3.5 py-1.5 rounded-full">
                        <Check className="w-3.5 h-3.5 text-blue-500" />
                        <span className="hidden sm:inline">Saved</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAdd(item)}
                        className="inline-flex items-center space-x-1 text-xs font-semibold bg-foreground hover:opacity-90 text-background px-4 py-1.5 rounded-full transition-all active:scale-95 shadow-sm cursor-pointer apple-btn-active"
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
            <div className="py-12 text-center text-muted-foreground text-xs font-medium">
              No cinema titles found for &ldquo;{query}&rdquo;
            </div>
          ) : !query.trim() ? (
            <div className="py-16 text-center text-muted-foreground text-xs flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.08] flex items-center justify-center text-muted-foreground mb-1">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-foreground font-semibold text-sm">Search the TMDB Cinema Archive</span>
              <span className="text-muted-foreground text-xs">Curate your finished films and multi-season TV series</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

