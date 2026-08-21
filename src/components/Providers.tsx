'use client';

import React from 'react';
import { WatchlistProvider } from '@/context/WatchlistContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <WatchlistProvider>{children}</WatchlistProvider>;
}
