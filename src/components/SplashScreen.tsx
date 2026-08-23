'use client';

import React, { useState, useEffect } from 'react';

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Fade out after 1.2s
    const timerExit = setTimeout(() => {
      setIsClosing(true);
    }, 1200);

    // Remove from DOM after 1.6s
    const timerUnmount = setTimeout(() => {
      setShouldRender(false);
    }, 1600);

    return () => {
      clearTimeout(timerExit);
      clearTimeout(timerUnmount);
    };
  }, []);

  if (!shouldRender || !mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isClosing ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient Radial Aura Glow */}
      <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-blue-500/15 via-indigo-500/10 to-transparent blur-3xl pointer-events-none animate-pulse" />

      {/* Main Container */}
      <div className="relative flex flex-col items-center z-10">
        {/* App Icon */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-xl animate-in zoom-in-75 duration-700 ease-out">
          <img
            src="/logo_zoomed.jpg"
            alt="wathis logo"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Brand Title */}
        <div className="mt-4 flex items-baseline animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150 fill-mode-both">
          <span className="font-semibold text-2xl sm:text-3xl tracking-tight text-foreground">
            wathis<span className="text-zinc-400">.</span>
          </span>
        </div>

        {/* Apple-style Hairline Progress Bar */}
        <div className="w-24 sm:w-28 h-[2.5px] bg-black/5 dark:bg-white/10 rounded-full overflow-hidden mt-5 animate-in fade-in duration-700 delay-300 fill-mode-both">
          <div className="h-full w-full bg-foreground/80 dark:bg-foreground rounded-full animate-splash-bar" />
        </div>
      </div>
    </div>
  );
}
