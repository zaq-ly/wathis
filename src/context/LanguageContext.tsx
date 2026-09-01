'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'id' | 'en';

export const translations = {
  id: {
    // Nav & Categories
    all: 'Semua',
    films: 'Film',
    series: 'Serial',
    anime: 'Anime',
    share: 'Share',
    signIn: 'Sign In',
    continueWithGoogle: 'Lanjutkan dengan Google',
    theme: 'Tema',
    auto: 'Auto',
    light: 'Light',
    dark: 'Dark',
    language: 'Bahasa',
    langId: 'Indonesia',
    langEn: 'English',
    syncTitles: 'Sinkronkan Judul',
    importCSV: 'Import Data (CSV)',
    exportCSV: 'Export Backup (CSV)',
    help: 'Bantuan & FAQ',
    signOut: 'Keluar (Sign Out)',
    sharedArchive: 'Arsip Bersama',
    linkCopied: 'Link Share disalin ke clipboard!',
    syncFinished: 'Sinkronisasi selesai!',
    exportFinished: 'Data arsip CSV berhasil di-download!',
    noExportData: 'Tidak ada data arsip untuk di-export.',

    // Search & Filter
    searchHeroPlaceholder: 'Cari film, anime, atau series untuk ditambahkan...',
    searchTMDBPlaceholder: 'Cari judul di TMDB (contoh: Inception, Shogun)...',
    recentSearches: 'Riwayat Pencarian',
    clearHistory: 'Hapus Semua',
    filterInArchive: 'Cari di arsip...',
    allGenres: 'Semua Genre',
    titlesCount: 'judul',

    // Sort Options
    sortYearDesc: 'Tahun: Terbaru',
    sortYearAsc: 'Tahun: Terlama',
    sortAlphaAsc: 'Judul: A → Z',
    sortAlphaDesc: 'Judul: Z → A',
    sortRatingDesc: 'Rating: Tertinggi ★',
    sortSeasonsDesc: 'Musim: Terbanyak',
    sortRecent: 'Baru Ditambahkan',

    // Table & View
    viewList: 'Tampilan List',
    viewGrid: 'Tampilan Grid',
    tableNo: 'No',
    tableTitle: 'Judul',
    tableType: 'Tipe',
    tableYear: 'Tahun',
    tableRating: 'Rating',
    tableGenres: 'Genre',
    tableAction: 'Aksi',
    noTitlesFound: 'Tidak ada judul ditemukan',
    noTitlesDesc: 'Coba ubah kata kunci pencarian atau filter genre.',
    emptyArchive: 'Arsip Masih Kosong',
    emptyArchiveDesc: 'Mulai bangun arsip sinema pribadimu sekarang.',
    addFirstTitle: 'Tambah Judul Pertama',

    // Actions & Modals
    add: 'Tambah',
    added: 'Ditambahkan',
    details: 'Detail',
    editMatch: 'Edit Match TMDB',
    deleteTitle: 'Hapus dari Arsip',
    deleteConfirmTitle: 'Hapus dari Arsip?',
    deleteConfirmDesc: 'Judul ini akan dihapus permanen dari daftar arsipmu.',
    logoutConfirmTitle: 'Keluar dari Akun?',
    logoutConfirmDesc: 'Kamu akan keluar dari akun ini. Masuk kembali kapan saja untuk menyinkronkan data.',
    cancel: 'Batal',
    delete: 'Hapus',
    save: 'Simpan',
    seasons: 'Musim',
    overview: 'Sinopsis',
    noOverview: 'Belum ada sinopsis tersedia untuk judul ini.',
    watchLog: 'Catatan Tontonan',
    completedStatus: 'Selesai / Tamat',
    ongoingStatus: 'Sedang Diikuti (Ongoing)',
    season: 'Season',
    lastEpisode: 'Episode Terakhir',
    saveLog: 'Simpan Catatan',
    customLabel: 'Kustom',
    movieSequel: 'Catatan Sekuel / Part',
    movieSingle: 'Film Tunggal (Tanpa Part)',
    pinTitle: 'Sematkan ke Atas (Pin)',
    unpinTitle: 'Lepas Sematan (Unpin)',
    pinned: 'Pinned',

    // Footer
    footerDesc: 'Arsip tontonan film, serial, dan anime pribadi.',
    poweredBy: 'Powered by TMDB',
    safeData: 'Semua data tersimpan aman',
  },
  en: {
    // Nav & Categories
    all: 'All',
    films: 'Films',
    series: 'Series',
    anime: 'Anime',
    share: 'Share',
    signIn: 'Sign In',
    continueWithGoogle: 'Continue with Google',
    theme: 'Theme',
    auto: 'Auto',
    light: 'Light',
    dark: 'Dark',
    language: 'Language',
    langId: 'Indonesian',
    langEn: 'English',
    syncTitles: 'Sync Titles',
    importCSV: 'Import Data (CSV)',
    exportCSV: 'Export Backup (CSV)',
    help: 'Help & FAQ',
    signOut: 'Sign Out',
    sharedArchive: 'Shared Archive',
    linkCopied: 'Share link copied to clipboard!',
    syncFinished: 'Sync completed!',
    exportFinished: 'Archive CSV successfully downloaded!',
    noExportData: 'No archive data to export.',

    // Search & Filter
    searchHeroPlaceholder: 'Search films, anime, or series to archive...',
    searchTMDBPlaceholder: 'Search TMDB titles (e.g. Inception, Shogun)...',
    recentSearches: 'Recent Searches',
    clearHistory: 'Clear All',
    filterInArchive: 'Filter in archive...',
    allGenres: 'All Genres',
    titlesCount: 'titles',

    // Sort Options
    sortYearDesc: 'Year: Newest',
    sortYearAsc: 'Year: Oldest',
    sortAlphaAsc: 'Title: A → Z',
    sortAlphaDesc: 'Title: Z → A',
    sortRatingDesc: 'Rating: Highest ★',
    sortSeasonsDesc: 'Seasons: Most',
    sortRecent: 'Recently Added',

    // Table & View
    viewList: 'List View',
    viewGrid: 'Grid View',
    tableNo: 'No',
    tableTitle: 'Title',
    tableType: 'Type',
    tableYear: 'Year',
    tableRating: 'Rating',
    tableGenres: 'Genres',
    tableAction: 'Action',
    noTitlesFound: 'No titles found',
    noTitlesDesc: 'Try adjusting your search query or genre filter.',
    emptyArchive: 'Archive is Empty',
    emptyArchiveDesc: 'Start building your personal cinema archive now.',
    addFirstTitle: 'Add First Title',

    // Actions & Modals
    add: 'Add',
    added: 'Added',
    details: 'Details',
    editMatch: 'Edit TMDB Match',
    deleteTitle: 'Remove from Archive',
    deleteConfirmTitle: 'Remove from Archive?',
    deleteConfirmDesc: 'This title will be permanently removed from your archive.',
    logoutConfirmTitle: 'Sign Out of Account?',
    logoutConfirmDesc: 'You will be signed out. Sign in anytime to sync your cinema archive.',
    cancel: 'Cancel',
    delete: 'Delete',
    save: 'Save',
    seasons: 'Seasons',
    overview: 'Overview',
    noOverview: 'No synopsis available for this title.',
    watchLog: 'Watch Log',
    completedStatus: 'Completed',
    ongoingStatus: 'Ongoing',
    season: 'Season',
    lastEpisode: 'Last Episode',
    saveLog: 'Save Log',
    customLabel: 'Custom',
    movieSequel: 'Sequel / Part Log',
    movieSingle: 'Single Movie (No Part)',
    pinTitle: 'Pin to Top',
    unpinTitle: 'Unpin Title',
    pinned: 'Pinned',

    // Footer
    footerDesc: 'Personal cinema, series, and anime archive.',
    poweredBy: 'Powered by TMDB',
    safeData: 'All data securely stored',
  },
};

type Translations = typeof translations.id;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('id');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wathis_language') as Language;
      if (saved === 'id' || saved === 'en') {
        setLanguageState(saved);
      }
    } catch {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('wathis_language', lang);
    } catch {}
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
