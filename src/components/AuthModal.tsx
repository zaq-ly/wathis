'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { X, Loader2, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (notification?: any) => void;
        };
      };
    };
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gisLoaded, setGisLoaded] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const supabaseConfigured = isSupabaseConfigured();
  const supabase = createClient();
  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '93881926588-di7t1c3bqnt15d1rll5kvim5nuc5hn0k.apps.googleusercontent.com';

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });
        if (error) throw error;
        onClose();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Google sign-in failed';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    // Pastikan script GIS termuat
    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    let retryCount = 0;
    const maxRetries = 50;

    const initGis = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const isDark = document.documentElement.classList.contains('dark');
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: isDark ? 'filled_black' : 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 320,
          logo_alignment: 'left',
        });
        setGisLoaded(true);
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(initGis, 100);
      }
    };

    initGis();
  }, [isOpen, googleClientId, handleCredentialResponse]);

  if (!isOpen) return null;

  const handleFallbackGoogleSignIn = async () => {
    setErrorMessage(null);
    if (!supabaseConfigured) {
      setErrorMessage('Supabase is not configured yet in .env.local.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/[0.06] dark:bg-black/20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card border border-black/10 dark:border-white/10 rounded-[2rem] shadow-xl p-8 sm:p-10 relative transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl overflow-hidden flex items-center justify-center shadow-sm border border-black/10 dark:border-white/10">
            <img src="/logo_zoomed.jpg" alt="wathis logo" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            Welcome to wathis.
          </h2>
          <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed max-w-[260px] mx-auto">
            Securely synchronize and manage your personal cinema archive across all devices.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-[11px]">{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3 flex flex-col items-center">
          {isLoading && (
            <div className="flex items-center justify-center py-2 space-x-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menghubungkan akun Google...</span>
            </div>
          )}

          {/* Official Google Identity Button (Origin Domain) */}
          <div
            ref={googleBtnRef}
            className={`min-h-[44px] flex items-center justify-center transition-all ${
              isLoading ? 'opacity-50 pointer-events-none' : ''
            } ${!gisLoaded && googleClientId ? 'hidden' : ''}`}
          />

          {/* Fallback Button jika GIS belum termuat atau Client ID belum disetel */}
          {(!gisLoaded || !googleClientId) && !isLoading && (
            <button
              type="button"
              onClick={handleFallbackGoogleSignIn}
              disabled={isLoading}
              className="w-full max-w-[320px] bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-100 font-semibold py-3 px-4 rounded-full text-xs transition-all disabled:opacity-50 flex items-center justify-center space-x-2.5 shadow-sm border border-zinc-200 dark:border-zinc-700 active:scale-98 cursor-pointer apple-btn-active"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-black/[0.04] dark:border-white/[0.08]">
          <p className="text-[10px] text-center text-muted-foreground/80 leading-relaxed">
            By continuing, you acknowledge that your data is protected by enterprise-grade <br className="hidden sm:block" /> Row Level Security (RLS) on our servers.
          </p>
        </div>
      </div>
    </div>
  );
};
