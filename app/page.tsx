import { Directory } from '@/components/Directory';
import { Header } from '@/components/Header';
import { ItemRow } from '@/components/ItemRow';
import { getDb } from '@/lib/db/client';
import { listCategories } from '@/lib/db/repositories/categories';
import { listItems } from '@/lib/db/repositories/items';

// Always rendered fresh from the local database (admin edits show up at once).
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const db = getDb();
  const categories = listCategories(db);
  const items = listItems(db);

  return (
    <>
      <Header />
      <main id="contenu" className="mx-auto w-full max-w-content px-4 pb-24 sm:px-6">
        <h1 className="sr-only">The HashFork List — curated AI resource list</h1>

        {items.length === 0 ? (
          <div className="border-t border-paper/10">
            <p className="px-1 py-20 text-center text-sm text-paper/45">
              No resources yet.
            </p>
          </div>
        ) : (
          <Directory categories={categories}>
            {items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </Directory>
        )}
      </main>
      <footer className="border-t border-paper/10">
        <div className="mx-auto flex max-w-content items-center justify-between gap-3 px-4 py-6 text-xs text-paper/35 sm:px-6">
          <span>The HashFork List</span>
          <span>Hand-curated list · data hosted locally</span>
        </div>
      </footer>
    </>
  );
}
