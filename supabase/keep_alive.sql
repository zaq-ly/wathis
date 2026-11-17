-- ============================================================
-- SUPABASE KEEP-ALIVE HEARTBEAT
-- Jalankan sekali di SQL Editor Supabase.
-- Dipanggil oleh .github/workflows/keep-alive.yml via RPC agar
-- ada aktivitas TULIS nyata ke Postgres (mencegah auto-pause Free Plan).
-- ============================================================

-- Tabel 1 baris saja (tidak tumbuh)
CREATE TABLE IF NOT EXISTS public.keep_alive (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    last_ping TIMESTAMPTZ NOT NULL DEFAULT now(),
    ping_count BIGINT NOT NULL DEFAULT 0
);

-- RLS aktif tanpa policy: tabel tidak bisa diakses langsung oleh anon,
-- hanya lewat fungsi SECURITY DEFINER di bawah.
ALTER TABLE public.keep_alive ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.ping_keep_alive()
RETURNS TIMESTAMPTZ
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    INSERT INTO public.keep_alive (id, last_ping, ping_count)
    VALUES (1, now(), 1)
    ON CONFLICT (id) DO UPDATE
        SET last_ping = now(),
            ping_count = public.keep_alive.ping_count + 1
    RETURNING last_ping;
$$;

REVOKE ALL ON FUNCTION public.ping_keep_alive() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ping_keep_alive() TO anon, authenticated;
