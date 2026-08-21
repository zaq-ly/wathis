# PRD — Watchlist App

## 1. Fitur Inti

1. **Search & Auto-fill Data**
   User mengetik judul movie/series di search box. Sistem melakukan pencarian ke TMDB API dan menampilkan daftar hasil (poster kecil, judul, tahun) untuk dikonfirmasi user.

2. **Detail Otomatis**
   Setelah user memilih hasil yang benar, data lengkap otomatis terisi dari TMDB: poster, genre, dan jumlah season (khusus series).

3. **Simpan ke Watchlist Pribadi**
   Data yang telah dikonfirmasi disimpan ke akun user masing-masing sebagai catatan film/series yang sudah ditonton.

4. **Multi-user**
   Setiap user memiliki watchlist masing-masing yang terpisah, memerlukan sistem login/autentikasi.

### Yang Sengaja Tidak Ada
- **Status tontonan** (sudah/sedang/rencana nonton) — aplikasi ini khusus untuk film/series yang sudah selesai ditonton.
- **Rating pribadi** — tidak realistis diberikan satu per satu untuk banyak judul.
- **Genre manual** — digantikan sepenuhnya oleh genre resmi dari TMDB.

---

## 2. Platform & Tech Stack

**Platform**
- Web app, dengan opsi dijadikan PWA (installable ke homescreen, standalone display tanpa address bar).

**Tech Stack**
- **Next.js** — frontend & backend dalam satu project (berbasis React, dengan routing dan API routes built-in)
- **Supabase** — database Postgres, Auth built-in, dan Row Level Security untuk isolasi data antar user
- **Tailwind CSS** + **shadcn/ui** — styling dan UI components
- **TMDB API** — sumber data movie & series (poster, genre, season)

---

## 3. Migrasi Data Awal

- Data lama tersimpan di Notion: **183 judul** film/series.
- Format data lama: hanya kolom **Title** dan **Genre manual** (kategori buatan sendiri: Mystery/Thriller, Action/Thriller, Drama, Horror/Thriller, Sci-Fi, Comedy). Tidak ada tahun rilis, poster, rating, atau status tontonan.
- Beberapa judul series ditulis dengan embel-embel season (contoh: "ENOLA HOLMES S1 - S2") — perlu dibersihkan/di-parse terlebih dahulu sebelum di-search ke TMDB.
- Proses migrasi bersifat **one-time** (sekali jalan, bukan sinkronisasi berkelanjutan).
- Setiap judul di-*matching* ke TMDB, dengan **step konfirmasi manual** per judul untuk menghindari kesalahan pencocokan (misalnya judul yang ambigu atau ada remake).
- Genre manual dari Notion **tidak dibawa** ke sistem baru — akan digantikan sepenuhnya oleh genre resmi dari TMDB.
