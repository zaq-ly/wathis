'use client';

import React, { useState } from 'react';
import { WatchlistItem } from '@/types/watchlist';
import { useWatchlist } from '@/context/WatchlistContext';
import { useLanguage } from '@/context/LanguageContext';
import { getTMDBImageUrl, formatSeasonDisplay, isAnimeItem } from '@/lib/utils';
import { Trash2, Calendar, Sparkles, ExternalLink, Clapperboard, Film, Tv, ArrowLeftRight, Play, Pin } from 'lucide-react';
import Image from 'next/image';
import { EditMatchModal } from './EditMatchModal';
import { ItemDetailModal } from './ItemDetailModal';

interface EditorialTableViewProps {
  items: WatchlistItem[];
  onOpenSearch: () => void;
  readonly?: boolean;
}

export const EditorialTableView: React.FC<EditorialTableViewProps> = ({
  items,
  onOpenSearch,
  readonly = false,
}) => {
  const { removeItem, togglePin, setSelectedGenre } = useWatchlist();
  const { t } = useLanguage();
  const [hoveredItem, setHoveredItem] = useState<WatchlistItem | null>(null);
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<WatchlistItem | null>(null);

  // Empty State (Apple Style)
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

  // Active item for the left side sticky cinema canvas
  const activePreview = hoveredItem || items[0] || null;
  const activeBackdropUrl = getTMDBImageUrl(activePreview?.backdrop_path, 'w1280');
  const activePosterUrl = getTMDBImageUrl(activePreview?.poster_path, 'w500');

  return (
    <div>
      {/* Mobile Apple Media Cards */}
      <div className="block lg:hidden space-y-2.5">
        {items.map((item, index) => {
          const posterUrl = getTMDBImageUrl(item.poster_path, 'w300');

          return (
            <div
              key={item.id || `${item.media_type}-${item.tmdb_id}-${index}`}
              onClick={() => setSelectedDetailItem(item)}
              className="p-3 bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:border-black/[0.12] dark:hover:border-white/[0.16] transition-all duration-200 cursor-pointer active:scale-[0.99]"
            >
              {/* Thumbnail + Info */}
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {/* Poster Artwork with Apple shadow */}
                <div className="relative w-12 h-16 bg-muted rounded-xl overflow-hidden shrink-0 shadow-sm border border-black/5 dark:border-white/10">
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={item.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground">
                      No Art
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-sm font-semibold text-foreground truncate flex items-center space-x-1.5">
                    {item.is_pinned && (
                      <Pin className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0" />
                    )}
                    <span className="truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-muted-foreground whitespace-nowrap overflow-hidden">
                    {isAnimeItem(item) ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-semibold shrink-0">
                        Anime{formatSeasonDisplay(item) ? ` • ${formatSeasonDisplay(item)}` : ''}
                      </span>
                    ) : item.media_type === 'movie' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[11px] font-semibold shrink-0">
                        Film{formatSeasonDisplay(item) ? ` • ${formatSeasonDisplay(item)}` : ''}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold shrink-0">
                        Series{formatSeasonDisplay(item) ? ` • ${formatSeasonDisplay(item)}` : ''}
                      </span>
                    )}

                    <span className="font-medium text-foreground/80 shrink-0">
                      {item.release_year || '—'}
                    </span>

                    {item.vote_average ? (
                      <span className="text-amber-500 dark:text-amber-400 font-semibold text-xs inline-flex items-center space-x-0.5 shrink-0">
                        <span>★</span>
                        <span>{Number(item.vote_average).toFixed(1)}</span>
                      </span>
                    ) : null}
                  </div>

                  {item.genres && item.genres.length > 0 && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      {item.genres.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {!readonly && (
                <div className="shrink-0 flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(item.tmdb_id, item.media_type);
                    }}
                    className={`p-2 rounded-full transition-colors cursor-pointer ${
                      item.is_pinned
                        ? 'text-amber-500 hover:text-amber-600 bg-amber-500/10'
                        : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
                    }`}
                    title={item.is_pinned ? t.unpinTitle : t.pinTitle}
                  >
                    <Pin className={`w-3.5 h-3.5 ${item.is_pinned ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.tmdb_id, item.media_type);
                    }}
                    className="p-2 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Apple TV+ Cinema Showcase + Media Table */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-start pt-2">
        {/* Left Column: Minimalist Cinema Showcase Stage */}
        <div className="lg:col-span-5 sticky top-20 self-start space-y-3 z-10">
          {/* Cinema Stage Card with rounded-3xl */}
          <div
            onClick={() => activePreview && setSelectedDetailItem(activePreview)}
            className="relative aspect-[16/10] bg-card rounded-3xl overflow-hidden border border-black/[0.06] dark:border-white/[0.1] shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer"
          >
            {activeBackdropUrl ? (
              <Image
                key={`backdrop-${activePreview.media_type}-${activePreview.tmdb_id}`}
                src={activeBackdropUrl}
                alt={activePreview.title}
                fill
                priority
                sizes="(max-width: 1200px) 45vw, 560px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : activePosterUrl ? (
              <Image
                key={`poster-${activePreview.media_type}-${activePreview.tmdb_id}`}
                src={activePosterUrl}
                alt={activePreview.title}
                fill
                priority
                sizes="(max-width: 1200px) 45vw, 560px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs font-medium">
                No Preview Artwork
              </div>
            )}

            {/* Apple TV+ Gradient Masks */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

            {/* Top Bar: TMDB Link (Left) & Rating/Year (Right) */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <a
                href={`https://www.themoviedb.org/${activePreview.media_type}/${activePreview.tmdb_id}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1 rounded-full bg-black/60 hover:bg-white text-zinc-200 hover:text-black backdrop-blur-xl transition-all duration-200 text-xs font-medium border border-white/15 shadow-sm flex items-center space-x-1 cursor-pointer"
                title="View on TMDB"
              >
                <span>TMDB Details</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex items-center space-x-1.5">
                {activePreview.vote_average ? (
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xl text-amber-400 text-xs font-semibold border border-white/15 shadow-sm flex items-center space-x-1">
                    <span>★</span>
                    <span className="text-white">{Number(activePreview.vote_average).toFixed(1)}</span>
                  </span>
                ) : null}

                {activePreview.release_year && (
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl text-white text-xs font-medium border border-white/15 shadow-sm">
                    {activePreview.release_year}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Info: Season, Title & Synopsis */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 space-y-1.5">
              {/* Season / Format Badge */}
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl text-white font-semibold text-xs border border-white/15 flex items-center space-x-1.5 shadow-sm">
                  {isAnimeItem(activePreview) ? (
                    <Sparkles className="w-3 h-3 text-rose-400" />
                  ) : activePreview.media_type === 'movie' ? (
                    <Film className="w-3 h-3 text-sky-400" />
                  ) : (
                    <Tv className="w-3 h-3 text-indigo-400" />
                  )}
                  <span>
                    {isAnimeItem(activePreview) ? 'Anime' : activePreview.media_type === 'movie' ? 'Film' : 'Series'}
                    {formatSeasonDisplay(activePreview) ? ` • ${formatSeasonDisplay(activePreview)}` : ''}
                  </span>
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white line-clamp-1 drop-shadow-md">
                {activePreview.title}
              </h2>

              {/* Synopsis directly on card */}
              {activePreview.overview && (
                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 sm:line-clamp-3 pt-0.5 drop-shadow-sm">
                  {activePreview.overview}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Media Table with Fixed Viewport Height */}
        <div className="lg:col-span-7">
          <div className="border border-black/[0.06] dark:border-white/[0.08] rounded-3xl overflow-hidden bg-card shadow-sm flex flex-col max-h-[calc(100vh-190px)] min-h-[480px]">
            {/* Sticky Table Header */}
            <div className="grid grid-cols-12 gap-x-2 items-center px-6 py-3.5 bg-black/[0.02] dark:bg-white/[0.03] border-b border-black/[0.04] dark:border-white/[0.06] text-xs font-semibold text-muted-foreground tracking-tight select-none shrink-0 z-10">
              <div className="col-span-1">{t.tableNo}</div>
              <div className="col-span-3">{t.tableTitle}</div>
              <div className="col-span-2">{t.tableType}</div>
              <div className="col-span-2">{t.seasons}</div>
              <div className="col-span-2">{t.tableYear}</div>
              <div className="col-span-2 text-right pr-20">{t.tableRating}</div>
            </div>

            {/* Smooth Scrollable Table Rows */}
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05] overflow-y-auto flex-1">
              {items.map((item, index) => {
                const isCurrentHover =
                  hoveredItem?.tmdb_id === item.tmdb_id && hoveredItem?.media_type === item.media_type;

                return (
                  <div
                    key={item.id || `${item.media_type}-${item.tmdb_id}-${index}`}
                    onMouseEnter={() => setHoveredItem(item)}
                    onClick={() => setSelectedDetailItem(item)}
                    className={`grid grid-cols-12 gap-x-2 items-center px-6 py-3.5 cursor-pointer transition-all duration-200 group ${
                      isCurrentHover
                        ? 'bg-blue-500/[0.08] dark:bg-blue-500/[0.12]'
                        : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* Index */}
                    <div className="col-span-1 text-xs text-muted-foreground font-medium group-hover:text-foreground">
                      {index + 1}
                    </div>

                    {/* Title & Genres */}
                    <div className="col-span-3 min-w-0 pr-3">
                      <div className="text-xs sm:text-sm font-semibold text-card-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate transition-colors flex items-center space-x-1.5">
                        {item.is_pinned && (
                          <Pin className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0" />
                        )}
                        <span className="truncate">{item.title}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {item.genres && item.genres.length > 0
                          ? item.genres.slice(0, 3).join(', ')
                          : 'Cinema Archive'}
                      </div>
                    </div>

                    {/* Type */}
                    <div className="col-span-2 flex items-center">
                      {isAnimeItem(item) ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-semibold">
                          Anime
                        </span>
                      ) : item.media_type === 'movie' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[11px] font-semibold">
                          Film
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold">
                          Series
                        </span>
                      )}
                    </div>

                    {/* Season */}
                    <div className="col-span-2 flex items-center">
                      {formatSeasonDisplay(item) ? (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          isAnimeItem(item)
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : item.media_type === 'movie'
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {formatSeasonDisplay(item)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </div>

                    {/* Year */}
                    <div className="col-span-2 text-xs text-muted-foreground group-hover:text-foreground font-medium">
                      {item.release_year || '—'}
                    </div>

                    {/* Rating & Action Buttons */}
                    <div className="col-span-2 flex items-center justify-end relative">
                      <div className="text-xs font-semibold text-foreground/90 flex items-center space-x-1 pr-20">
                        {item.vote_average ? (
                          <>
                            <span className="text-amber-500 dark:text-amber-400 text-xs">★</span>
                            <span>{Number(item.vote_average).toFixed(1)}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-xs font-normal">—</span>
                        )}
                      </div>

                      {!readonly && (
                        <div className="absolute right-0 opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-all">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(item.tmdb_id, item.media_type);
                            }}
                            className={`p-1.5 rounded-full transition-all cursor-pointer ${
                              item.is_pinned
                                ? 'text-amber-500 hover:text-amber-600 bg-amber-500/10'
                                : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
                            }`}
                            title={item.is_pinned ? t.unpinTitle : t.pinTitle}
                          >
                            <Pin className={`w-3.5 h-3.5 ${item.is_pinned ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(item.tmdb_id, item.media_type);
                            }}
                            className="p-1.5 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedDetailItem ? (items.find((i) => i.tmdb_id === selectedDetailItem.tmdb_id && i.media_type === selectedDetailItem.media_type) || selectedDetailItem) : null}
        isOpen={Boolean(selectedDetailItem)}
        onClose={() => setSelectedDetailItem(null)}
        onOpenEditMatch={(item) => setEditingItem(item)}
        readonly={readonly}
      />

      {/* Edit / Re-match Modal */}
      <EditMatchModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
      />
    </div>
  );
};


