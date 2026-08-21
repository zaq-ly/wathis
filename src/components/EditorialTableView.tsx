'use client';

import React, { useState } from 'react';
import { WatchlistItem } from '@/types/watchlist';
import { useWatchlist } from '@/context/WatchlistContext';
import { getTMDBImageUrl } from '@/lib/utils';
import { Film, Tv, Trash2, Calendar, Sparkles, ExternalLink, Clapperboard } from 'lucide-react';
import Image from 'next/image';

interface EditorialTableViewProps {
  items: WatchlistItem[];
  onOpenSearch: () => void;
}

export const EditorialTableView: React.FC<EditorialTableViewProps> = ({ items, onOpenSearch }) => {
  const [hoveredItem, setHoveredItem] = useState<WatchlistItem | null>(items[0] || null);
  const { removeItem } = useWatchlist();

  if (items.length === 0) {
    return (
      <div className="py-28 text-center space-y-5 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-zinc-900/80 border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-500">
          <Clapperboard className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-mono-code uppercase font-bold text-zinc-200">Catalogue is Empty</h3>
          <p className="text-xs text-zinc-500 font-mono-code">
            Record your completed movies and series from TMDB, or migrate from Notion.
          </p>
        </div>
        <button
          onClick={onOpenSearch}
          className="inline-flex items-center space-x-2 text-xs font-mono-code bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-4 py-2.5 rounded transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Add First Title</span>
        </button>
      </div>
    );
  }

  const activePreview = hoveredItem || items[0];
  const activeBackdropUrl = getTMDBImageUrl(activePreview?.backdrop_path || activePreview?.poster_path, 'w1280');
  const activePosterUrl = getTMDBImageUrl(activePreview?.poster_path, 'w500');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
      {/* Left Column: Sticky Editorial Preview Canvas (Satoshi Watanabe Inspired) */}
      <div className="hidden lg:block lg:col-span-5 sticky top-28 space-y-4">
        <div className="relative aspect-[16/10] bg-zinc-950 rounded-lg overflow-hidden border border-white/[0.08] shadow-2xl transition-all duration-300 group">
          {activeBackdropUrl ? (
            <Image
              key={`${activePreview.media_type}-${activePreview.tmdb_id}`}
              src={activeBackdropUrl}
              alt={activePreview.title}
              fill
              priority
              sizes="(max-width: 1200px) 45vw, 520px"
              className="object-cover transition-opacity duration-300 filter brightness-95 contrast-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 font-mono-code text-xs">
              NO PREVIEW IMAGE
            </div>
          )}

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent pointer-events-none" />

          {/* Overlay Info */}
          <div className="absolute bottom-4 left-4 right-4 text-white space-y-2">
            <div className="flex items-center justify-between font-mono-code text-[11px]">
              <div className="flex items-center space-x-2">
                <span className="uppercase px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/[0.15] text-zinc-300 text-[10px]">
                  {activePreview.media_type === 'movie' ? 'Film' : `Series ${activePreview.season_count ? `• ${activePreview.season_count} Seasons` : ''}`}
                </span>
                {activePreview.release_year && (
                  <span className="flex items-center space-x-1 text-zinc-400">
                    <Calendar className="w-3 h-3" />
                    <span>{activePreview.release_year}</span>
                  </span>
                )}
              </div>

              <a
                href={`https://www.themoviedb.org/${activePreview.media_type}/${activePreview.tmdb_id}`}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded bg-black/60 hover:bg-white hover:text-black text-zinc-400 transition-colors border border-white/[0.1]"
                title="View on TMDB"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <h2 className="text-base font-semibold tracking-tight text-white line-clamp-1">
              {activePreview.title}
            </h2>

            {activePreview.genres && activePreview.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {activePreview.genres.map((g) => (
                  <span
                    key={g}
                    className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-white/[0.08] text-zinc-300 backdrop-blur-sm"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Synopsis & Meta Snippet */}
        {activePreview.overview ? (
          <div className="p-4 rounded-lg bg-zinc-950/60 border border-white/[0.06] space-y-2">
            <div className="text-[10px] font-mono-code uppercase text-zinc-500 tracking-wider">Synopsis</div>
            <p className="text-xs text-zinc-400 font-mono-code leading-relaxed line-clamp-3">
              {activePreview.overview}
            </p>
          </div>
        ) : null}
      </div>

      {/* Right Column: Editorial Catalogue Table */}
      <div className="col-span-1 lg:col-span-7">
        <div className="border border-white/[0.08] rounded-lg overflow-hidden bg-zinc-950/60 shadow-2xl">
          {/* Satoshi Watanabe inspired table header with short codes */}
          <div className="grid grid-cols-12 px-4 py-3 bg-zinc-900/90 border-b border-white/[0.08] text-[11px] font-mono-code text-zinc-500 uppercase tracking-widest select-none">
            <div className="col-span-1">No.</div>
            <div className="col-span-6 sm:col-span-6">Title</div>
            <div className="hidden sm:block sm:col-span-2">Type / S.</div>
            <div className="col-span-3 sm:col-span-2 text-right sm:text-left">Year</div>
            <div className="col-span-2 sm:col-span-1 text-right">Action</div>
          </div>

          {/* Table Items */}
          <div className="divide-y divide-white/[0.04]">
            {items.map((item, index) => {
              const isCurrentHover = hoveredItem?.tmdb_id === item.tmdb_id && hoveredItem?.media_type === item.media_type;

              return (
                <div
                  key={`${item.media_type}-${item.tmdb_id}`}
                  onMouseEnter={() => setHoveredItem(item)}
                  className={`grid grid-cols-12 items-center px-4 py-3.5 cursor-pointer transition-all editorial-row group ${
                    isCurrentHover ? 'is-active' : ''
                  }`}
                >
                  {/* Formatted Number 000, 001, 002 */}
                  <div className="col-span-1 text-xs font-mono-code text-zinc-500 group-hover:text-zinc-300">
                    {String(index).padStart(3, '0')}
                  </div>

                  {/* Title & Genre */}
                  <div className="col-span-6 sm:col-span-6 min-w-0 pr-2">
                    <div className="text-xs sm:text-sm font-semibold tracking-normal text-zinc-100 group-hover:text-white truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate mt-0.5 font-mono-code">
                      {item.genres && item.genres.length > 0 ? item.genres.slice(0, 3).join(', ') : 'TMDB Verified'}
                    </div>
                  </div>

                  {/* Type / Season Tag */}
                  <div className="hidden sm:flex sm:col-span-2 items-center text-xs font-mono-code">
                    {item.media_type === 'movie' ? (
                      <span className="flex items-center space-x-1 text-zinc-400 text-[11px]">
                        <Film className="w-3 h-3 text-zinc-500" />
                        <span>Film</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-zinc-300 text-[11px]">
                        <Tv className="w-3 h-3 text-zinc-500" />
                        <span>{item.season_count ? `${item.season_count}S` : 'Series'}</span>
                      </span>
                    )}
                  </div>

                  {/* Release Year */}
                  <div className="col-span-3 sm:col-span-2 text-right sm:text-left text-xs font-mono-code text-zinc-400">
                    {item.release_year || '—'}
                  </div>

                  {/* Action Column */}
                  <div className="col-span-2 sm:col-span-1 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.tmdb_id, item.media_type);
                      }}
                      className="p-1.5 text-zinc-600 hover:text-red-400 rounded transition-colors opacity-60 group-hover:opacity-100"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
