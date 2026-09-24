'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/api/admin-client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ConfirmDialog, type ConfirmOptions } from '@/components/admin/ConfirmDialog';
import { DataTools } from '@/components/admin/DataTools';
import { ItemForm } from '@/components/admin/ItemForm';
import { LinkIcons } from '@/components/LinkIcons';
import type { Category, CategoryWithCount, ItemPayload, ListItem } from '@/lib/types';

type Notice = { kind: 'info' | 'error'; text: string };
type PendingConfirm = ConfirmOptions & { onConfirm: () => void | Promise<void> };

type AdminDashboardProps = {
  initialCategories: CategoryWithCount[];
  initialItems: ListItem[];
};

function StarRow({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5"
      role="img"
      aria-label={`Rated ${rating} out of 5 stars`}
    >
      {Array.from({ length: rating }, (_, index) => (
        <Star
          key={index}
          className="h-3 w-3 fill-yellow-400 text-yellow-400"
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/**
 * Lightweight content management screen:
 *   Categories → create / rename / delete (items are kept on delete)
 *   Items      → create / edit / delete
 *   Data       → export / import backups
 */
export function AdminDashboard({ initialCategories, initialItems }: AdminDashboardProps) {
  const [categories, setCategories] = useState<CategoryWithCount[]>(initialCategories);
  const [items, setItems] = useState<ListItem[]>(initialItems);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [categoryIssues, setCategoryIssues] = useState<string[]>([]);

  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [itemIssues, setItemIssues] = useState<string[]>([]);
  const [itemBusy, setItemBusy] = useState(false);

  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const refresh = useCallback(async () => {
    const [categoryResult, itemResult] = await Promise.all([
      adminApi.listCategories(),
      adminApi.listItems(),
    ]);
    if (categoryResult.ok) setCategories(categoryResult.data.categories);
    if (itemResult.ok) setItems(itemResult.data.items);
  }, []);

  /* ------------------------------- categories ------------------------------ */

  async function createCategory(name: string): Promise<Category | null> {
    setCategoryIssues([]);
    const result = await adminApi.createCategory(name);
    if (!result.ok) {
      setCategoryIssues(result.issues?.length ? result.issues : [result.message]);
      setNotice({ kind: 'error', text: result.message });
      return null;
    }
    await refresh();
    setNotice({ kind: 'info', text: `Category "${result.data.category.name}" created.` });
    return result.data.category;
  }

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) {
      setCategoryIssues(['The category name is required.']);
      return;
    }
    const created = await createCategory(name);
    if (created) {
      setCategoryName('');
      setShowCategoryForm(false);
    }
  }

  async function handleRenameCategory(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const name = renameValue.trim();
    if (!name) {
      setCategoryIssues(['The category name is required.']);
      return;
    }
    const result = await adminApi.updateCategory(id, name);
    if (!result.ok) {
      setNotice({ kind: 'error', text: result.message });
      return;
    }
    setEditingCategory(null);
    await refresh();
    setNotice({ kind: 'info', text: 'Category renamed.' });
  }

  function askDeleteCategory(category: CategoryWithCount) {
    const count = category.itemCount;
    setConfirm({
      title: 'Delete this category?',
      confirmLabel: 'Delete category',
      message: (
        <>
          <p>
            The category “{category.name}” will be deleted. This action cannot easily be undone.
          </p>
          {count > 0 ? (
            <p className="mt-2 text-paper/55">
              Its {count} resource{count > 1 ? 's' : ''} will be <strong>kept</strong>, but will
              lose their category.
            </p>
          ) : null}
        </>
      ),
      onConfirm: async () => {
        setConfirmBusy(true);
        const result = await adminApi.deleteCategory(category.id);
        setConfirmBusy(false);
        setConfirm(null);
        if (!result.ok) {
          setNotice({ kind: 'error', text: result.message });
          return;
        }
        await refresh();
        setNotice({
          kind: 'info',
          text:
            result.data.detachedItems > 0
              ? `Category deleted — ${result.data.detachedItems} resource(s) kept without a category.`
              : 'Category deleted.',
        });
      },
    });
  }

  /* --------------------------------- items -------------------------------- */

  async function handleSaveItem(payload: ItemPayload) {
    setItemBusy(true);
    setItemIssues([]);
    const result = editingItem
      ? await adminApi.updateItem(editingItem.id, payload)
      : await adminApi.createItem(payload);
    setItemBusy(false);

    if (!result.ok) {
      setItemIssues(result.issues?.length ? result.issues : [result.message]);
      return;
    }
    setShowItemForm(false);
    setEditingItem(null);
    await refresh();
    setNotice({
      kind: 'info',
      text: editingItem ? 'Resource updated.' : 'Resource added.',
    });
  }

  function askDeleteItem(item: ListItem) {
    const label = item.name?.trim() || 'this unnamed resource';
    setConfirm({
      title: 'Delete this resource?',
      confirmLabel: 'Delete',
      message: (
        <>
          <p>
            “{label}” will be permanently removed from the list.
          </p>
          <p className="mt-2 text-paper/50">
            This action cannot be undone (except by restoring a backup).
          </p>
        </>
      ),
      onConfirm: async () => {
        setConfirmBusy(true);
        const result = await adminApi.deleteItem(item.id);
        setConfirmBusy(false);
        setConfirm(null);
        if (!result.ok) {
          setNotice({ kind: 'error', text: result.message });
          return;
        }
        await refresh();
        setNotice({ kind: 'info', text: 'Resource deleted.' });
      },
    });
  }

  /* --------------------------------- render -------------------------------- */

  return (
    <AdminLayout>
      <main className="mx-auto w-full max-w-content px-4 pb-24 sm:px-6">
        <div className="py-6">
          <p className="section-title">Administration</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-paper">
            Dashboard
          </h1>
          <p className="mt-1.5 text-xs text-paper/35">
            Password-free area (no SSL certificate required). If this instance is exposed to
            untrusted people, protect /admin and /api at the server level — see README.
          </p>
        </div>

        {notice ? (
          <p
            role="status"
            aria-live="polite"
            className={`rounded-sm border px-3.5 py-2.5 text-sm ${
              notice.kind === 'error'
                ? 'border-paper/30 bg-paper/5 text-paper/85'
                : 'border-paper/10 bg-paper/[0.03] text-paper/65'
            }`}
          >
            {notice.kind === 'error' ? '⚠ ' : '✓ '}
            {notice.text}
          </p>
        ) : null}

        {/* ------------------------------ categories ---------------------------- */}
        <section aria-labelledby="categories-title" className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="categories-title" className="section-title">
              Categories
            </h2>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setShowCategoryForm((value) => !value);
                setCategoryIssues([]);
              }}
              aria-expanded={showCategoryForm}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New category
            </button>
          </div>

          {showCategoryForm ? (
            <form onSubmit={(event) => void handleCreateCategory(event)} className="panel mt-4 p-4">
              <label className="field-label" htmlFor="category-name">
                Category name
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  id="category-name"
                  className="field-input min-w-0 flex-1"
                  maxLength={60}
                  autoFocus
                  placeholder="LLMs, Tools, Applications…"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                  Add
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowCategoryForm(false)}
                >
                  Cancel
                </button>
              </div>
              {categoryIssues.length > 0 ? (
                <ul role="alert" className="field-error space-y-1">
                  {categoryIssues.map((issue) => (
                    <li key={issue}>⚠ {issue}</li>
                  ))}
                </ul>
              ) : null}
            </form>
          ) : null}

          {categories.length === 0 ? (
            <p className="panel mt-4 px-4 py-8 text-center text-sm text-paper/45">
              No categories yet. The public list also works without categories.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className="panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4"
                >
                  {editingCategory?.id === category.id ? (
                    <form
                      onSubmit={(event) => void handleRenameCategory(event, category.id)}
                      className="flex w-full flex-wrap gap-2"
                    >
                      <label className="sr-only" htmlFor={`rename-${category.id}`}>
                        New category name
                      </label>
                      <input
                        id={`rename-${category.id}`}
                        className="field-input min-w-0 flex-1"
                        maxLength={60}
                        autoFocus
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                      />
                      <button type="submit" className="btn btn-primary">
                        Save
                      </button>
                      <button type="button" className="btn" onClick={() => setEditingCategory(null)}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 break-words text-sm font-medium text-paper">
                        {category.name}
                      </span>
                      <span className="shrink-0 text-xs text-paper/40">
                        {category.itemCount} resource{category.itemCount === 1 ? '' : 's'}
                      </span>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          className="btn"
                          onClick={() => {
                            setEditingCategory(category);
                            setRenameValue(category.name);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Rename
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => askDeleteCategory(category)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* -------------------------------- items ------------------------------- */}
        <section aria-labelledby="items-title" className="mt-14">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="items-title" className="section-title">
              Resources
            </h2>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setEditingItem(null);
                setItemIssues([]);
                setShowItemForm((value) => !value);
              }}
              aria-expanded={showItemForm}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add a resource
            </button>
          </div>

          {showItemForm ? (
            <ItemForm
              key={editingItem?.id ?? 'new'}
              categories={categories}
              initial={editingItem}
              submitting={itemBusy}
              serverIssues={itemIssues}
              onCreateCategory={createCategory}
              onSubmit={handleSaveItem}
              onCancel={() => {
                setShowItemForm(false);
                setEditingItem(null);
                setItemIssues([]);
              }}
            />
          ) : null}

          {items.length === 0 ? (
            <p className="panel mt-4 px-4 py-8 text-center text-sm text-paper/45">
              No resources added yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {items.map((item) => {
                const category = item.categoryId
                  ? categoryById.get(item.categoryId)
                  : undefined;
                const rating = Math.min(5, Math.max(0, Math.round(item.rating ?? 0)));
                return (
                  <li
                    key={item.id}
                    className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <h3 className="min-w-0 break-words text-base font-medium tracking-tight text-paper">
                          {item.name?.trim() || (
                            <span className="font-normal italic text-paper/40">
                              Unnamed resource
                            </span>
                          )}
                        </h3>
                        {category ? (
                          <span className="shrink-0 rounded-sm border border-paper/15 px-2 py-0.5 text-[11px] text-paper/55">
                            {category.name}
                          </span>
                        ) : null}
                        {item.tested ? (
                          <span className="shrink-0 rounded-sm border border-paper/15 px-2 py-0.5 text-[11px] text-paper/55">
                            Tested
                          </span>
                        ) : null}
                        {rating > 0 ? <StarRow rating={rating} /> : null}
                      </div>
                      {item.description?.trim() ? (
                        <p className="mt-1.5 line-clamp-2 max-w-2xl break-words text-sm leading-relaxed text-paper/55">
                          {item.description}
                        </p>
                      ) : null}
                      {item.comment?.trim() ? (
                        <p className="mt-1.5 line-clamp-2 max-w-2xl break-words text-xs leading-relaxed text-paper/45">
                          💬 {item.comment}
                        </p>
                      ) : null}
                      <div className="mt-2">
                        <LinkIcons item={item} />
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          setEditingItem(item);
                          setItemIssues([]);
                          setShowItemForm(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => askDeleteItem(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <DataTools onImported={() => void refresh()} onNotice={setNotice} />
      </main>

      {confirm ? (
        <ConfirmDialog
          options={confirm}
          busy={confirmBusy}
          onConfirm={() => void confirm.onConfirm()}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </AdminLayout>
  );
}
