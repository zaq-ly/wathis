-- ============================================================
-- SUPABASE SCHEMA: WATCHLIST APP
-- ============================================================

-- 1. Create table for user watchlist items
CREATE TABLE IF NOT EXISTS public.watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    original_title TEXT,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
    release_year INTEGER,
    release_date TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    genres TEXT[] NOT NULL DEFAULT '{}',
    season_count INTEGER,
    season_label TEXT,
    overview TEXT,
    vote_average NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraint: 1 user cannot duplicate same movie/tv in their list
    CONSTRAINT unique_user_media UNIQUE (user_id, tmdb_id, media_type)
);

-- Migration helpers if table already exists:
ALTER TABLE public.watchlist_items ADD COLUMN IF NOT EXISTS season_label TEXT;
ALTER TABLE public.watchlist_items ADD COLUMN IF NOT EXISTS vote_average NUMERIC;
ALTER TABLE public.watchlist_items ADD COLUMN IF NOT EXISTS release_date TEXT;
ALTER TABLE public.watchlist_items ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow public viewing so shared watchlist links (/share/[userId]) work
CREATE POLICY "Public can view watchlist items"
    ON public.watchlist_items
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert into their own watchlist"
    ON public.watchlist_items
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist items"
    ON public.watchlist_items
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist items"
    ON public.watchlist_items
    FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Indexes for fast retrieval and sorting
CREATE INDEX IF NOT EXISTS idx_watchlist_user_created ON public.watchlist_items (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlist_media_type ON public.watchlist_items (user_id, media_type);
CREATE INDEX IF NOT EXISTS idx_watchlist_tmdb_id ON public.watchlist_items (tmdb_id);
