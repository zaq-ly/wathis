'use client';

import React, { useState } from 'react';
import { WatchlistItem } from '@/types/watchlist';
import { useWatchlist } from '@/context/WatchlistContext';
import { getTMDBImageUrl } from '@/lib/utils';
import { Trash2, Calendar, Sparkles, Clapperboard, ArrowLeftRight } from 'lucide-react';
import Image from 'next/image';
import { EditMatchModal } from './EditMatchModal';

interface GridViewProps {
  items: WatchlistItem[];
  onOpenSearch: () => void;
}

export const GridView: React.FC<GridViewProps> = ({ items, onOpenSearch }) => {
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);
  const { removeItem } = useWatchlist();

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
            Watchlist akun Anda masih kosong. Cari & tambahkan film/series lewat tombol di bawah atau gunakan fitur import.
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
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4 pt-2 sm:pt-3">
        {items.map((item, index) => {
          const posterUrl = getTMDBImageUrl(item.poster_path, 'w500');

          return (
            <div
              key={item.id || `${item.media_type}-${item.tmdb_id}-${index}`}
              className="group relative flex flex-col bg-[#0c0d10] border border-white/[0.06] hover:border-white/[0.2] rounded-lg overflow-hidden transition-all duration-300"
            >
              {/* Poster Thumbnail */}
              <div className="relative aspect-[2/3] bg-[#08080a] overflow-hidden">
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-[#09090b] text-zinc-600">
                    <span className="text-[10px] font-mono-code uppercase">No Poster</span>
                  </div>
                )}

                {/* Type & Season Badge */}
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[9px] font-mono-code uppercase text-zinc-200 border border-white/[0.1] font-medium">
                  {item.media_type === 'movie'
                    ? item.season_label || 'Film'
                    : item.season_label || (item.season_count ? `${item.season_count}S` : 'Series')}
                </div>

                {/* Rating Badge */}
                {item.vote_average ? (
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[9px] font-mono-code text-amber-400 border border-amber-400/20 font-medium">
                    ★ {item.vote_average}
                  </div>
                ) : null}

                {/* Action Buttons on Hover / Touch */}
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(item);
                    }}
                    className="p-1.5 rounded bg-black/80 hover:bg-white hover:text-zinc-950 text-zinc-300 backdrop-blur-sm opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-all border border-white/[0.1]"
                    title="Change / Re-match"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.tmdb_id, item.media_type);
                    }}
                    className="p-1.5 rounded bg-black/80 hover:bg-red-500 text-zinc-400 hover:text-white backdrop-blur-sm opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-all border border-white/[0.1]"
                    title="Remove from wathis"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Info Section */}
              <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between space-y-1 bg-[#0c0d10]">
                <div>
                  <h4 className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                    {item.title}
                  </h4>
                  {item.genres && item.genres.length > 0 && (
                    <p className="text-[10px] text-zinc-600 truncate font-mono-code">
                      {item.genres.slice(0, 2).join(', ')}
                    </p>
                  )}
                </div>

                <div className="pt-1.5 flex items-center justify-between text-[10px] font-mono-code text-zinc-400 border-t border-white/[0.04]">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-2.5 h-2.5 text-zinc-500" />
                    <span>{item.release_year || '—'}</span>
                  </span>
                  <span className="text-zinc-300 font-medium">
                    {item.season_label || (item.media_type === 'tv' && item.season_count ? `${item.season_count}S` : '')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Re-match Edit Modal */}
      <EditMatchModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
      />
    </>
  );
};
