'use client';

import React from 'react';
import { WatchlistItem } from '@/types/watchlist';
import { useWatchlist } from '@/context/WatchlistContext';
import { getTMDBImageUrl } from '@/lib/utils';
import { Film, Tv, Trash2, Calendar, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface GridViewProps {
  items: WatchlistItem[];
  onOpenSearch: () => void;
}

export const GridView: React.FC<GridViewProps> = ({ items, onOpenSearch }) => {
  const { removeItem } = useWatchlist();

  if (items.length === 0) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
          <Film className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-mono uppercase font-bold text-zinc-300">Watchlist is Empty</h3>
        <p className="text-xs text-zinc-400 font-mono">
          Search movies or series using TMDB, or import your titles from Notion.
        </p>
        <button
          onClick={onOpenSearch}
          className="inline-flex items-center space-x-2 text-xs font-mono bg-zinc-100 hover:bg-white text-zinc-950 font-bold px-4 py-2 rounded-lg transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Add First Title</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map((item) => {
        const posterUrl = getTMDBImageUrl(item.poster_path, 'w500');

        return (
          <div
            key={`${item.media_type}-${item.tmdb_id}`}
            className="group relative bg-[#0f1013] border border-white/[0.08] rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:border-white/[0.25] flex flex-col"
          >
            {/* Poster Image */}
            <div className="relative aspect-[2/3] w-full bg-zinc-950 overflow-hidden">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 200px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600 font-mono-code text-xs">
                  NO POSTER
                </div>
              )}

              {/* Type Badge */}
              <div className="absolute top-2 left-2 flex items-center space-x-1">
                <span className="text-[10px] font-mono-code uppercase px-1.5 py-0.5 rounded shadow-sm border bg-black/70 text-zinc-300 border-white/[0.15] backdrop-blur-md">
                  {item.media_type === 'movie' ? 'Film' : `Series ${item.season_count ? `(${item.season_count}S)` : ''}`}
                </span>
              </div>

              {/* Delete Button (Hover) */}
              <button
                onClick={() => removeItem(item.tmdb_id, item.media_type)}
                className="absolute top-2 right-2 p-1.5 rounded bg-black/80 hover:bg-red-500 text-zinc-400 hover:text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all border border-white/[0.1]"
                title="Remove from Watchlist"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Info Section */}
            <div className="p-3 flex-1 flex flex-col justify-between space-y-1.5">
              <div>
                <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-white truncate">
                  {item.title}
                </h4>
                {item.genres && item.genres.length > 0 && (
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-mono-code">
                    {item.genres.slice(0, 2).join(', ')}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between text-[10px] font-mono-code text-zinc-500 border-t border-white/[0.06]">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-2.5 h-2.5" />
                  <span>{item.release_year || '—'}</span>
                </span>
                {item.media_type === 'tv' && item.season_count ? (
                  <span>{item.season_count} Seasons</span>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
