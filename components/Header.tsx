import Link from 'next/link';

/** Public site header: title (left) — Admin (right). */
export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-paper/10 bg-ink/90 backdrop-blur supports-[backdrop-filter]:bg-ink/75">
      <div className="mx-auto flex h-14 max-w-content items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="min-w-0 truncate text-base font-semibold tracking-tight text-paper transition-opacity hover:opacity-90 sm:text-xl"
        >
          The Hashfork List
        </Link>
        <Link
          href="/admin"
          className="ml-auto inline-flex h-11 shrink-0 items-center rounded-sm border border-paper/25 px-2.5 text-xs font-medium text-paper/85 transition-colors duration-150 hover:border-paper/60 hover:bg-paper/5 hover:text-paper sm:h-9 sm:px-3 sm:text-sm"
        >
          Admin
        </Link>
      </div>
    </header>
  );
}
