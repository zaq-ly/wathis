'use client';

import React, { useState, useRef } from 'react';
import { useWatchlist } from '@/context/WatchlistContext';
import { SearchResultItem } from '@/types/watchlist';
import { getTMDBImageUrl } from '@/lib/utils';
import { parseUniversalImport, ParsedImportItem } from '@/lib/importParser';
import { fetchTMDBSearch } from '@/lib/searchClient';
import { X, Check, Database, ArrowRight, Loader2, RefreshCw, Upload, FileText } from 'lucide-react';
import Image from 'next/image';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [inputText, setInputText] = useState('');
  const [itemsToProcess, setItemsToProcess] = useState<ParsedImportItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [migratedCount, setMigratedCount] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addItem, isItemInWatchlist } = useWatchlist();

  const handleCancelMigration = () => {
    setItemsToProcess([]);
    setCurrentIndex(0);
    setSearchResults([]);
    setMigratedCount(0);
    setInputText('');
    setUploadedFileName(null);
  };

  const handleClose = () => {
    handleCancelMigration();
    onClose();
  };

  if (!isOpen) return null;

  // 1. Load from File Upload (CSV only)
  const handleFileUpload = (file: File) => {
    if (!file) return;

    // Safety 1: Max file size limit 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('File terlalu besar! Maksimal ukuran file 5 MB.');
      return;
    }

    // Safety 2: Strict extension validation (CSV only)
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Format file tidak didukung! Hanya menerima file spreadsheet/data (.csv).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const parsed = parseUniversalImport(content, file.name);
        if (parsed.length > 0) {
          startProcessing(parsed, file.name);
        } else {
          alert('Tidak ditemukan data judul yang valid dalam file CSV ini.');
        }
      }
    };
    reader.readAsText(file);
  };

  // 3. Load from Pasted Text
  const handleStartTextParsing = () => {
    if (!inputText.trim()) return;
    const parsed = parseUniversalImport(inputText, 'custom.csv');
    if (parsed.length > 0) {
      startProcessing(parsed, 'Custom Text List');
    }
  };

  const startProcessing = (items: ParsedImportItem[], sourceName: string) => {
    setItemsToProcess(items);
    setCurrentIndex(0);
    setMigratedCount(0);
    setUploadedFileName(sourceName);
    if (items.length > 0) {
      searchCurrent(items[0].clean);
    }
  };

  const searchCurrent = async (query: string) => {
    setIsSearching(true);
    try {
      const items = await fetchTMDBSearch(query);
      setSearchResults(items);
    } catch (err) {
      console.warn('Migration search notice:', err);
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
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-2xl bg-[#0f1013] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-white/[0.08] bg-zinc-950">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-zinc-400" />
            <span className="font-bold text-xs text-white font-mono-code uppercase tracking-wider">
              CSV Import & Migration Assistant
            </span>
          </div>
          <button onClick={handleClose} className="text-zinc-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 font-mono-code">
          {itemsToProcess.length === 0 ? (
            <div className="space-y-4">
              {/* Import Method Tabs */}
              <div className="grid grid-cols-2 bg-white/[0.03] p-1 rounded-lg border border-white/[0.06] text-xs">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`py-1.5 rounded-md flex items-center justify-center space-x-1.5 transition-all ${
                    activeTab === 'upload' ? 'bg-white text-zinc-950 font-bold shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload CSV</span>
                </button>
                <button
                  onClick={() => setActiveTab('paste')}
                  className={`py-1.5 rounded-md flex items-center justify-center space-x-1.5 transition-all ${
                    activeTab === 'paste' ? 'bg-white text-zinc-950 font-bold shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paste Text</span>
                </button>
              </div>

              {/* Tab 1: Universal CSV File Upload */}
              {activeTab === 'upload' && (
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files?.[0]) {
                        handleFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 ${
                      isDragging
                        ? 'border-white bg-white/[0.08]'
                        : 'border-white/[0.12] hover:border-white/[0.3] bg-white/[0.02]'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                      }}
                    />
                    <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-zinc-300">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white">Click or drag & drop CSV file to import</span>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Compatible with CSV exports from Excel, Letterboxd, IMDb, Notion, or custom lists
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/[0.06]">
                      .CSV Format Only
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 2: Custom Text Paste */}
              {activeTab === 'paste' && (
                <div className="space-y-3">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste film/series titles here (one per line, CSV row, or checklist)...&#10;e.g.&#10;Inception (2010)&#10;Succession - Season 1&#10;Interstellar, Sci-Fi"
                    rows={6}
                    className="w-full bg-zinc-950 border border-white/[0.08] rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 placeholder-zinc-700"
                  />
                  <button
                    onClick={handleStartTextParsing}
                    disabled={!inputText.trim()}
                    className="w-full bg-white hover:bg-zinc-200 text-zinc-950 font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-40 flex items-center justify-center space-x-2"
                  >
                    <span>Parse List ({inputText.split('\n').filter((l) => l.trim()).length} Lines)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : currentIndex < itemsToProcess.length ? (
            <div className="space-y-4">
              {/* Progress Tracker */}
              <div className="flex items-center justify-between text-xs bg-zinc-950 p-3 rounded-lg border border-white/[0.08]">
                <div className="flex items-center space-x-2">
                  <span className="text-zinc-400">
                    Item <strong className="text-white">{currentIndex + 1}</strong> of {itemsToProcess.length}
                  </span>
                  {uploadedFileName && (
                    <span className="text-[10px] text-zinc-600 truncate max-w-[150px]">
                      ({uploadedFileName})
                    </span>
                  )}
                </div>
                <span className="text-zinc-300 font-bold">
                  Imported: <span className="text-white">{migratedCount}</span>
                </span>
              </div>

              {/* Current Title Info */}
              <div className="p-3.5 bg-zinc-900/60 rounded-lg border border-white/[0.08] space-y-1.5">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Source Entry:</div>
                <div className="text-sm font-bold text-white uppercase">&ldquo;{currentItem.raw}&rdquo;</div>
                <div className="flex items-center space-x-2 text-[11px] text-zinc-400 pt-1">
                  {currentItem.genre && (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                      Genre: {currentItem.genre}
                    </span>
                  )}
                  {currentItem.year && (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                      Year: {currentItem.year}
                    </span>
                  )}
                  {currentItem.season && (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 text-[10px]">
                      Season: {currentItem.season}
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
                        className="flex items-center justify-between p-2.5 bg-zinc-950 border border-white/[0.08] rounded-lg hover:border-white/[0.2] transition-colors"
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
                          className="shrink-0 text-xs bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-3 py-1.5 rounded transition-all active:scale-95 flex items-center space-x-1 shadow-sm"
                        >
                          <Check className="w-3 h-3" />
                          <span>{alreadyInList ? 'Added' : 'Confirm'}</span>
                        </button>
                      </div>
                    );
                  })}

                  {searchResults.length === 0 && !isSearching && (
                    <div className="p-4 text-center text-xs text-zinc-500 bg-zinc-950 rounded-lg border border-white/[0.08]">
                      No TMDB matches found for &ldquo;{currentItem.clean}&rdquo;. You can skip to next title.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => searchCurrent(currentItem.clean)}
                    className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-white px-2 py-1.5 rounded transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                  <button
                    onClick={handleCancelMigration}
                    className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2.5 py-1.5 rounded border border-red-500/20 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancel All</span>
                  </button>
                </div>
                <button
                  onClick={goToNext}
                  className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-3.5 py-1.5 rounded-lg border border-white/[0.08] transition-colors"
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
              <h3 className="text-sm font-bold text-white uppercase">Import Completed</h3>
              <p className="text-xs text-zinc-400">
                Processed {itemsToProcess.length} items. Added {migratedCount} titles to your wathis.
              </p>
              <button
                onClick={() => {
                  setItemsToProcess([]);
                  onClose();
                }}
                className="mt-4 bg-white text-zinc-950 font-bold px-6 py-2 rounded-lg text-xs hover:bg-zinc-200 transition-colors"
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

