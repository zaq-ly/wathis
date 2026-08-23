'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  Mail,
  Bug,
  HelpCircle,
  ChevronDown,
  Sparkles,
  Database,
  Cloud,
  Share2,
  RefreshCw,
  Sun,
  Moon,
  Globe,
  ExternalLink,
  MessageSquarePlus,
} from 'lucide-react';

interface FAQItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  qId: string;
  qEn: string;
  aId: string;
  aEn: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    id: 'sync',
    icon: Cloud,
    qId: 'Bagaimana cara menyimpan dan menyinkronkan data arsip?',
    qEn: 'How do I save and sync my cinema archive across devices?',
    aId: 'Cukup masuk menggunakan akun Google (Sign In). Seluruh judul film, serial, dan anime yang kamu tambahkan akan otomatis tersimpan di cloud database (Supabase) secara realtime. Kamu bisa mengakses arsipmu dari perangkat mana saja kapan pun.',
    aEn: 'Simply sign in with your Google account. All added films, series, and anime will be automatically and securely saved to the cloud database (Supabase) in realtime. You can access your archive from any device anytime.',
  },
  {
    id: 'search',
    icon: Sparkles,
    qId: 'Bagaimana cara menambahkan Film, Serial, atau Anime?',
    qEn: 'How do I add films, series, or anime to my archive?',
    aId: 'Gunakan bilah pencarian di bagian atas atau tekan tombol pintasan Ctrl + K (atau tombol / pada keyboard). Ketik judul yang ingin dicari, lalu klik tombol "+" untuk memasukkannya ke dalam daftar arsip.',
    aEn: 'Use the dedicated search bar at the top or press Ctrl + K (or / key). Search for your desired title and click the "+" button to add it to your personal archive.',
  },
  {
    id: 'import',
    icon: Database,
    qId: 'Bagaimana cara memindahkan daftar tontonan dari CSV / file lama?',
    qEn: 'How do I import existing watchlists from CSV or text files?',
    aId: 'Buka menu profil di kanan atas, lalu pilih "Import Data (CSV)". Kamu bisa mengunggah file CSV atau menempelkan teks daftar judul secara langsung. Sistem pintar wathis akan mencocokkan judul secara otomatis dengan data TMDB.',
    aEn: 'Open your profile menu at the top right and select "Import Data (CSV)". You can upload a CSV file or paste raw text lists. wathis will automatically match and import metadata from TMDB.',
  },
  {
    id: 'share',
    icon: Share2,
    qId: 'Bagaimana cara membagikan koleksi arsip saya ke teman?',
    qEn: 'How do I share my archive collection with friends?',
    aId: 'Klik tombol "Share" di navigasi atas untuk menyalin tautan publik arsipmu. Siapa pun yang membuka tautan tersebut dapat melihat koleksi film dan serialmu dalam mode baca (read-only) yang aman tanpa bisa mengubah isinya.',
    aEn: 'Click the "Share" button on the top navigation bar to copy your public share link. Anyone with the link can explore your curated collection in a secure, elegant read-only mode.',
  },
  {
    id: 'sync-tmdb',
    icon: RefreshCw,
    qId: 'Apa fungsi dari tombol "Sinkronkan Judul"?',
    qEn: 'What does the "Sync Titles" feature do?',
    aId: 'Fitur "Sinkronkan Judul" berguna untuk memperbarui informasi judul di arsipmu (seperti poster resolusi tinggi, rating terbaru, genre, dan sinopsis) langsung dari database global TMDB.',
    aEn: '"Sync Titles" refreshes all metadata in your collection (such as updated ratings, high-res posters, genres, and overviews) directly from the global TMDB database.',
  },
];

