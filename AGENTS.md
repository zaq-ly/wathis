# AGENTS.md

Panduan ringkas arsitektur dan konvensi codebase untuk AI agent dan developer.

---

## 1. Ringkasan Project

**wathis.** adalah aplikasi web arsip sinema personal untuk mencatat, mengelola, dan menyinkronkan riwayat tontonan Film, Serial TV, dan Anime secara aman dengan tampilan elegan (*Apple-esque glassmorphism*) berbasis integrasi TMDB dan Supabase.

---

## 2. Tech Stack

- **Framework:** Next.js 15.2 (App Router, Turbopack)
- **Library UI:** React 19, Lucide React (ikon)
- **Bahasa:** TypeScript 5.8
- **Styling:** Tailwind CSS v3.4, PostCSS, `clsx`, `tailwind-merge`
- **Database & Auth:** Supabase (`@supabase/supabase-js` v2.49, `@supabase/ssr` v0.5.2) — PostgreSQL + Row Level Security (RLS) + OAuth
- **External API:** The Movie Database (TMDB) API v3/v4

---

## 3. Struktur Folder

```
wathis/
├── public/                 # Static assets (logo, icons, metadata)
├── scripts/                # Node.js maintenance scripts (data check, manual batch sync TMDB)
├── src/
│   ├── app/                # Next.js App Router (pages, layouts, & API routes)
│   │   ├── api/            # API Route Handlers (TMDB proxy & public share)
│   │   ├── auth/           # OAuth callback handler
│   │   ├── help/           # Halaman FAQ & panduan pengguna
│   │   └── share/          # Halaman public share watchlist per user
│   ├── components/         # Reusable React UI components (Modals, Tables, Grid, Header)
│   ├── context/            # React Context providers (Watchlist, Theme, Language)
│   ├── data/               # Seed data & contoh migrasi JSON
│   ├── lib/                # Core utilities, API clients (TMDB, Supabase SSR/Browser, Parser)
│   └── types/              # TypeScript interfaces & types (watchlist, TMDB schema)
└── supabase/               # SQL schema & RLS security policy definitions
```

---

## 4. Konvensi Kode

- **Komponen:** React Functional Components (`.tsx`) dengan `'use client'` pada komponen interaktif. Menggunakan Tailwind classes dengan helper `cn()` (`src/lib/utils.ts`).
- **Penamaan:**
  - Komponen: `PascalCase.tsx` (contoh: `EditorialTableView.tsx`, `SearchModal.tsx`).
  - Utilities/Lib: `camelCase.ts` (contoh: `importParser.ts`, `tmdb.ts`).
  - Routes: `kebab-case` atau standard Next.js bracket convention (contoh: `[userId]`, `callback`).
- **State Management:** React Context API terpusat (`WatchlistContext.tsx` untuk CRUD watchlist, filter, sorting, dan sync status).
- **i18n:** Context internal kustom (`LanguageContext.tsx`) dengan kamus terjemahan Bahasa Indonesia (`id`) dan Inggris (`en`).
- **API Pattern:** Next.js Route Handlers di `src/app/api/` untuk endpoint internal (caching dengan `revalidate` atau `force-dynamic`).

---

## 5. Cara Run Project

### Prasyarat
- Node.js 18+ / 20+
- Akun Supabase (project aktif)
- TMDB API Key

### Langkah Setup
1. **Clone & Install Dependencies:**
   ```bash
   npm install
   ```
2. **Environment Variables:**
   Salin `.env.example` ke `.env.local` dan lengkapi konfigurasi:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_TMDB_API_KEY=your-tmdb-api-key
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id (opsional)
   ```
3. **Database Setup:**
   Eksekusi skrip SQL dari `supabase/schema.sql` di SQL Editor Supabase untuk membuat tabel `watchlist_items` dan aturan RLS.
4. **Jalankan Dev Server:**
   ```bash
   npm run dev
   ```
   Aplikasi aktif di `http://localhost:3000`.

---

## 6. Hal Penting & Gotchas

1. **Supabase RLS & Mode Guest:**
   - Tabel `watchlist_items` menggunakan RLS dengan mutasi (INSERT/UPDATE/DELETE) dibatasi ke pemilik (`auth.uid() = user_id`), sedangkan SELECT dibuka publik agar link share `/share/[userId]` dapat diakses.
   - Jika belum login, aplikasi berjalan dalam mode guest (data hanya tersimpan di state memori lokal tanpa persistensi DB).
2. **TMDB Dual Fetch Merge:**
   - `src/lib/tmdb.ts` memanggil TMDB multi-search untuk locale `id-ID` dan `en-US` secara paralel untuk menggabungkan metadata & fallback ringkasan berbahasa Indonesia/Inggris.
3. **Public Share API Route:**
   - Route `src/app/api/share/[userId]/route.ts` mendukung `SUPABASE_SERVICE_ROLE_KEY` (jika tersedia) dan fallback ke `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. **Maintenance Scripts:**
   - Skrip di `scripts/` (`checkData.js`, `syncAll.js`, `syncWithServiceRole.js`) menggunakan path relatif dinamis via `path.resolve` ke `.env.local`.
