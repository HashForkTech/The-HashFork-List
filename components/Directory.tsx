'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { CategoryWithCount } from '@/lib/types';

type DirectoryProps = {
  categories: CategoryWithCount[];
  children: ReactNode;
  emptyMessage?: string;
};

/**
 * Category + "Tested" filters above the item list.
 *
 * The category is picked in a drop-down menu ("All" is selected by default).
 * To its right, two checkboxes control which resources are shown: "Tested"
 * and "Non-tested". Both are checked by default (everything visible);
 * unchecking one hides that group, unchecking both hides the whole list.
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
  const [showTested, setShowTested] = useState(true);
  const [showUntested, setShowUntested] = useState(true);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const applyFilter = useCallback(
    (categoryId: string, tested: boolean, untested: boolean) => {
      const root = listRef.current;
      if (!root) return;
      let visible = 0;
      for (const row of root.querySelectorAll<HTMLElement>('[data-item-row]')) {
        const matchesCategory =
          categoryId === 'all' || (row.dataset.itemCategory ?? '') === categoryId;
        const isTested = row.dataset.itemTested === 'true';
        const matchesStatus = (isTested && tested) || (!isTested && untested);
        const matches = matchesCategory && matchesStatus;
        row.hidden = !matches;
        if (matches) visible += 1;
      }
      setVisibleCount(visible);
    },
    [],
  );

  useEffect(() => {
    applyFilter(activeId, showTested, showUntested);
  }, [activeId, showTested, showUntested, applyFilter]);

  const message =
    activeId !== 'all' && showTested && showUntested
      ? emptyMessage
      : 'No resources match the selected filters.';

  return (
    <section aria-label="Resource list">
      <div className="sticky top-14 z-20 -mx-4 bg-ink/90 px-4 py-3 backdrop-blur sm:top-16 sm:mx-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
          <div>
            <label htmlFor="category-filter" className="sr-only">
              Filter by category
            </label>
            <select
              id="category-filter"
              value={activeId}
              onChange={(event) => setActiveId(event.target.value)}
              className="cursor-pointer rounded-sm border border-paper/20 bg-transparent px-3 py-2 text-sm text-paper transition-colors duration-150 hover:border-paper/45 focus:border-paper/60 focus:outline-none"
            >
              <option value="all" className="bg-ink text-paper">
                All
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id} className="bg-ink text-paper">
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div
            role="group"
            aria-label="Filter by tested status"
            className="flex items-center gap-4"
          >
            <label className="flex cursor-pointer items-center gap-2 text-sm text-paper/80">
              <input
                type="checkbox"
                className="h-4 w-4 accent-paper/70"
                checked={showTested}
                onChange={(event) => setShowTested(event.target.checked)}
              />
              Tested
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-paper/80">
              <input
                type="checkbox"
                className="h-4 w-4 accent-paper/70"
                checked={showUntested}
                onChange={(event) => setShowUntested(event.target.checked)}
              />
              Non-tested
            </label>
          </div>
        </div>
      </div>

      <div ref={listRef} className="mt-2 border-t border-paper/10">
        {children}
      </div>

      {visibleCount === 0 ? (
        <p className="px-1 py-16 text-center text-sm text-paper/45">{message}</p>
      ) : null}
    </section>
  );
}
