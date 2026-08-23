'use client';

import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { WatchlistProvider } from '@/context/WatchlistContext';
import { SplashScreen } from '@/components/SplashScreen';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <WatchlistProvider>
          <SplashScreen />
          {children}
        </WatchlistProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
