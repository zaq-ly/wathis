'use client';

import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { WatchlistProvider } from '@/context/WatchlistContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <WatchlistProvider>{children}</WatchlistProvider>
    </ThemeProvider>
  );
}
