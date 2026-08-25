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
  ExternalLink
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
  const { updateSeason, removeItem } = useWatchlist();
  const { t } = useLanguage();
  const [selectedSeasonCount, setSelectedSeasonCount] = useState<number>(1);
  const [customSeasonLabel, setCustomSeasonLabel] = useState<string>('');
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (item) {
      setSelectedSeasonCount(item.season_count || 1);
      setCustomSeasonLabel(formatSeasonDisplay(item));
      setIsEditingLabel(false);
      setIsSaved(false);
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

  const backdropUrl = getTMDBImageUrl(item.backdrop_path, 'original') || getTMDBImageUrl(item.poster_path, 'w500');

  const handleSaveSeason = async (count: number, label?: string) => {
    setSelectedSeasonCount(count);
    const newLabel = label !== undefined ? label : (count > 1 ? `S1-S${count}` : `S${count}`);
    setCustomSeasonLabel(newLabel);
    await updateSeason(item.tmdb_id, item.media_type, count, newLabel);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCustomLabelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { count, label } = parseSeasonInput(customSeasonLabel);
    const finalCount = count !== null ? count : selectedSeasonCount;
    const finalLabel = label || (finalCount > 1 ? `S1-S${finalCount}` : `S1`);

    setSelectedSeasonCount(finalCount);
    setCustomSeasonLabel(finalLabel);
    await updateSeason(item.tmdb_id, item.media_type, finalCount, finalLabel);
    setIsEditingLabel(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDelete = async () => {
    await removeItem(item.tmdb_id, item.media_type);
    onClose();
  };

  const quickSeasonMax = 6;
  const standardLabels = Array.from({ length: quickSeasonMax }, (_, i) => i === 0 ? 'S1' : `S1-S${i + 1}`);
  const isCustomSelected = Boolean(customSeasonLabel && !standardLabels.includes(customSeasonLabel));

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-2xl bg-card border border-black/[0.08] dark:border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-xl transition-all flex items-center justify-center border border-white/20 shadow-md cursor-pointer apple-btn-active"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

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
              <a
                href={`https://www.themoviedb.org/${item.media_type === 'movie' ? 'movie' : 'tv'}/${item.tmdb_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center space-x-0.5 text-xs font-medium text-muted-foreground underline underline-offset-2"
                title="View on TMDB"
              >
                <ExternalLink className="w-3 h-3" />
                <span>TMDB</span>
              </a>
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

          {/* Season Selector for Series */}
          {!readonly && (
            <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tv className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-semibold text-foreground">
                    {t.seasons}:
                  </span>
                </div>
                {isSaved && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center space-x-1 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.save}</span>
                  </span>
                )}
              </div>

              {/* Quick Season Pill Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {standardLabels.map((label, index) => {
                  const seasonNumber = index + 1;
                  const isActive = !isCustomSelected && (customSeasonLabel === label || (!customSeasonLabel && selectedSeasonCount === seasonNumber));

                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleSaveSeason(seasonNumber, label)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer apple-btn-active ${
                        isActive
                          ? 'bg-foreground text-background font-semibold shadow-sm ring-2 ring-foreground/20'
                          : 'bg-card hover:bg-black/5 dark:hover:bg-white/10 text-foreground border border-black/[0.06] dark:border-white/[0.08]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setIsEditingLabel(!isEditingLabel)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border flex items-center space-x-1.5 cursor-pointer apple-btn-active transition-colors ${
                    isCustomSelected || isEditingLabel
                      ? 'bg-foreground text-background font-semibold shadow-sm ring-2 ring-foreground/20'
                      : 'bg-card hover:bg-black/5 dark:hover:bg-white/10 text-foreground border-black/[0.06] dark:border-white/[0.08]'
                  }`}
                  title="Custom season label"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{isCustomSelected ? customSeasonLabel : 'Custom'}</span>
                </button>
              </div>

              {/* Custom Label Input */}
              {isEditingLabel && (
                <form onSubmit={handleCustomLabelSubmit} className="flex items-center space-x-2 pt-1">
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
