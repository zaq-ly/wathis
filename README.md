<div align="center">
  <img src="public/logo_zoomed.jpg" alt="Logo wathis." width="120" style="border-radius: 12px; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);" />
  
  # wathis.

  **Arsip sinema personal yang premium, minimalis, dan elegan.**
</div>

<br />

**wathis.** adalah aplikasi web modern yang dirancang untuk membantumu menyinkronkan, mengelola, dan menyimpan riwayat tontonan Film dan TV Series secara aman di semua perangkat. Dibangun dengan fokus utama pada estetika, wathis menampilkan antarmuka *glassmorphism* ala Apple, animasi mikro yang mulus, dan lingkungan yang bebas gangguan untuk koleksi sinemamu.

---

## ✨ Fitur Utama

- **Antarmuka Premium:** UI yang sangat memanjakan mata dengan gaya *Apple-esque*, efek *glassmorphism* dinamis, tampilan *Grid* maupun *Table* yang responsif, serta dukungan *Dark Mode* yang memukau.
- **Sinkronisasi TMDB:** Otomatis menstandarkan arsipmu dengan menarik metadata resmi, poster kualitas tinggi, dan jumlah *season* akurat langsung dari The Movie Database (TMDB).
- **Satu Tempat Terpusat:** Kelola Film dan TV Series multi-musim dalam satu arsip terpadu yang dikategorikan dengan rapi dan mudah difilter.
- **Cloud Sync Aman:** Didukung oleh infrastruktur *enterprise-grade* dengan PostgreSQL *Row Level Security* (RLS), memastikan datamu selalu aman dan tersinkronisasi di semua perangkatmu.
- **Migrasi Data Mudah:** Dilengkapi fitur *bulk import* CSV bawaan untuk memudahkan migrasi riwayat tontonan dari *platform* lain ke dalam wathis.

---

## 🛠 Tech Stack

Aplikasi ini dibangun menggunakan teknologi web modern terbaik saat ini:

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS v3.4](https://tailwindcss.com/)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **External Data:** [TMDB API](https://www.themoviedb.org/documentation/api)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 🚀 Panduan Setup & Run

### 1. Prasyarat & Environment Variables
Salin template environment:
```bash
cp .env.example .env.local
```
Lengkapi variabel berikut di `.env.local` atau pada dashboard hosting (Vercel):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TMDB_API_KEY`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (opsional untuk Google OAuth)
- `SUPABASE_SERVICE_ROLE_KEY` (opsional untuk service role sync)

### 2. Database Migration
Jalankan skrip SQL di Supabase SQL Editor dari file `supabase/schema.sql`.

### 3. Install & Jalankan
```bash
npm install
npm run dev     # Mode development
npm test        # Unit testing
npm run build   # Production build
npm start       # Production server
```

<br />

<div align="center">
  <sub>Dibuat dengan presisi tanpa kerumitan.</sub>
</div>
