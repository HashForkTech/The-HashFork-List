import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const SITE_NAME = 'The Hashfork List';
const SITE_DESCRIPTION =
  'Une liste sélectionnée d’applications GitHub, de LLM, de modèles et d’outils IA.';

const appUrl = process.env.APP_URL?.trim() || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'intelligence artificielle',
    'LLM',
    'modèles',
    'outils IA',
    'GitHub',
    'Hugging Face',
    'open source',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: appUrl,
  },
  twitter: {
    card: 'summary',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#141414',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-ink font-sans text-paper antialiased">{children}</body>
    </html>
  );
}
