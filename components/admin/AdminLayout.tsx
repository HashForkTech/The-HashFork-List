import Link from 'next/link';
import type { ReactNode } from 'react';

/** Shared chrome for the admin pages (never indexed by search engines). */
export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-paper/10">
        <div className="mx-auto flex h-14 max-w-content items-center gap-3 px-4 sm:h-16 sm:px-6">
          <Link
            href="/"
            className="min-w-0 truncate text-base font-semibold tracking-tight text-paper transition-opacity hover:opacity-90 sm:text-lg"
          >
            The Hashfork List
          </Link>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-paper/35 sm:inline">
            admin
          </span>
          <Link
            href="/"
            className="ml-auto text-sm text-paper/60 underline-offset-2 transition-colors hover:text-paper hover:underline"
          >
            Voir le site
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