export default function HelpPage() {
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<string | null>('sync');
  const [searchQuery, setSearchQuery] = useState('');

  const isId = language === 'id';

  const filteredFaqs = FAQ_LIST.filter((faq) => {
    const q = isId ? faq.qId : faq.qEn;
    const a = isId ? faq.aId : faq.aEn;
    const term = searchQuery.toLowerCase();
    return q.toLowerCase().includes(term) || a.toLowerCase().includes(term);
  });

  const toggleFaq = (id: string) => {
    setOpenFaq((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* Apple Frosted Navbar */}
      <header className="sticky top-0 z-40 apple-glass-nav border-b border-black/[0.06] dark:border-white/[0.08] transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          {/* Left: Brand Logo & Distinct Back Button */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <Link
              href="/"
              className="flex items-center space-x-2 font-bold text-sm sm:text-base tracking-tight text-foreground select-none group cursor-pointer apple-btn-active shrink-0"
              title="wathis."
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-black/10 dark:border-white/10 shadow-xs">
                <img
                  src="/logo_zoomed.jpg"
                  alt="wathis logo"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span>wathis<span className="text-zinc-400">.</span></span>
            </Link>

            <span className="text-black/15 dark:text-white/20 text-xs font-light">/</span>

            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-foreground font-semibold text-xs transition-all border border-black/5 dark:border-white/10 shadow-2xs group cursor-pointer apple-btn-active"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-foreground group-hover:-translate-x-0.5 transition-transform" />
              <span>{isId ? 'Kembali ke Arsip' : 'Back to Archive'}</span>
            </Link>
          </div>

          {/* Right: Language & Theme Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
              className="h-8 px-3 rounded-full flex items-center justify-center text-xs font-semibold text-foreground bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-all cursor-pointer border border-black/10 dark:border-white/10 space-x-1.5 shadow-2xs active:scale-95"
              title={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
            >
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{language === 'id' ? 'Indonesia' : 'English'}</span>
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8 rounded-full flex items-center justify-center text-foreground bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-all cursor-pointer border border-black/10 dark:border-white/10 shadow-2xs active:scale-95"
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isId ? 'Pusat Bantuan & Panduan' : 'Help & Support Center'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {isId ? 'Ada yang bisa kami bantu?' : 'How can we help you?'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {isId
              ? 'Temukan jawaban cepat seputar sinkronisasi data, pengelolaan arsip film & anime, serta panduan fitur wathis.'
              : 'Find quick answers regarding data synchronization, managing your cinema archive, and wathis feature guides.'}
          </p>
        </div>

        {/* Search FAQ Input */}
        <div className="max-w-xl mx-auto">
          <div className="relative flex items-center bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-2xl p-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isId ? 'Ketik kata kunci pertanyaan...' : 'Type question keywords...'}
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {isId ? 'Reset' : 'Clear'}
              </button>
            )}
          </div>
        </div>

        {/* Section 1: FAQ Accordion */}
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center space-x-2">
            <span>{isId ? 'Pertanyaan yang Sering Diajukan' : 'Frequently Asked Questions'}</span>
          </h2>

          <div className="space-y-2.5">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => {
                const IconComponent = faq.icon;
                const isOpen = openFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="border border-black/[0.08] dark:border-white/[0.1] rounded-2xl bg-card overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center space-x-3.5 pr-4">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-foreground">
                          {isId ? faq.qId : faq.qEn}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-foreground' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-black/[0.04] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01]">
                        {isId ? faq.aId : faq.aEn}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-card border border-black/10 dark:border-white/10 rounded-2xl text-muted-foreground text-xs">
                {isId ? 'Tidak ada jawaban yang cocok dengan kata kunci tersebut.' : 'No matching questions found for your search query.'}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Two Contact & Support Cards */}
        <div className="pt-4 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
            {isId ? 'Masih butuh bantuan? Hubungi kami' : 'Still need help? Contact us'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Email Developer */}
            <div className="p-5 sm:p-6 bg-card border border-black/[0.08] dark:border-white/[0.1] rounded-3xl flex flex-col justify-between space-y-4 shadow-sm hover:border-black/20 dark:hover:border-white/20 transition-all">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {isId ? 'Email Dukungan' : 'Email Support'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {isId
                      ? 'Punya pertanyaan khusus, kendala akun, atau ingin konsultasi terkait arsipmu? Kirim pesan langsung ke email pengembang.'
                      : 'Have specific questions, account issues, or personal archive inquiries? Send a direct email to the developer.'}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.06] text-xs font-mono font-medium text-foreground truncate select-all">
                  muhammadzaqly01@gmail.com
                </div>
              </div>

              <a
                href="mailto:muhammadzaqly01@gmail.com?subject=Tanya%20Seputar%20wathis"
                className="w-full py-2.5 px-4 rounded-full bg-foreground text-background font-semibold text-xs text-center flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity cursor-pointer apple-btn-active"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{isId ? 'Kirim Email Sekarang' : 'Send Email Now'}</span>
              </a>
            </div>

            {/* Card 2: GitHub Issues & Feature Request */}
            <div className="p-5 sm:p-6 bg-card border border-black/[0.08] dark:border-white/[0.1] rounded-3xl flex flex-col justify-between space-y-4 shadow-sm hover:border-black/20 dark:hover:border-white/20 transition-all">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {isId ? 'Request Fitur & Lapor Bug' : 'Feature Request & Bug Report'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {isId
                      ? 'Punya ide fitur baru yang ingin ditambahkan atau menemukan error pada tampilan? Berikan masukan langsung di repositori open source kami.'
                      : 'Have new feature ideas or found an unexpected UI glitch? Open an issue and collaborate directly on our open repository.'}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.06] text-xs font-mono font-medium text-foreground truncate">
                  github.com/zaq-ly/wathis/issues
                </div>
              </div>

              <a
                href="https://github.com/zaq-ly/wathis/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-foreground font-semibold text-xs text-center flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>{isId ? 'Buka GitHub Issues' : 'Open GitHub Issues'}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/[0.06] dark:border-white/[0.08] py-6 text-xs text-muted-foreground text-center">
        <p>wathis • Personal Cinema Archive</p>
      </footer>
    </div>
  );
}
