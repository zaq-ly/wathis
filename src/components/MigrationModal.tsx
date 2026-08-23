'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWatchlist } from '@/context/WatchlistContext';
import { SearchResultItem } from '@/types/watchlist';
import { getTMDBImageUrl, isAnimeItem } from '@/lib/utils';
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
  const [currentQuery, setCurrentQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [migratedCount, setMigratedCount] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedSeasons, setSelectedSeasons] = useState<Record<number, number>>({});
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [isAdding, setIsAdding] = useState(false);

  const { addItem, isItemInWatchlist, items: watchlistItems } = useWatchlist();
  const [skippedCount, setSkippedCount] = useState(0);
  const [allAlreadyUploaded, setAllAlreadyUploaded] = useState(false);
  const [totalParsedCount, setTotalParsedCount] = useState(0);

  const normalizeTitle = (str: string): string => {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  };

  const saveSession = (
    items: ParsedImportItem[],
    idx: number,
    migrated: number,
    skipped: number,
    total: number,
    fileName: string | null
  ) => {
    try {
      if (items.length > 0 && idx < items.length) {
        localStorage.setItem(
          'wathis_migration_session',
          JSON.stringify({
            itemsToProcess: items,
            currentIndex: idx,
            migratedCount: migrated,
            skippedCount: skipped,
            totalParsedCount: total,
            uploadedFileName: fileName,
          })
        );
      } else {
        localStorage.removeItem('wathis_migration_session');
      }
    } catch {
      // ignore storage errors
    }
  };

  // Restore active session on modal open if available
  React.useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem('wathis_migration_session');
      if (saved) {
        const data = JSON.parse(saved);
        if (
          data &&
          Array.isArray(data.itemsToProcess) &&
          data.itemsToProcess.length > 0 &&
          typeof data.currentIndex === 'number' &&
          data.currentIndex < data.itemsToProcess.length
        ) {
          setItemsToProcess(data.itemsToProcess);
          setCurrentIndex(data.currentIndex);
          setMigratedCount(data.migratedCount || 0);
          setSkippedCount(data.skippedCount || 0);
          setTotalParsedCount(data.totalParsedCount || data.itemsToProcess.length);
          setUploadedFileName(data.uploadedFileName || 'Import Session');
          const q = data.itemsToProcess[data.currentIndex]?.clean || '';
          setCurrentQuery(q);
          searchCurrent(q);
        }
      }
    } catch (e) {
      console.warn('Could not restore migration session:', e);
    }
  }, [isOpen]);

  const handleCancelMigration = () => {
    try {
      localStorage.removeItem('wathis_migration_session');
    } catch {
      // ignore
    }
    setItemsToProcess([]);
    setCurrentIndex(0);
    setCurrentQuery('');
    setSearchResults([]);
    setMigratedCount(0);
    setSkippedCount(0);
    setAllAlreadyUploaded(false);
    setTotalParsedCount(0);
    setInputText('');
    setUploadedFileName(null);
    setIsAdding(false);
  };

  const handleClose = () => {
    handleCancelMigration();
    onClose();
  };

  if (!isOpen) return null;

  // 1. Load from File Upload (CSV only)
  const handleFileUpload = (file: File) => {
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('File terlalu besar! Maksimal ukuran file 5 MB.');
      return;
    }

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

  const startProcessing = (parsedItems: ParsedImportItem[], sourceName: string, forceAll: boolean = false) => {
    setTotalParsedCount(parsedItems.length);

    // 1. Deduplicate entries inside the uploaded file itself
    const seenInFile = new Set<string>();
    const uniqueFileItems: ParsedImportItem[] = [];
    for (const item of parsedItems) {
      const norm = normalizeTitle(item.clean);
      if (!norm || seenInFile.has(norm)) continue;
      seenInFile.add(norm);
      uniqueFileItems.push(item);
    }

    if (forceAll) {
      setItemsToProcess(uniqueFileItems);
      setSkippedCount(0);
      setAllAlreadyUploaded(false);
      setCurrentIndex(0);
      setMigratedCount(0);
      setUploadedFileName(sourceName);
      saveSession(uniqueFileItems, 0, 0, 0, parsedItems.length, sourceName);
      if (uniqueFileItems.length > 0) {
        const firstQ = uniqueFileItems[0].clean;
        setCurrentQuery(firstQ);
        searchCurrent(firstQ);
      }
      return;
    }

    // 2. Build lookup of titles currently in watchlist
    const existingTitleSet = new Set<string>();
    for (const item of watchlistItems) {
      if (item.title) existingTitleSet.add(normalizeTitle(item.title));
      if (item.original_title) existingTitleSet.add(normalizeTitle(item.original_title));
    }

    // 3. Filter only titles not already in watchlist
    const newItems = uniqueFileItems.filter((item) => {
      const normClean = normalizeTitle(item.clean);
      const normRaw = normalizeTitle(item.raw);
      return !existingTitleSet.has(normClean) && !existingTitleSet.has(normRaw);
    });

    const skipped = parsedItems.length - newItems.length;
    setSkippedCount(skipped);
    setUploadedFileName(sourceName);

    if (newItems.length === 0) {
      // All items were already uploaded
      setAllAlreadyUploaded(true);
      setItemsToProcess(uniqueFileItems);
      saveSession(uniqueFileItems, 0, 0, skipped, parsedItems.length, sourceName);
      return;
    }

    setAllAlreadyUploaded(false);
    setItemsToProcess(newItems);
    setCurrentIndex(0);
    setMigratedCount(0);
    saveSession(newItems, 0, 0, skipped, parsedItems.length, sourceName);

    const firstQ = newItems[0].clean;
    setCurrentQuery(firstQ);
    searchCurrent(firstQ);
  };

  const searchCurrent = async (queryText: string) => {
    if (!queryText || !queryText.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setSearchResults([]); // Reset search results immediately so previous results do not linger
    try {
      const items = await fetchTMDBSearch(queryText.trim());
      setSearchResults(items);
    } catch (err) {
      console.warn('Migration search notice:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmMatch = async (match: SearchResultItem) => {
    if (isAdding) return;
    setIsAdding(true);
    try {
      const currentItem = itemsToProcess[currentIndex];
      let seasonCount: number | null = null;
      let seasonLabel: string | null = null;

      if (match.media_type === 'tv') {
        seasonCount = selectedSeasons[match.tmdb_id] || (currentItem?.season ? parseInt(currentItem.season.replace(/\D/g, ''), 10) || 1 : 1);
        seasonLabel = currentItem?.season || (seasonCount > 1 ? `S1-S${seasonCount}` : `S${seasonCount}`);
      }

      await addItem(match, seasonCount, seasonLabel);
      const newMigrated = migratedCount + 1;
      setMigratedCount(newMigrated);
      goToNext(newMigrated);
    } finally {
      setIsAdding(false);
    }
  };

  const goToNext = (migrated: number = migratedCount) => {
    const nextIdx = currentIndex + 1;
    saveSession(itemsToProcess, nextIdx, migrated, skippedCount, totalParsedCount, uploadedFileName);
    if (nextIdx < itemsToProcess.length) {
      setCurrentIndex(nextIdx);
      const nextQ = itemsToProcess[nextIdx].clean;
      setCurrentQuery(nextQ);
      searchCurrent(nextQ);
    } else {
      setCurrentIndex(itemsToProcess.length);
      try {
        localStorage.removeItem('wathis_migration_session');
      } catch {
        // ignore
      }
    }
  };

  if (!isOpen || !mounted) return null;

  const currentItem = itemsToProcess[currentIndex];

  return createPortal(
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-xl bg-card border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03]">
          <div className="flex items-center space-x-2.5">
            <Database className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm text-foreground tracking-tight">
              CSV Import & Archive Migration
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3.5 flex flex-col">
          {allAlreadyUploaded ? (
            <div className="min-h-[240px] flex flex-col items-center justify-center text-center p-6 space-y-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-3xl border border-black/[0.06] dark:border-white/[0.08]">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-xs">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Semua Judul Sudah Tersimpan</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Seluruh <strong>{totalParsedCount}</strong> judul dalam file <em>{uploadedFileName}</em> sudah ada di wathis kamu. Tidak ada judul baru yang perlu diimpor.
                </p>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={handleCancelMigration}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/10 dark:hover:bg-white/12 text-foreground transition-colors cursor-pointer"
                >
                  Upload File Lain
                </button>
                <button
                  onClick={() => startProcessing(itemsToProcess, uploadedFileName || 'List', true)}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer apple-btn-active"
                >
                  Paksa Review Ulang
                </button>
              </div>
            </div>
          ) : itemsToProcess.length === 0 ? (
            <div className="flex flex-col flex-1 space-y-3">
              {/* Import Method Segmented Switcher */}
              <div className="grid grid-cols-2 bg-black/[0.05] dark:bg-white/[0.06] p-1 rounded-full text-xs font-medium border border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`py-1.5 rounded-full flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    activeTab === 'upload'
                      ? 'bg-foreground text-background font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`py-1.5 rounded-full flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    activeTab === 'paste'
                      ? 'bg-foreground text-background font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paste Text</span>
                </button>
              </div>

              {/* Tab 1: Universal CSV File Upload */}
              {activeTab === 'upload' && (
                <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-150">
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
                    className={`flex-1 min-h-[260px] border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                      isDragging
                        ? 'border-blue-500 bg-blue-500/10 scale-[0.99]'
                        : 'border-black/[0.08] dark:border-white/[0.12] hover:border-blue-500/50 bg-black/[0.01] dark:bg-white/[0.02] hover:bg-blue-500/[0.02]'
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

                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                      <Upload className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-foreground">
                        Pilih atau Tarik File CSV ke Sini
                      </h4>
                      <p className="text-[11px] text-muted-foreground max-w-sm leading-relaxed">
                        Mendukung export dari Letterboxd, IMDb, Notion, atau Excel.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-5 py-2 rounded-full bg-foreground text-background font-semibold text-xs hover:opacity-90 shadow-md transition-all active:scale-95 cursor-pointer apple-btn-active"
                    >
                      Pilih File dari Perangkat
                    </button>

                    <div className="flex items-center space-x-1.5 pt-1 text-[10px] text-muted-foreground flex-wrap justify-center gap-y-1">
                      <span className="px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] font-mono-code font-medium">
                        .CSV
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
                        Letterboxd
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
                        Notion
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
                        IMDb
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
                        Excel
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Custom Text Paste */}
              {activeTab === 'paste' && (
                <div className="flex-1 flex flex-col justify-between space-y-3 animate-in fade-in duration-150">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Tempel daftar judul film / series di sini (satu judul per baris, format CSV, atau checklist)...&#10;&#10;Contoh:&#10;Inception (2010)&#10;Succession - Season 1&#10;Parasite, Thriller&#10;Interstellar"
                    className="w-full h-[220px] sm:h-[260px] bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-3.5 sm:p-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-muted-foreground font-sans leading-relaxed resize-none"
                  />
                  <button
                    onClick={handleStartTextParsing}
                    disabled={!inputText.trim()}
                    className="h-10 w-full bg-foreground text-background font-semibold rounded-full text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer shadow-md active:scale-98 apple-btn-active"
                  >
                    <span>Proses {inputText.split('\n').filter((l) => l.trim()).length} Judul</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : currentIndex < itemsToProcess.length ? (
            <div className="space-y-4">
              {/* Progress Tracker with Visual Bar */}
              <div className="bg-black/[0.03] dark:bg-white/[0.04] p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-muted-foreground">
                      Item <strong className="text-foreground font-bold">{currentIndex + 1}</strong> dari <strong>{itemsToProcess.length}</strong>
                    </span>
                    {skippedCount > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                        {skippedCount} sudah ada di arsip (dilewati)
                      </span>
                    )}
                    {uploadedFileName && (
                      <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                        ({uploadedFileName})
                      </span>
                    )}
                  </div>
                  <span className="text-foreground font-semibold text-xs shrink-0">
                    Berhasil Diimpor: <strong className="text-blue-600 dark:text-blue-400">{migratedCount}</strong>
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full h-1.5 bg-black/[0.06] dark:bg-white/[0.08] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(2, ((currentIndex + 1) / itemsToProcess.length) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Current Title Info & Live Search Bar */}
              <div className="p-4 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground font-medium">Source Entry:</div>
                  <div className="text-sm font-bold text-foreground truncate">&ldquo;{currentItem.raw}&rdquo;</div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground pt-0.5">
                    {currentItem.genre && (
                      <span className="px-2.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-foreground text-[11px]">
                        Genre: {currentItem.genre}
                      </span>
                    )}
                    {currentItem.year && (
                      <span className="px-2.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-foreground text-[11px]">
                        Year: {currentItem.year}
                      </span>
                    )}
                    {currentItem.season && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-semibold">
                        Season: {currentItem.season}
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Search Input to adjust TMDB query if not detected */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    searchCurrent(currentQuery);
                  }}
                  className="relative flex items-center space-x-2"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={currentQuery}
                      onChange={(e) => setCurrentQuery(e.target.value)}
                      placeholder="Ubah kata kunci pencarian TMDB..."
                      className="w-full bg-card border border-black/[0.08] dark:border-white/[0.12] rounded-full pl-4 pr-9 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    {isSearching && (
                      <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-3 top-2.5" />
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shrink-0 apple-btn-active"
                  >
                    Search
                  </button>
                </form>
              </div>

              {/* TMDB Matches */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground/80">
                    Pilih Hasil Pencarian TMDB:
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {searchResults.length} hasil
                  </span>
                </div>

                <div className="space-y-2.5 h-[230px] min-h-[230px] overflow-y-auto pr-1">
                  {isSearching && (
                    <div className="h-[210px] flex flex-col items-center justify-center space-y-2 text-xs text-muted-foreground">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      <span>Mencari di TMDB...</span>
                    </div>
                  )}

                  {!isSearching &&
                    searchResults.map((result) => {
                      const alreadyInList = isItemInWatchlist(result.tmdb_id, result.media_type);
                      const posterUrl = getTMDBImageUrl(result.poster_path, 'w300');
                      const currentSeasonChoice = selectedSeasons[result.tmdb_id] || (currentItem?.season ? parseInt(currentItem.season.replace(/\D/g, ''), 10) || 1 : 1);

                      return (
                        <div
                          key={`${result.media_type}-${result.tmdb_id}`}
                          className="flex items-center justify-between p-3 bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-2xl hover:border-black/[0.15] dark:hover:border-white/[0.2] transition-colors"
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
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground">
                                  No Art
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-foreground truncate">
                                {result.title} {result.release_year ? `(${result.release_year})` : ''}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                                {isAnimeItem(result) ? 'Anime' : result.media_type === 'movie' ? 'Film' : 'Series'} • {result.genres && result.genres.length > 0 ? result.genres.slice(0, 2).join(', ') : 'Cinema'}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center space-x-2">
                            {result.media_type === 'tv' && (
                              <select
                                value={currentSeasonChoice}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setSelectedSeasons((prev) => ({ ...prev, [result.tmdb_id]: val }));
                                }}
                                className="bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.08] text-foreground text-xs font-medium rounded-full px-2.5 py-1 focus:outline-none cursor-pointer"
                                title="Pilih season"
                              >
                                {Array.from({ length: Math.max(result.season_count || 1, 10) }, (_, i) => i + 1).map((s) => (
                                  <option key={s} value={s} className="bg-card text-foreground">
                                    {s === 1 ? 'S1' : `S1-S${s}`}
                                  </option>
                                ))}
                              </select>
                            )}

                            <button
                              onClick={() => handleConfirmMatch(result)}
                              disabled={isAdding}
                              className="text-xs bg-foreground hover:opacity-90 disabled:opacity-50 text-background font-semibold px-4 py-1.5 rounded-full transition-all active:scale-95 flex items-center space-x-1 shadow-sm cursor-pointer apple-btn-active"
                            >
                              <Check className="w-3 h-3" />
                              <span>{alreadyInList ? 'Added' : 'Confirm'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {!isSearching && searchResults.length === 0 && (
                    <div className="h-[210px] flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground bg-black/[0.02] dark:bg-white/[0.03] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] space-y-1">
                      <div className="font-medium text-foreground">Tidak ada judul yang cocok untuk &ldquo;{currentQuery}&rdquo;.</div>
                      <div className="text-[11px] text-muted-foreground">Ketik kata kunci di atas untuk mencari ulang atau lewati ke judul berikutnya.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.08] flex items-center justify-center mx-auto text-blue-500 shadow-sm">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Import Completed</h3>
              <p className="text-xs text-muted-foreground">
                Processed {itemsToProcess.length} items. Added {migratedCount} titles to your archive.
              </p>
              <button
                onClick={() => {
                  setItemsToProcess([]);
                  onClose();
                }}
                className="mt-4 bg-foreground text-background font-semibold px-6 py-2.5 rounded-full text-xs hover:opacity-90 transition-opacity cursor-pointer apple-btn-active"
              >
                Close Assistant
              </button>
            </div>
          )}
        </div>

        {/* Fixed Pinned Bottom Footer during processing */}
        {currentIndex < itemsToProcess.length && itemsToProcess.length > 0 && !allAlreadyUploaded && (
          <div className="px-5 py-3 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => searchCurrent(currentItem?.clean || '')}
                className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
              <button
                onClick={handleCancelMigration}
                className="flex items-center space-x-1 text-xs text-red-500 hover:bg-red-500/10 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Cancel</span>
              </button>
            </div>
            <button
              onClick={() => goToNext()}
              className="text-xs bg-card hover:bg-black/5 dark:hover:bg-white/10 text-foreground px-4 py-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.08] transition-colors cursor-pointer apple-btn-active font-medium"
            >
              Skip & Next &rarr;
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};


