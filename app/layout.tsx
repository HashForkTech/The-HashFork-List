import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const SITE_NAME = 'The HashFork List';
const SITE_DESCRIPTION =
  'A curated list of GitHub applications, LLMs, models and AI tools.';

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
    'artificial intelligence',
    'LLM',
    'models',
    'AI tools',
    'GitHub',
    'Hugging Face',
    'open source',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
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
    // suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
    // attributes into <html>/<body> before React hydrates. This silences the
    // resulting attribute-only mismatch; it does NOT affect the subtree.
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-ink font-sans text-paper antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
