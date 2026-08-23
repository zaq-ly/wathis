'use client';

import React, { useState } from 'react';
import { WatchlistItem } from '@/types/watchlist';
import { useWatchlist } from '@/context/WatchlistContext';
import { useLanguage } from '@/context/LanguageContext';
import { getTMDBImageUrl, formatSeasonDisplay, isAnimeItem } from '@/lib/utils';
import { Trash2, Calendar, Sparkles, Clapperboard, ArrowLeftRight, Film, Tv } from 'lucide-react';
import Image from 'next/image';
import { EditMatchModal } from './EditMatchModal';
import { ItemDetailModal } from './ItemDetailModal';

interface GridViewProps {
  items: WatchlistItem[];
  onOpenSearch: () => void;
  readonly?: boolean;
}

export const GridView: React.FC<GridViewProps> = ({ items, onOpenSearch, readonly = false }) => {
  const { removeItem } = useWatchlist();
  const { t } = useLanguage();
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<WatchlistItem | null>(null);

  if (items.length === 0) {
    return (
      <div className="py-24 sm:py-32 flex flex-col items-center justify-center text-center space-y-5 my-6">
        <div className="w-16 h-16 rounded-3xl bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center text-muted-foreground shadow-sm">
          <Clapperboard className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-md px-4">
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            {t.emptyArchive}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t.emptyArchiveDesc}
          </p>
        </div>
        <div className="pt-2">
          {!readonly && (
            <button
              onClick={onOpenSearch}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all shadow-md active:scale-95 cursor-pointer apple-btn-active"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.addFirstTitle}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 pt-2 sm:pt-4">
        {items.map((item, index) => {
          const posterUrl = getTMDBImageUrl(item.poster_path, 'w500');

          return (
            <div
              key={item.id || `${item.media_type}-${item.tmdb_id}-${index}`}
              onClick={() => setSelectedDetailItem(item)}
              className="group relative flex flex-col bg-card border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.15] dark:hover:border-white/[0.2] rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
            >
              {/* Poster Artwork with Apple 2/3 Aspect */}
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

                {/* Apple Gradient Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

                <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xl text-[10px] text-white font-medium border border-white/10 flex items-center space-x-1 shadow-sm">
                  {isAnimeItem(item) ? (
                    <Sparkles className="w-2.5 h-2.5 text-rose-400" />
                  ) : item.media_type === 'movie' ? (
                    <Film className="w-2.5 h-2.5 text-sky-400" />
                  ) : (
                    <Tv className="w-2.5 h-2.5 text-indigo-400" />
                  )}
                  <span>
                    {isAnimeItem(item) ? 'Anime' : item.media_type === 'movie' ? 'Film' : 'Series'}
                    {formatSeasonDisplay(item) ? ` • ${formatSeasonDisplay(item)}` : ''}
                  </span>
                </div>

                {/* Bottom Badge: Rating */}
                {item.vote_average ? (
                  <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xl text-[10px] text-white border border-white/10 font-semibold shadow-sm flex items-center space-x-0.5">
                    <span className="text-amber-400">★</span>
                    <span>{item.vote_average}</span>
                  </div>
                ) : null}

                {/* Quick Action Floating Pills */}
                {!readonly && (
                  <div className="absolute top-2.5 right-2.5 flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem(item);
                      }}
                      className="p-1.5 rounded-full bg-black/60 hover:bg-white text-white hover:text-black backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-all duration-200 border border-white/10 shadow-sm cursor-pointer"
                      title="Change / Re-match"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.tmdb_id, item.media_type);
                      }}
                      className="p-1.5 rounded-full bg-black/60 hover:bg-red-500 text-white backdrop-blur-xl opacity-0 group-hover:opacity-100 transition-all duration-200 border border-white/10 shadow-sm cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Title & Metadata Details */}
              <div className="p-3 flex-1 flex flex-col justify-between space-y-1.5 bg-card">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate transition-colors">
                    {item.title}
                  </h4>
                  {item.genres && item.genres.length > 0 && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {item.genres.slice(0, 2).join(', ')}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-black/[0.04] dark:border-white/[0.06]">
                  <span className="flex items-center space-x-1 font-medium">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span>{item.release_year || '—'}</span>
                  </span>
                  <span className="font-semibold text-foreground/80 text-[11px]">
                    {formatSeasonDisplay(item)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ItemDetailModal
        item={selectedDetailItem ? (items.find((i) => i.tmdb_id === selectedDetailItem.tmdb_id && i.media_type === selectedDetailItem.media_type) || selectedDetailItem) : null}
        isOpen={Boolean(selectedDetailItem)}
        onClose={() => setSelectedDetailItem(null)}
        onOpenEditMatch={(item) => setEditingItem(item)}
        readonly={readonly}
      />

      {/* Re-match Edit Modal */}
      <EditMatchModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
      />
    </>
  );
};


