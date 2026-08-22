'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from '@/context/ThemeContext';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'system', label: 'System', icon: <Monitor className="w-3.5 h-3.5" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
    { value: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] border border-black/[0.04] dark:border-white/[0.06] transition-all flex items-center justify-center cursor-pointer apple-btn-active"
        title={`Theme: ${theme}`}
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-36 bg-card border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {opt.icon}
                  <span className="font-medium">{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

