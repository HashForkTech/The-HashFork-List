import { LinkIcons } from '@/components/LinkIcons';
import type { ListItem } from '@/lib/types';

/**
 * One row of the public list:
 *   line 1 → name + (icon links when the matching URLs exist)
 *   line 2 → description (muted, wraps naturally on small screens)
 *
 * Rendered on the server and kept as a static DOM subtree: the category
 * filter only toggles visibility, so the row DOM survives filtering.
 */
export function ItemRow({ item }: { item: ListItem }) {
  const name = item.name?.trim();

  return (
    <article
      data-item-row="true"
      data-item-category={item.categoryId ?? ''}
      className="border-b border-paper/10 transition-colors duration-150 hover:bg-paper/[0.03]"
    >
      <div className="px-1 py-5 sm:px-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 break-words text-[1.05rem] font-medium tracking-tight text-paper sm:text-lg">
            {name ? (
              name
            ) : (
              <span className="font-normal italic text-paper/40">Ressource sans nom</span>
            )}
          </h2>
          <LinkIcons item={item} />
        </div>
        {item.description?.trim() ? (
          <p className="mt-1.5 max-w-3xl whitespace-pre-wrap break-words text-sm leading-relaxed text-paper/60 sm:text-[0.95rem]">
            {item.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}
