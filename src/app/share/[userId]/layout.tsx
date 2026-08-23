import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shared Cinema Archive - wathis',
  description: 'Curated personal cinema archive for films, anime, and series shared via wathis.',
  openGraph: {
    title: 'Shared Cinema Archive - wathis',
    description: 'Curated personal cinema archive for films, anime, and series shared via wathis.',
    images: [
      {
        url: '/logo.jpg',
        width: 800,
        height: 800,
        alt: 'wathis logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Shared Cinema Archive - wathis',
    description: 'Curated personal cinema archive for films, anime, and series shared via wathis.',
    images: ['/logo.jpg'],
  },
};

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
