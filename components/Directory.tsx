'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { CategoryWithCount } from '@/lib/types';

type DirectoryProps = {
  categories: CategoryWithCount[];
  children: ReactNode;
  emptyMessage?: string;
};

/**
 * Category filter + item list.
 *
 * The rows themselves are server-rendered (passed as `children`); filtering
 * only toggles the `hidden` attribute of each row through the DOM. Two
 * benefits: almost no JavaScript in the public page payload, and the rows'
 * DOM (including any text) survives filtering untouched.
 */
export function Directory({
  categories,
  children,
  emptyMessage = 'No resources in this category.',
}: DirectoryProps) {
  const [activeId, setActiveId] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const applyFilter = useCallback((id: string) => {
    const root = listRef.current;
    if (!root) return;
    let visible = 0;
    for (const row of root.querySelectorAll<HTMLElement>('[data-item-row]')) {
      const matches = id === 'all' || (row.dataset.itemCategory ?? '') === id;
      row.hidden = !matches;
      if (matches) visible += 1;
    }
    setVisibleCount(visible);
  }, []);

  useEffect(() => {
    applyFilter(activeId);
  }, [activeId, applyFilter]);

  return (
    <section aria-label="Resource list">
      {categories.length > 0 ? (
        <nav aria-label="Filter by category" className="sticky top-14 z-20 -mx-4 bg-ink/90 px-4 py-3 backdrop-blur sm:top-16 sm:mx-0 sm:rounded-none sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
          <ul className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5">
            <li className="shrink-0">
              <FilterButton
                active={activeId === 'all'}
                onClick={() => setActiveId('all')}
              >
                All
              </FilterButton>
            </li>
            {categories.map((category) => (
              <li key={category.id} className="shrink-0">
                <FilterButton
                  active={activeId === category.id}
                  onClick={() => setActiveId(category.id)}
                >
                  {category.name}
                </FilterButton>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div ref={listRef} className="mt-2 border-t border-paper/10">
        {children}
      </div>

      {visibleCount === 0 ? (
        <p className="px-1 py-16 text-center text-sm text-paper/45">{emptyMessage}</p>
      ) : null}
    </section>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`whitespace-nowrap rounded-sm border px-3.5 py-2 text-sm transition-colors duration-150 ${
        active
          ? 'border-paper bg-paper font-medium text-ink'
          : 'border-paper/15 text-paper/70 hover:border-paper/45 hover:bg-paper/5 hover:text-paper'
      }`}
    >
      {children}
    </button>
  );
}
