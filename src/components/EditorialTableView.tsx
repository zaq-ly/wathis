'use client';

import React, { useState } from 'react';
import { WatchlistItem } from '@/types/watchlist';
import { useWatchlist } from '@/context/WatchlistContext';
import { getTMDBImageUrl } from '@/lib/utils';
import { Trash2, Calendar, Sparkles, ExternalLink, Clapperboard, Film, Tv, ArrowLeftRight, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { EditMatchModal } from './EditMatchModal';

interface EditorialTableViewProps {
  items: WatchlistItem[];
  onOpenSearch: () => void;
}

export const EditorialTableView: React.FC<EditorialTableViewProps> = ({ items, onOpenSearch }) => {
  const [hoveredItem, setHoveredItem] = useState<WatchlistItem | null>(items[0] || null);
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);
  const { removeItem, setSelectedGenre, syncCloudToSupabase, user } = useWatchlist();

  if (items.length === 0) {
    return (
      <div className="py-32 text-center space-y-4 max-w-sm mx-auto">
        <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto text-zinc-600">
          <Clapperboard className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-mono-code uppercase font-semibold text-zinc-300 tracking-wider">
            Catalogue is Empty
          </h3>
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            Your personal account watchlist is empty. Add titles manually or import the curated 240+ title archive.
          </p>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={onOpenSearch}
            className="inline-flex items-center space-x-2 text-xs font-mono-code bg-white hover:bg-zinc-200 text-zinc-950 font-bold px-3.5 py-2 rounded transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Add Title</span>
          </button>
          {user && (
            <button
              onClick={() => syncCloudToSupabase()}
              className="inline-flex items-center space-x-2 text-xs font-mono-code bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.1] px-3.5 py-2 rounded transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Archive</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const activePreview = hoveredItem || items[0];
  const activeBackdropUrl = getTMDBImageUrl(activePreview?.backdrop_path || activePreview?.poster_path, 'w1280');
  const activePosterUrl = getTMDBImageUrl(activePreview?.poster_path, 'w500');

  return (
    <div>
      {/* Mobile Rich List View (Clean Cinema Catalogue Cards) */}
      <div className="block lg:hidden space-y-2">
        {items.map((item, index) => {
          const posterUrl = getTMDBImageUrl(item.poster_path, 'w300');

          return (
            <div
              key={item.id || `${item.media_type}-${item.tmdb_id}-${index}`}
              className="p-2.5 bg-[#0c0d10] border border-white/[0.06] rounded-xl flex items-center justify-between gap-3 hover:border-white/[0.15] transition-all"
            >
              {/* Thumbnail + Info */}
              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                {/* Index */}
                <span className="text-[10px] font-mono-code text-zinc-600 shrink-0 w-5">
                  {String(index + 1).padStart(2, '0')}
                </span>

                {/* Mini Poster */}
                <div className="relative w-11 h-16 bg-zinc-900 rounded-md overflow-hidden shrink-0 border border-white/[0.08] shadow-sm">
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={item.title}
                      fill
                      sizes="44px"
                      className="object-cover filter brightness-95"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-600 font-mono-code">
                      NO IMG
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="text-xs font-semibold text-white truncate tracking-tight">
                    {item.title}
                  </div>

                  <div className="flex items-center space-x-1.5 text-[10px] font-mono-code text-zinc-400">
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-300 font-medium">
                      {item.release_year || '—'}
                    </span>
                    <span>•</span>
                    <span className="text-zinc-300 font-medium">
                      {item.media_type === 'movie'
                        ? item.season_label ? `Film (${item.season_label})` : 'Film'
                        : item.season_label || (item.season_count ? `${item.season_count}S` : 'Series')}
                    </span>
                  </div>

                  {item.genres && item.genres.length > 0 && (
                    <div className="text-[10px] text-zinc-500 font-mono-code truncate">
                      {item.genres.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="shrink-0 flex items-center space-x-1">
                <button
                  onClick={() => setEditingItem(item)}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                  title="Change / Re-match Film or Series"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
                <a
                  href={`https://www.themoviedb.org/${item.media_type}/${item.tmdb_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                  title="View on TMDB"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => removeItem(item.tmdb_id, item.media_type)}
                  className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                  title="Remove from wathis"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Editorial Canvas + Table (Hidden on Mobile) */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-start pt-3">
        {/* Left Column: Sticky Editorial Preview Canvas (Satoshi Watanabe Inspired) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          {/* Canvas Card */}
          <div className="relative aspect-[16/10] bg-[#0c0d10] rounded-lg overflow-hidden border border-white/[0.06] shadow-2xl transition-all duration-300 group">
            {activeBackdropUrl ? (
              <Image
                key={`${activePreview.media_type}-${activePreview.tmdb_id}`}
                src={activeBackdropUrl}
                alt={activePreview.title}
                fill
                priority
                sizes="(max-width: 1200px) 45vw, 520px"
                className="object-cover transition-opacity duration-300 filter brightness-90 contrast-105"
              />
            ) : activePosterUrl ? (
              <Image
                key={`${activePreview.media_type}-${activePreview.tmdb_id}`}
                src={activePosterUrl}
                alt={activePreview.title}
                fill
                priority
                sizes="(max-width: 1200px) 45vw, 520px"
                className="object-cover transition-opacity duration-300 filter brightness-90"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#09090b] text-zinc-700 font-mono-code text-[11px] uppercase tracking-widest">
                No Preview Image
              </div>
            )}

            {/* Minimal cinematic gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/40 to-transparent" />

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-[10px] font-mono-code text-zinc-400">
                  <span className="px-1.5 py-0.5 rounded bg-white/[0.1] text-zinc-200 uppercase font-medium">
                    {activePreview.media_type === 'movie'
                      ? activePreview.season_label ? `Film • ${activePreview.season_label}` : 'Film'
                      : activePreview.season_label || (activePreview.season_count ? `${activePreview.season_count} Seasons` : 'Series')}
                  </span>
                  {activePreview.release_year && (
                    <span className="flex items-center space-x-1 text-zinc-400">
                      <Calendar className="w-3 h-3" />
                      <span>{activePreview.release_year}</span>
                    </span>
                  )}
                  {activePreview.vote_average ? (
                    <span className="text-amber-400 font-medium">
                      ★ {activePreview.vote_average}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setEditingItem(activePreview)}
                    className="px-2 py-1 rounded bg-black/70 hover:bg-white hover:text-black text-zinc-300 transition-colors border border-white/[0.15] text-[10px] font-mono-code flex items-center space-x-1 shadow-sm"
                    title="Change / Re-match Film or Series"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>Re-match</span>
                  </button>

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
              </div>

              <h2 className="text-base font-semibold tracking-tight text-white line-clamp-1">
                {activePreview.title}
              </h2>

              {activePreview.genres && activePreview.genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {activePreview.genres.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGenre(g)}
                      className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-white/[0.08] hover:bg-white hover:text-zinc-950 text-zinc-300 backdrop-blur-sm transition-colors cursor-pointer"
                      title={`Filter by ${g}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Synopsis snippet */}
          {activePreview.overview && (
            <div className="p-3.5 rounded-lg bg-[#0c0d10] border border-white/[0.04] space-y-1.5">
              <div className="text-[10px] font-mono-code uppercase text-zinc-600 tracking-wider">
                Synopsis
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                {activePreview.overview}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Editorial Catalogue Table */}
        <div className="lg:col-span-7">
          <div className="border border-white/[0.06] rounded-lg overflow-hidden bg-[#0c0d10]/40">
            {/* Table Header */}
            <div className="grid grid-cols-12 px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06] text-[10px] font-mono-code text-zinc-600 uppercase tracking-wider select-none">
              <div className="col-span-1">No.</div>
              <div className="col-span-6">Title</div>
              <div className="col-span-2">Format / Season</div>
              <div className="col-span-2">Year</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-white/[0.03]">
              {items.map((item, index) => {
                const isCurrentHover =
                  hoveredItem?.tmdb_id === item.tmdb_id && hoveredItem?.media_type === item.media_type;

                return (
                  <div
                    key={item.id || `${item.media_type}-${item.tmdb_id}-${index}`}
                    onMouseEnter={() => setHoveredItem(item)}
                    className={`grid grid-cols-12 items-center px-4 py-3 cursor-pointer transition-all editorial-row group ${
                      isCurrentHover ? 'is-active' : ''
                    }`}
                  >
                    {/* Formatted Number 000, 001, 002 */}
                    <div className="col-span-1 text-xs font-mono-code text-zinc-600 group-hover:text-zinc-300">
                      {String(index + 1).padStart(3, '0')}
                    </div>

                    {/* Title & Genre */}
                    <div className="col-span-6 min-w-0 pr-2">
                      <div className="text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-white truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-zinc-600 truncate mt-0.5 font-mono-code">
                        {item.genres && item.genres.length > 0
                          ? item.genres.slice(0, 3).join(', ')
                          : 'TMDB Verified'}
                      </div>
                    </div>

                    {/* Type / Season Tag */}
                    <div className="col-span-2 flex items-center text-xs font-mono-code">
                      {item.media_type === 'movie' ? (
                        <span className="flex items-center space-x-1 text-zinc-400 text-[11px]">
                          <Film className="w-3 h-3 text-zinc-500" />
                          <span>{item.season_label || 'Film'}</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-zinc-300 font-medium text-[11px]">
                          <Tv className="w-3 h-3 text-zinc-400" />
                          <span>{item.season_label || (item.season_count ? `${item.season_count}S` : 'Series')}</span>
                        </span>
                      )}
                    </div>

                    {/* Release Year */}
                    <div className="col-span-2 text-xs font-mono-code text-zinc-500 group-hover:text-zinc-300">
                      {item.release_year || '—'}
                    </div>

                    {/* Action Buttons: Re-match and Remove */}
                    <div className="col-span-1 flex items-center justify-end space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(item);
                        }}
                        className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-white/[0.08] opacity-0 group-hover:opacity-100 transition-all"
                        title="Change / Re-match"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.tmdb_id, item.media_type);
                        }}
                        className="p-1.5 rounded text-zinc-600 hover:text-red-400 hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove from wathis"
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

      {/* Edit / Re-match Modal */}
      <EditMatchModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
      />
    </div>
  );
};

