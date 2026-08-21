'use client';

import React, { useState } from 'react';
import { useWatchlist } from '@/context/WatchlistContext';
import { SearchResultItem } from '@/types/watchlist';
import { cleanMigrationTitle, getTMDBImageUrl } from '@/lib/utils';
import { X, Check, Search, Database, ArrowRight, Loader2, RefreshCw, Film, Tv, Layers } from 'lucide-react';
import Image from 'next/image';
import notionData from '@/data/notion_migration.json';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ItemToProcess {
  raw: string;
  clean: string;
  season?: string;
  notionGenre?: string;
  type?: 'movie' | 'tv';
}

export const MigrationModal: React.FC<MigrationModalProps> = ({ isOpen, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [itemsToProcess, setItemsToProcess] = useState<ItemToProcess[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [migratedCount, setMigratedCount] = useState(0);

  const { addItem, isItemInWatchlist } = useWatchlist();

  if (!isOpen) return null;

  const loadPreset = (category: 'movies' | 'series' | 'all') => {
    const list = notionData[category] as { rawTitle: string; notionGenre: string; type: 'movie' | 'tv' }[];
    const parsed: ItemToProcess[] = list.map((item) => {
      const { cleanTitle, detectedSeason } = cleanMigrationTitle(item.rawTitle);
      return {
        raw: item.rawTitle,
        clean: cleanTitle,
        season: detectedSeason,
        notionGenre: item.notionGenre,
        type: item.type,
      };
    });

    setItemsToProcess(parsed);
    setCurrentIndex(0);
    setMigratedCount(0);
    if (parsed.length > 0) {
      searchCurrent(parsed[0].clean);
    }
  };

  const handleStartParsing = () => {
    if (!inputText.trim()) return;
    const lines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsed: ItemToProcess[] = lines.map((line) => {
      const { cleanTitle, detectedSeason } = cleanMigrationTitle(line);
      return { raw: line, clean: cleanTitle, season: detectedSeason };
    });

    setItemsToProcess(parsed);
    setCurrentIndex(0);
    setMigratedCount(0);
    if (parsed.length > 0) {
      searchCurrent(parsed[0].clean);
    }
  };

  const searchCurrent = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Migration search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmMatch = async (match: SearchResultItem) => {
    await addItem(match);
    setMigratedCount((prev) => prev + 1);
    goToNext();
  };

  const goToNext = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < itemsToProcess.length) {
      setCurrentIndex(nextIdx);
      searchCurrent(itemsToProcess[nextIdx].clean);
    } else {
      setCurrentIndex(itemsToProcess.length);
    }
  };

  const currentItem = itemsToProcess[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#0f1013] border border-white/[0.1] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-zinc-950">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-zinc-400" />
            <span className="font-bold text-xs text-white font-mono-code uppercase tracking-wider">
              Notion Data Migration Assistant
            </span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 font-mono-code">
          {itemsToProcess.length === 0 ? (
            <div className="space-y-4">
              {/* Preset Buttons for Notion Data */}
              <div className="space-y-2">
                <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  Quick Load from Extracted Notion Archives:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => loadPreset('movies')}
                    className="flex items-center justify-center space-x-2 p-3 rounded bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] text-xs text-zinc-200 hover:text-white transition-all text-center"
                  >
                    <Film className="w-4 h-4 text-zinc-400" />
                    <span>Movie.zip ({notionData.movies.length})</span>
                  </button>

                  <button
                    onClick={() => loadPreset('series')}
                    className="flex items-center justify-center space-x-2 p-3 rounded bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] text-xs text-zinc-200 hover:text-white transition-all text-center"
                  >
                    <Tv className="w-4 h-4 text-zinc-400" />
                    <span>Series.zip ({notionData.series.length})</span>
                  </button>

                  <button
                    onClick={() => loadPreset('all')}
                    className="flex items-center justify-center space-x-2 p-3 rounded bg-white hover:bg-zinc-200 text-xs text-zinc-950 font-bold transition-all text-center"
                  >
                    <Layers className="w-4 h-4" />
                    <span>All Titles ({notionData.all.length})</span>
                  </button>
                </div>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/[0.06]"></div>
                <span className="flex-shrink mx-4 text-zinc-600 text-[10px] uppercase tracking-wider">or paste custom text</span>
                <div className="flex-grow border-t border-white/[0.06]"></div>
              </div>

              <div className="space-y-2">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste custom titles (one per line)..."
                  rows={4}
                  className="w-full bg-zinc-950 border border-white/[0.08] rounded p-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 placeholder-zinc-700"
                />
                <button
                  onClick={handleStartParsing}
                  disabled={!inputText.trim()}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-2 rounded text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center space-x-2 border border-white/[0.08]"
                >
                  <span>Parse Custom List ({inputText.split('\n').filter((l) => l.trim()).length} Titles)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : currentIndex < itemsToProcess.length ? (
            <div className="space-y-4">
              {/* Progress Tracker */}
              <div className="flex items-center justify-between text-xs bg-zinc-950 p-3 rounded border border-white/[0.08]">
                <span className="text-zinc-400">
                  Item <strong className="text-white">{currentIndex + 1}</strong> of {itemsToProcess.length}
                </span>
                <span className="text-zinc-300 font-bold">
                  Migrated: <span className="text-white">{migratedCount}</span>
                </span>
              </div>

              {/* Current Title Info */}
              <div className="p-3.5 bg-zinc-900/60 rounded border border-white/[0.08] space-y-1.5">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Original Notion Entry:</div>
                <div className="text-sm font-bold text-white uppercase">&ldquo;{currentItem.raw}&rdquo;</div>
                <div className="flex items-center space-x-2 text-[11px] text-zinc-400 pt-1">
                  {currentItem.notionGenre && (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                      Notion Genre: {currentItem.notionGenre}
                    </span>
                  )}
                  {currentItem.season && (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 text-[10px]">
                      Stripped: {currentItem.season}
                    </span>
                  )}
                </div>
              </div>

              {/* TMDB Matches */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-zinc-400 uppercase tracking-wider">
                    Confirm TMDB Match for &ldquo;{currentItem.clean}&rdquo;:
                  </span>
                  {isSearching && <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />}
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((result) => {
                    const alreadyInList = isItemInWatchlist(result.tmdb_id, result.media_type);
                    const posterUrl = getTMDBImageUrl(result.poster_path, 'w300');

                    return (
                      <div
                        key={`${result.media_type}-${result.tmdb_id}`}
                        className="flex items-center justify-between p-2.5 bg-zinc-950 border border-white/[0.08] rounded hover:border-white/[0.2] transition-colors"
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
                            <div className="text-[10px] text-zinc-500 mt-0.5">
                              {result.media_type === 'movie' ? 'Film' : 'Series'} • {result.genres.slice(0, 3).join(', ')}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleConfirmMatch(result)}
                          className="shrink-0 text-xs bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-3 py-1.5 rounded transition-all active:scale-95 flex items-center space-x-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>{alreadyInList ? 'Added' : 'Confirm'}</span>
                        </button>
                      </div>
                    );
                  })}

                  {searchResults.length === 0 && !isSearching && (
                    <div className="p-4 text-center text-xs text-zinc-500 bg-zinc-950 rounded border border-white/[0.08]">
                      No TMDB matches found. You can skip this title.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                <button
                  onClick={() => searchCurrent(currentItem.clean)}
                  className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-white"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
                <button
                  onClick={goToNext}
                  className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-3.5 py-1.5 rounded border border-white/[0.08] transition-colors"
                >
                  Skip & Next &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/[0.1] flex items-center justify-center mx-auto text-white">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase">Migration Completed</h3>
              <p className="text-xs text-zinc-400">
                Processed {itemsToProcess.length} items. Added {migratedCount} titles to your Watchlist.
              </p>
              <button
                onClick={() => {
                  setItemsToProcess([]);
                  onClose();
                }}
                className="mt-4 bg-white text-zinc-950 font-bold px-6 py-2 rounded text-xs"
              >
                Close Assistant
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
