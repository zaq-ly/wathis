import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bantuan & Panduan (Help Center) - wathis',
  description: 'Pusat bantuan, panduan penggunaan, dan FAQ seputar wathis personal cinema archive.',
  openGraph: {
    title: 'Bantuan & FAQ - wathis',
    description: 'Pusat bantuan, panduan penggunaan, dan FAQ seputar wathis.',
    images: ['/logo.jpg'],
    type: 'website',
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
