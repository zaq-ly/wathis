'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WatchlistItem } from '@/types/watchlist';
import { useWatchlist } from '@/context/WatchlistContext';
import { useLanguage } from '@/context/LanguageContext';
import { getTMDBImageUrl, formatSeasonDisplay, parseSeasonInput, isAnimeItem } from '@/lib/utils';
import {
  X,
  ArrowLeftRight,
  Trash2,
  Tv,
  Film,
  Sparkles,
  Check,
  Edit2,
  ExternalLink,
  BookmarkCheck,
  PlayCircle,
  Pin
} from 'lucide-react';
import Image from 'next/image';

interface ItemDetailModalProps {
  item: WatchlistItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEditMatch: (item: WatchlistItem) => void;
  readonly?: boolean;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onOpenEditMatch,
  readonly = false,
}) => {
  const { updateSeason, removeItem, togglePin } = useWatchlist();
  const { t } = useLanguage();
  const [selectedSeasonCount, setSelectedSeasonCount] = useState<number>(1);
  const [customSeasonLabel, setCustomSeasonLabel] = useState<string>('');
  const [watchMode, setWatchMode] = useState<'completed' | 'ongoing' | 'custom'>('completed');
  const [ongoingSeason, setOngoingSeason] = useState<number>(1);
  const [ongoingEpisode, setOngoingEpisode] = useState<number>(1);
  const [isSaved, setIsSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  const quickSeasonMax = 6;
  const standardLabels = Array.from({ length: quickSeasonMax }, (_, i) => i === 0 ? 'S1' : `S1-S${i + 1}`);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (item) {
      const currentLabel = item.season_label || '';
      setSelectedSeasonCount(item.season_count || 1);
      setCustomSeasonLabel(formatSeasonDisplay(item));
      setIsSaved(false);

      // Auto detect if current label is ongoing (e.g. S2 E04, S1 E12, Eps 12)
      const matchOngoing = currentLabel.match(/^S(\d+)\s*(?:E|Ep|Episode)\s*(\d+)/i);
      const matchAnimeEp = currentLabel.match(/^Eps?\s*(\d+)/i);

      if (matchOngoing) {
        setWatchMode('ongoing');
        setOngoingSeason(parseInt(matchOngoing[1], 10) || item.season_count || 1);
        setOngoingEpisode(parseInt(matchOngoing[2], 10) || 1);
      } else if (matchAnimeEp) {
        setWatchMode('ongoing');
        setOngoingSeason(1);
        setOngoingEpisode(parseInt(matchAnimeEp[1], 10) || 1);
      } else if (currentLabel && !standardLabels.includes(currentLabel)) {
        setWatchMode('custom');
        setOngoingSeason(item.season_count || 1);
        setOngoingEpisode(1);
      } else {
        setWatchMode('completed');
        setOngoingSeason(item.season_count || 1);
        setOngoingEpisode(1);
      }
    }
  }, [item]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item || !mounted) return null;

  const isSeriesOrAnime = item.media_type === 'tv' || isAnimeItem(item);
  const backdropUrl = getTMDBImageUrl(item.backdrop_path, 'original') || getTMDBImageUrl(item.poster_path, 'w500');

  // Handle saving completed season (S1, S1-S2, etc.)
  const handleSaveCompleted = async (count: number, label?: string) => {
    if (!item) return;
    setSelectedSeasonCount(count);
    const newLabel = label !== undefined ? label : (count > 1 ? `S1-S${count}` : `S${count}`);
    setCustomSeasonLabel(newLabel);
    await updateSeason(item.tmdb_id, item.media_type, count, newLabel);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Handle saving ongoing season & episode (S2 E04)
  const handleSaveOngoing = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!item) return;

    const s = Math.max(1, Number(ongoingSeason) || 1);
    const ep = Math.max(1, Number(ongoingEpisode) || 1);
    const formattedEp = ep < 10 ? `0${ep}` : `${ep}`;
    const newLabel = `S${s} E${formattedEp}`;

    setSelectedSeasonCount(s);
    setCustomSeasonLabel(newLabel);
    await updateSeason(item.tmdb_id, item.media_type, s, newLabel);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Handle custom free-text label
  const handleCustomLabelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    const { count, label } = parseSeasonInput(customSeasonLabel);
    const finalCount = count !== null ? count : selectedSeasonCount;
    const finalLabel = label || (finalCount > 1 ? `S1-S${finalCount}` : `S1`);

    setSelectedSeasonCount(finalCount);
    setCustomSeasonLabel(finalLabel);
    await updateSeason(item.tmdb_id, item.media_type, finalCount, finalLabel);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDelete = async () => {
    if (!item) return;
    await removeItem(item.tmdb_id, item.media_type);
    onClose();
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-2xl bg-card border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Action Buttons (Pin & Close) */}
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
          {!readonly && (
            <button
              onClick={() => item && togglePin(item.tmdb_id, item.media_type)}
              className={`h-8 px-3 rounded-full backdrop-blur-xl transition-all flex items-center space-x-1.5 text-xs font-semibold border shadow-md cursor-pointer apple-btn-active ${
                item.is_pinned
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
                  : 'bg-black/60 hover:bg-black text-white border-white/20'
              }`}
              title={item.is_pinned ? t.unpinTitle : t.pinTitle}
            >
              <Pin className={`w-3.5 h-3.5 ${item.is_pinned ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{item.is_pinned ? t.pinned : t.pinTitle}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-xl transition-all flex items-center justify-center border border-white/20 shadow-md cursor-pointer apple-btn-active"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cinematic Backdrop Header */}
        <div className="relative h-56 sm:h-72 w-full bg-muted overflow-hidden shrink-0">
          {backdropUrl ? (
            <Image
              src={backdropUrl}
              alt={item.title}
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

          {/* Type Badge & Rating Badge */}
          <div className="absolute bottom-4 left-5 sm:left-6 flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl text-white border border-white/20 shadow-sm">
              {isAnimeItem(item) ? (
                <>
                  <Sparkles className="w-3 h-3 text-rose-400" />
                  <span>Anime{formatSeasonDisplay(item) ? ` • ${formatSeasonDisplay(item)}` : ''}</span>
                </>
              ) : item.media_type === 'movie' ? (
                <>
                  <Film className="w-3 h-3 text-sky-400" />
                  <span>Film{formatSeasonDisplay(item) ? ` • ${formatSeasonDisplay(item)}` : ''}</span>
                </>
              ) : (
                <>
                  <Tv className="w-3 h-3 text-indigo-400" />
                  <span>Series{formatSeasonDisplay(item) ? ` • ${formatSeasonDisplay(item)}` : ''}</span>
                </>
              )}
            </span>

            {item.vote_average ? (
              <span className="text-xs font-semibold bg-black/60 backdrop-blur-xl text-white border border-white/20 px-3 py-1 rounded-full flex items-center space-x-1 shadow-sm">
                <span className="text-amber-400">★</span>
                <span>{item.vote_average}</span>
              </span>
            ) : null}

            {item.release_year && (
              <span className="text-xs font-medium bg-black/60 backdrop-blur-xl text-zinc-300 border border-white/15 px-3 py-1 rounded-full shadow-sm">
                {item.release_year}
              </span>
            )}
            {item.tmdb_id && (
              <span className="inline-flex items-center space-x-0.5 text-xs font-medium bg-black/60 backdrop-blur-xl text-white border border-white/20 rounded-full px-2 py-0.5">
                <ExternalLink className="w-3 h-3" />
                <a
                  href={`https://www.themoviedb.org/${item.media_type === 'movie' ? 'movie' : 'tv'}/${item.tmdb_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline underline-offset-2"
                  title="View on TMDB"
                >TMDB</a>
              </span>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Title & Original Title */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {item.title}
            </h2>
            {item.original_title && item.original_title !== item.title && (
              <p className="text-xs text-muted-foreground mt-1">
                Original: {item.original_title}
              </p>
            )}
          </div>

{/* Genres */}
           {item.genres && item.genres.length > 0 && (
             <div className="flex flex-wrap gap-2">
               {item.genres.map((g) => (
                 <span
                   key={g}
                   className="text-xs font-medium px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-muted-foreground border border-black/[0.04] dark:border-white/[0.06]"
                 >
                   {g}
                 </span>
               ))}
             </div>
           )}
           {/* Overview (mobile only) */}
           {item.overview && (
             <div className="block md:hidden mt-4">
               <p className="text-sm font-medium text-muted-foreground">{t.overview}:</p>
               <p className="text-sm text-foreground">{item.overview}</p>
             </div>
           )}

          {/* Watch Log / Season & Episode Tracking */}
          {!readonly && isSeriesOrAnime && (
            <div className="p-4 sm:p-5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tv className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {t.watchLog}:
                  </span>
                </div>
                {isSaved && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.save}</span>
                  </span>
                )}
              </div>

              {/* Segmented Mode Switcher: Completed vs Ongoing vs Custom */}
              <div className="grid grid-cols-3 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setWatchMode('completed')}
                  className={`py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    watchMode === 'completed'
                      ? 'bg-foreground text-background font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span className="truncate">{t.completedStatus}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWatchMode('ongoing')}
                  className={`py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    watchMode === 'ongoing'
                      ? 'bg-foreground text-background font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span className="truncate">{t.ongoingStatus}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWatchMode('custom')}
                  className={`py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    watchMode === 'custom'
                      ? 'bg-foreground text-background font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="truncate">{t.customLabel}</span>
                </button>
              </div>

              {/* MODE 1: COMPLETED SEASONS */}
              {watchMode === 'completed' && (
                <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center gap-2">
                    {standardLabels.map((label, index) => {
                      const seasonNumber = index + 1;
                      const isActive = customSeasonLabel === label || (!customSeasonLabel && selectedSeasonCount === seasonNumber);

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => handleSaveCompleted(seasonNumber, label)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer apple-btn-active ${
                            isActive
                              ? 'bg-foreground text-background font-bold shadow-sm ring-2 ring-foreground/20'
                              : 'bg-card hover:bg-black/5 dark:hover:bg-white/10 text-foreground border border-black/[0.06] dark:border-white/[0.08]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MODE 2: ONGOING (SEASON + EPISODE LOGGING) */}
              {watchMode === 'ongoing' && (
                <form onSubmit={handleSaveOngoing} className="space-y-3 pt-1 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Season Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t.season}
                      </label>
                      <div className="flex items-center bg-card border border-black/[0.08] dark:border-white/[0.12] rounded-xl px-3 py-2">
                        <span className="text-xs text-muted-foreground mr-2 font-mono font-bold">S</span>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={ongoingSeason}
                          onChange={(e) => setOngoingSeason(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="bg-transparent border-none outline-none text-foreground text-xs font-bold w-full"
                        />
                      </div>
                    </div>

                    {/* Episode Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t.lastEpisode}
                      </label>
                      <div className="flex items-center bg-card border border-black/[0.08] dark:border-white/[0.12] rounded-xl px-3 py-2">
                        <span className="text-xs text-muted-foreground mr-2 font-mono font-bold">Ep</span>
                        <input
                          type="number"
                          min="1"
                          max="9999"
                          value={ongoingEpisode}
                          onChange={(e) => setOngoingEpisode(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="bg-transparent border-none outline-none text-foreground text-xs font-bold w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button for Ongoing */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs text-muted-foreground">
                      Label: <span className="font-mono font-bold text-foreground">S{ongoingSeason} E{ongoingEpisode < 10 ? `0${ongoingEpisode}` : ongoingEpisode}</span>
                    </div>
                    <button
                      type="submit"
                      className="bg-foreground text-background text-xs font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity cursor-pointer apple-btn-active shadow-sm"
                    >
                      {t.saveLog}
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 3: CUSTOM TEXT LABEL */}
              {watchMode === 'custom' && (
                <form onSubmit={handleCustomLabelSubmit} className="flex items-center space-x-2 pt-1 animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={customSeasonLabel}
                    onChange={(e) => setCustomSeasonLabel(e.target.value)}
                    placeholder="S2, Season 1-3, Part 2..."
                    className="flex-1 bg-card border border-black/[0.08] dark:border-white/[0.12] rounded-full px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <button
                    type="submit"
                    className="bg-foreground text-background text-xs font-semibold px-4 py-2 rounded-full hover:opacity-90 cursor-pointer apple-btn-active"
                  >
                    {t.save}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Watch Log for Movies: Franchise / Sequel / Part */}
          {!readonly && item.media_type === 'movie' && !isAnimeItem(item) && (
            <div className="p-4 sm:p-5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Film className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {t.movieSequel}:
                  </span>
                </div>
                {isSaved && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.save}</span>
                  </span>
                )}
              </div>

              {/* Quick Movie Part Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {['Part 1', 'Part 1-2', 'Part 1-3', 'Part 1-4', 'Film 1-3', 'Trilogy'].map((label, idx) => {
                  const isActive = customSeasonLabel === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleSaveCompleted(idx + 1, label)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer apple-btn-active ${
                        isActive
                          ? 'bg-foreground text-background font-bold shadow-sm ring-2 ring-foreground/20'
                          : 'bg-card hover:bg-black/5 dark:hover:bg-white/10 text-foreground border border-black/[0.06] dark:border-white/[0.08]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}

                {customSeasonLabel && (
                  <button
                    type="button"
                    onClick={() => handleSaveCompleted(1, '')}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
                  >
                    {t.movieSingle}
                  </button>
                )}
              </div>

              {/* Custom Input for Movie */}
              <form onSubmit={handleCustomLabelSubmit} className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={customSeasonLabel}
                  onChange={(e) => setCustomSeasonLabel(e.target.value)}
                  placeholder="Part 1-2, Extended Cut, Vol. 2..."
                  className="flex-1 bg-card border border-black/[0.08] dark:border-white/[0.12] rounded-full px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                />
                <button
                  type="submit"
                  className="bg-foreground text-background text-xs font-semibold px-4 py-2 rounded-full hover:opacity-90 cursor-pointer apple-btn-active"
                >
                  {t.save}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!readonly && (
          <div className="p-4 sm:p-5 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-end space-x-2.5">
            <button
              onClick={() => {
                onClose();
                onOpenEditMatch(item);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-medium bg-card hover:bg-black/5 dark:hover:bg-white/10 text-foreground border border-black/[0.06] dark:border-white/[0.08] transition-colors cursor-pointer apple-btn-active"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{t.editMatch}</span>
            </button>

            <button
              onClick={handleDelete}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-medium bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-colors cursor-pointer apple-btn-active"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.deleteTitle}</span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
