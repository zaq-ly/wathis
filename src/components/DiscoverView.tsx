'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useWatchlist } from '@/context/WatchlistContext';
import { useLanguage } from '@/context/LanguageContext';
import { SearchResultItem } from '@/types/watchlist';
import { DISCOVER_GENRES } from '@/lib/tmdb';
import { getTMDBImageUrl, isAnimeItem } from '@/lib/utils';
import { CustomSelect } from './CustomSelect';
import {
  Film,
  Tv,
  Sparkles,
  Star,
  Plus,
  Check,
  Loader2,
  TrendingUp,
  Compass,
  X,
  Clapperboard,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';

interface DiscoverViewProps {
  onOpenAuth: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({ onOpenAuth }) => {
  const { addItem, isItemInWatchlist, user } = useWatchlist();
  const { language, t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [mediaType, setMediaType] = useState<'all' | 'movie' | 'tv' | 'anime'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [minRating, setMinRating] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rating' | 'popularity'>('popularity');

  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<SearchResultItem | null>(null);
  const [translatedOverview, setTranslatedOverview] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    setTranslatedOverview(null);
    setIsTranslating(false);
    setShowOriginal(false);
  }, [selectedItemForDetail]);

  const fetchDiscover = useCallback(async (targetPage = 1) => {
    if (targetPage === 1) {
      setIsLoading(true);
      setPage(1);
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (mediaType !== 'all') params.set('type', mediaType);
      if (selectedGenre) params.set('genre', selectedGenre);
      if (minRating) params.set('rating', minRating);
      if (sortBy) params.set('sort', sortBy);
      params.set('lang', language);
      params.set('page', String(targetPage));

      const res = await fetch(`/api/tmdb/discover?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const incoming: SearchResultItem[] = data.results || [];

        if (targetPage === 1) {
          setResults(incoming);
          if (incoming.length < 10) setHasMore(false);
        } else {
          setResults((prev) => {
            const existingKeys = new Set(prev.map((it) => `${it.media_type}_${it.tmdb_id}`));
            const uniqueIncoming = incoming.filter(
              (it) => !existingKeys.has(`${it.media_type}_${it.tmdb_id}`)
            );
            if (uniqueIncoming.length === 0 || incoming.length < 5) {
              setHasMore(false);
            }
            return [...prev, ...uniqueIncoming];
          });
          setPage(targetPage);
        }
      } else {
        if (targetPage === 1) setResults([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Discover fetch error:', err);
      if (targetPage === 1) setResults([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [mediaType, selectedGenre, minRating, sortBy, language]);

  useEffect(() => {
    fetchDiscover(1);
  }, [fetchDiscover]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchDiscover(page + 1);
    }
  };

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedItemForDetail) {
        setSelectedItemForDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemForDetail]);

  const handleAdd = async (item: SearchResultItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      onOpenAuth();
      return;
    }
    const key = `${item.media_type}_${item.tmdb_id}`;
    setAddingId(key);
    try {
      await addItem(item);
    } finally {
      setAddingId(null);
    }
  };

  const genreOptions = [
    { value: '', label: t.allGenres },
    ...DISCOVER_GENRES.map((g) => ({ value: g, label: g })),
  ];

  const ratingOptions = [
    { value: '', label: t.allRatings },
    { value: '7.0', label: '★ 7.0+' },
    { value: '7.5', label: '★ 7.5+' },
    { value: '8.0', label: '★ 8.0+' },
    { value: '8.5', label: '★ 8.5+' },
  ];

  const sortOptions = [
    { value: 'popularity', label: t.popularity },
    { value: 'rating', label: t.topRated },
  ];

  return (
    <div className="space-y-6 pt-1">
      {/* Sub-Header / Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1 border-b border-black/[0.06] dark:border-white/[0.08]">
        {/* Left: Section Title & Type Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {t.discover}
              </h2>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                {t.discoverSubtitle}
              </p>
            </div>
          </div>

          {/* Type Switcher Pills */}
          <div className="flex items-center p-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 shrink-0 self-start sm:self-auto mt-1 sm:mt-0">
            <button
              onClick={() => setMediaType('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                mediaType === 'all'
                  ? 'bg-foreground text-background font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.all}
            </button>
            <button
              onClick={() => setMediaType('movie')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                mediaType === 'movie'
                  ? 'bg-foreground text-background font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.films}
            </button>
            <button
              onClick={() => setMediaType('tv')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                mediaType === 'tv'
                  ? 'bg-foreground text-background font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.series}
            </button>
            <button
              onClick={() => setMediaType('anime')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                mediaType === 'anime'
                  ? 'bg-foreground text-background font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.anime}
            </button>
          </div>
        </div>

        {/* Right: Dropdowns (Genre, Rating, Sort) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Genre Dropdown */}
          <CustomSelect
            value={selectedGenre}
            options={genreOptions}
            onChange={(val) => setSelectedGenre(val)}
            placeholder={t.allGenres}
          />

          {/* Min Rating Dropdown */}
          <CustomSelect
            value={minRating}
            options={ratingOptions}
            onChange={(val) => setMinRating(val)}
            placeholder={t.minRatingLabel}
          />

          {/* Sort Option */}
          <CustomSelect
            value={sortBy}
            options={sortOptions}
            onChange={(val) => setSortBy(val as any)}
          />
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          <span className="text-xs text-muted-foreground font-medium">
            Memuat rekomendasi TMDB...
          </span>
        </div>
      ) : results.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-muted-foreground">
            <Clapperboard className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              {t.noTitlesFound}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Coba turunkan minimal rating atau ganti filter genre.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {results.map((item) => {
            const posterUrl = getTMDBImageUrl(item.poster_path, 'w500');
            const inWatchlist = isItemInWatchlist(item.tmdb_id, item.media_type);
            const isAnime = isAnimeItem(item);
            const itemKey = `${item.media_type}_${item.tmdb_id}`;
            const isAdding = addingId === itemKey;

            return (
              <div
                key={itemKey}
                onClick={() => setSelectedItemForDetail(item)}
                className="group relative flex flex-col bg-card border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.15] dark:hover:border-white/[0.2] rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer shadow-xs hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
              >
                {/* Poster Artwork */}
                <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-muted text-muted-foreground">
                      <span className="text-xs font-medium">No Poster</span>
                    </div>
                  )}

                  {/* Gradient Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <div className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xl text-[10px] text-white font-medium border border-white/10 flex items-center space-x-1 shadow-sm">
                      {isAnime ? (
                        <Sparkles className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                      ) : item.media_type === 'movie' ? (
                        <Film className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                      ) : (
                        <Tv className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                      )}
                      <span>
                        {isAnime ? 'Anime' : item.media_type === 'movie' ? 'Film' : 'Series'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {item.vote_average !== null && item.vote_average !== undefined && (
                        <div className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xl text-[10px] text-amber-300 font-bold border border-amber-400/20 flex items-center space-x-0.5 shadow-sm">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{item.vote_average.toFixed(1)}</span>
                        </div>
                      )}
                      {inWatchlist && (
                        <div
                          className="w-5 h-5 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-sm"
                          title={t.savedInArchive}
                        >
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Bottom Meta */}
                <div className="p-3 space-y-1 bg-card">
                  <h3 className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center space-x-1.5 text-[10px] text-muted-foreground">
                    {item.release_year && <span>{item.release_year}</span>}
                    {item.release_year && item.genres?.length > 0 && <span>•</span>}
                    <span className="truncate">{item.genres?.slice(0, 2).join(', ')}</span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {!isLoading && results.length > 0 && (
        <div className="pt-4 pb-12 flex flex-col items-center justify-center space-y-2">
          {hasMore ? (
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-7 py-3 rounded-full bg-black/[0.04] dark:bg-white/[0.07] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-foreground font-semibold text-xs border border-black/10 dark:border-white/10 transition-all flex items-center space-x-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 apple-btn-active"
            >
              {isLoadingMore ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              ) : (
                <Compass className="w-4 h-4 text-amber-500" />
              )}
              <span>{isLoadingMore ? 'Memuat...' : t.loadMore}</span>
            </button>
          ) : (
            <p className="text-xs text-muted-foreground font-medium py-2">
              {t.noMoreTitles}
            </p>
          )}
        </div>
      )}

      {/* Quick Detail Modal for Discover Items (Styled consistent with ItemDetailModal) */}
      {mounted && selectedItemForDetail && createPortal(
        <div
          onClick={() => setSelectedItemForDetail(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
        >
          <div
            className="w-full max-w-2xl bg-card border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Action Buttons (Close) */}
            <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
              <button
                onClick={() => setSelectedItemForDetail(null)}
                className="h-8 w-8 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-xl transition-all flex items-center justify-center border border-white/20 shadow-md cursor-pointer apple-btn-active"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cinematic Backdrop Header */}
            <div className="relative h-56 sm:h-72 w-full bg-muted overflow-hidden shrink-0">
              {getTMDBImageUrl(selectedItemForDetail.backdrop_path, 'original') ||
              getTMDBImageUrl(selectedItemForDetail.poster_path, 'w500') ? (
                <Image
                  src={
                    getTMDBImageUrl(selectedItemForDetail.backdrop_path, 'original') ||
                    getTMDBImageUrl(selectedItemForDetail.poster_path, 'w500')!
                  }
                  alt={selectedItemForDetail.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium">
                  No Backdrop Artwork
                </div>
              )}

              {/* Cinematic Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />

              {/* Badges on bottom of backdrop */}
              <div className="absolute bottom-4 left-5 sm:left-6 flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl text-white border border-white/20 shadow-sm">
                  {isAnimeItem(selectedItemForDetail) ? (
                    <>
                      <Sparkles className="w-3 h-3 text-rose-400" />
                      <span>Anime</span>
                    </>
                  ) : selectedItemForDetail.media_type === 'movie' ? (
                    <>
                      <Film className="w-3 h-3 text-sky-400" />
                      <span>Film</span>
                    </>
                  ) : (
                    <>
                      <Tv className="w-3 h-3 text-indigo-400" />
                      <span>Series</span>
                    </>
                  )}
                </span>

                {selectedItemForDetail.vote_average ? (
                  <span className="text-xs font-semibold bg-black/60 backdrop-blur-xl text-white border border-white/20 px-3 py-1 rounded-full flex items-center space-x-1 shadow-sm">
                    <span className="text-amber-400">★</span>
                    <span>{selectedItemForDetail.vote_average.toFixed(1)}</span>
                  </span>
                ) : null}

                {selectedItemForDetail.release_year && (
                  <span className="text-xs font-medium bg-black/60 backdrop-blur-xl text-zinc-300 border border-white/15 px-3 py-1 rounded-full shadow-sm">
                    {selectedItemForDetail.release_year}
                  </span>
                )}

                {selectedItemForDetail.tmdb_id && (
                  <span className="inline-flex items-center space-x-0.5 text-xs font-medium bg-black/60 backdrop-blur-xl text-white border border-white/20 rounded-full px-2 py-0.5">
                    <ExternalLink className="w-3 h-3" />
                    <a
                      href={`https://www.themoviedb.org/${selectedItemForDetail.media_type === 'movie' ? 'movie' : 'tv'}/${selectedItemForDetail.tmdb_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white underline underline-offset-2"
                      title="View on TMDB"
                    >
                      TMDB
                    </a>
                  </span>
                )}
              </div>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Title & Original Title */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {selectedItemForDetail.title}
                </h2>
                {selectedItemForDetail.original_title &&
                  selectedItemForDetail.original_title !== selectedItemForDetail.title && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Original: {selectedItemForDetail.original_title}
                    </p>
                  )}
              </div>

              {/* Genres */}
              {selectedItemForDetail.genres && selectedItemForDetail.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedItemForDetail.genres.map((g) => (
                    <span
                      key={g}
                      className="text-xs font-medium px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-muted-foreground border border-black/[0.04] dark:border-white/[0.06]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview with On-Demand Translate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t.overview}:
                  </p>

                  {language === 'id' && selectedItemForDetail.overview && (
                    <div>
                      {translatedOverview ? (
                        <button
                          type="button"
                          onClick={() => setShowOriginal(!showOriginal)}
                          className="text-[11px] text-blue-500 hover:text-blue-600 font-medium transition-colors cursor-pointer"
                        >
                          {showOriginal ? 'Lihat Terjemahan (ID)' : 'Lihat Teks Asli'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            setIsTranslating(true);
                            try {
                              const res = await fetch('/api/translate', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  text: selectedItemForDetail.overview,
                                  from: 'en',
                                  to: 'id',
                                }),
                              });
                              if (res.ok) {
                                const data = await res.json();
                                if (data.translatedText) {
                                  setTranslatedOverview(data.translatedText);
                                  setShowOriginal(false);
                                }
                              }
                            } catch (err) {
                              console.error('Translate error:', err);
                            } finally {
                              setIsTranslating(false);
                            }
                          }}
                          disabled={isTranslating}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isTranslating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          <span>
                            {isTranslating ? 'Menerjemahkan...' : 'Terjemahkan ke Indonesia'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-sm text-foreground leading-relaxed">
                  {translatedOverview && !showOriginal
                    ? translatedOverview
                    : selectedItemForDetail.overview || t.noOverview}
                </p>
                {translatedOverview && !showOriginal && (
                  <span className="inline-block text-[10px] text-muted-foreground italic">
                    * Diterjemahkan otomatis ke Bahasa Indonesia
                  </span>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-end space-x-2.5">
              <button
                onClick={() => setSelectedItemForDetail(null)}
                className="px-4 py-2 rounded-full text-xs font-medium bg-card hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground border border-black/[0.06] dark:border-white/[0.08] transition-colors cursor-pointer apple-btn-active"
              >
                {t.cancel}
              </button>

              {isItemInWatchlist(
                selectedItemForDetail.tmdb_id,
                selectedItemForDetail.media_type
              ) ? (
                <div className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.savedInArchive}</span>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    await handleAdd(selectedItemForDetail);
                  }}
                  disabled={
                    addingId ===
                    `${selectedItemForDetail.media_type}_${selectedItemForDetail.tmdb_id}`
                  }
                  className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-foreground text-background hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer apple-btn-active disabled:opacity-50"
                >
                  {addingId ===
                  `${selectedItemForDetail.media_type}_${selectedItemForDetail.tmdb_id}` ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{t.addToArchive}</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
