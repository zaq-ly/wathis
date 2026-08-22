'use client';

import React, { useState, useEffect } from 'react';
import { WatchlistItem } from '@/types/watchlist';
import { useWatchlist } from '@/context/WatchlistContext';
import { getTMDBImageUrl } from '@/lib/utils';
import {
  X,
  ExternalLink,
  Calendar,
  ArrowLeftRight,
  Trash2,
  Tv,
  Film,
  Check,
  Edit2
} from 'lucide-react';
import Image from 'next/image';

interface ItemDetailModalProps {
  item: WatchlistItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEditMatch: (item: WatchlistItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onOpenEditMatch,
}) => {
  const { updateSeason, removeItem } = useWatchlist();
  const [selectedSeasonCount, setSelectedSeasonCount] = useState<number>(1);
  const [customSeasonLabel, setCustomSeasonLabel] = useState<string>('');
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (item) {
      setSelectedSeasonCount(item.season_count || 1);
      setCustomSeasonLabel(item.season_label || '');
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

  if (!isOpen || !item) return null;

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
    await updateSeason(item.tmdb_id, item.media_type, selectedSeasonCount, customSeasonLabel.trim() || null);
    setIsEditingLabel(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDelete = async () => {
    await removeItem(item.tmdb_id, item.media_type);
    onClose();
  };

  const maxSeasons = Math.max(item.season_count || 1, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
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
              className="object-cover filter brightness-[0.85]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium">
              No Backdrop Artwork
            </div>
          )}

          {/* Apple Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />

          {/* Type Badge & Rating Badge */}
          <div className="absolute bottom-4 left-5 sm:left-6 flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 text-xs font-semibold px-3 py-1 rounded-full bg-black/70 backdrop-blur-xl text-white border border-white/20">
              {item.media_type === 'movie' ? (
                <>
                  <Film className="w-3 h-3 text-zinc-300" />
                  <span>Film{item.season_count ? ` • ${item.season_count > 1 ? `S1-S${item.season_count}` : 'S1'}` : ''}</span>
                </>
              ) : (
                <>
                  <Tv className="w-3 h-3 text-blue-400" />
                  <span>Series{item.season_count ? ` • ${item.season_count > 1 ? `S1-S${item.season_count}` : 'S1'}` : ''}</span>
                </>
              )}
            </span>

            {item.vote_average ? (
              <span className="text-xs font-semibold bg-black/70 backdrop-blur-xl text-white border border-white/20 px-3 py-1 rounded-full flex items-center space-x-1">
                <span className="text-amber-400">★</span>
                <span>{item.vote_average}</span>
              </span>
            ) : null}

            {item.release_year && (
              <span className="text-xs font-medium bg-black/60 backdrop-blur-xl text-zinc-300 border border-white/15 px-3 py-1 rounded-full">
                {item.release_year}
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

          {/* Season Selector for Series */}
          <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tv className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-foreground">
                  Progres Season yang Ditonton:
                </span>
              </div>
              {isSaved && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center space-x-1 animate-in fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersimpan</span>
                </span>
              )}
            </div>

            {/* Quick Season Pill Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: maxSeasons }, (_, i) => i + 1).map((s) => {
                const label = s === 1 ? 'S1' : `S1-S${s}`;
                const currentActiveLabel = customSeasonLabel || (selectedSeasonCount > 1 ? `S1-S${selectedSeasonCount}` : `S${selectedSeasonCount}`);
                const isActive = currentActiveLabel === label;

                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSaveSeason(s, label)}
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
                className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center space-x-1 cursor-pointer apple-btn-active transition-colors ${
                  isEditingLabel
                    ? 'bg-foreground text-background font-semibold'
                    : 'bg-card hover:bg-black/5 dark:hover:bg-white/10 text-foreground border-black/[0.06] dark:border-white/[0.08]'
                }`}
                title="Ketik label custom"
              >
                <Edit2 className="w-3 h-3" />
                <span>Custom</span>
              </button>
            </div>

            {/* Custom Label Input */}
            {isEditingLabel && (
              <form onSubmit={handleCustomLabelSubmit} className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={customSeasonLabel}
                  onChange={(e) => setCustomSeasonLabel(e.target.value)}
                  placeholder="Contoh: S2 Saja, Season 1-3, Part 2..."
                  className="flex-1 bg-card border border-black/[0.08] dark:border-white/[0.12] rounded-full px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  type="submit"
                  className="bg-foreground text-background text-xs font-semibold px-4 py-2 rounded-full hover:opacity-90 cursor-pointer apple-btn-active"
                >
                  Simpan
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-end space-x-2.5">
          <button
            onClick={() => {
              onClose();
              onOpenEditMatch(item);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-medium bg-card hover:bg-black/5 dark:hover:bg-white/10 text-foreground border border-black/[0.06] dark:border-white/[0.08] transition-colors cursor-pointer apple-btn-active"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Ganti Judul</span>
          </button>

          <button
            onClick={handleDelete}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-medium bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-colors cursor-pointer apple-btn-active"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </button>
        </div>
      </div>
    </div>
  );
};


