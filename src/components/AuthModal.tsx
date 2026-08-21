'use client';

import React, { useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabaseConfigured = isSupabaseConfigured();
  const supabase = createClient();

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm bg-[#0f1013] border border-white/[0.1] rounded-lg shadow-2xl overflow-hidden p-5 sm:p-6 relative font-mono-code"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6 text-center">
          <h2 className="text-base font-bold text-white uppercase tracking-tight">
            Sign In with Google
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Sync your wathis across devices with your Google account.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-[11px]">{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Primary Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-zinc-200 text-zinc-950 font-bold py-3 px-4 rounded text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center space-x-3 shadow-md active:scale-98"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <p className="text-[10px] text-zinc-500 text-center pt-2 leading-relaxed">
            Data is strictly private & isolated using Supabase PostgreSQL Row Level Security.
          </p>
        </div>
      </div>
    </div>
  );
};
