'use client';

import { useState, type FormEvent } from 'react';
import type { Category, CategoryWithCount, ItemPayload, ListItem } from '@/lib/types';
import { normalizeUrl } from '@/lib/validation/url';

const URL_FIELDS = [
  { key: 'githubUrl', label: 'Lien GitHub', placeholder: 'https://github.com/exemple/projet' },
  { key: 'websiteUrl', label: 'Site web', placeholder: 'https://exemple.com' },
  {
    key: 'huggingFaceUrl',
    label: 'Lien Hugging Face',
    placeholder: 'https://huggingface.co/exemple/modele',
  },
  { key: 'youtubeUrl', label: 'Lien YouTube', placeholder: 'https://youtube.com/watch?v=…' },
] as const;

type UrlFieldKey = (typeof URL_FIELDS)[number]['key'];
type FieldKey = 'categoryId' | 'name' | 'description' | UrlFieldKey;
type Fields = Record<FieldKey, string>;

const NEW_CATEGORY_VALUE = '__new__';

type ItemFormProps = {
  categories: CategoryWithCount[];
  initial?: ListItem | null;
  submitting: boolean;
  serverIssues: string[];
  onCreateCategory: (name: string) => Promise<Category | null>;
  onSubmit: (payload: ItemPayload) => void | Promise<void>;
  onCancel: () => void;
};

function initialFields(initial?: ListItem | null): Fields {
  return {
    categoryId: initial?.categoryId ?? '',
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    githubUrl: initial?.githubUrl ?? '',
    websiteUrl: initial?.websiteUrl ?? '',
    huggingFaceUrl: initial?.huggingFaceUrl ?? '',
    youtubeUrl: initial?.youtubeUrl ?? '',
  };
}

/**
 * Create/edit form for a list item. EVERY field is optional — an item can be
 * saved with a single field, or even completely empty (with a clear notice).
 * URLs are validated and normalized before submission.
 */
export function ItemForm({
  categories,
  initial,
  submitting,
  serverIssues,
  onCreateCategory,
  onSubmit,
  onCancel,
}: ItemFormProps) {
  const [fields, setFields] = useState<Fields>(() => initialFields(initial));
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const isEditing = Boolean(initial);
  const isEmpty =
    fields.name.trim() === '' &&
    fields.description.trim() === '' &&
    fields.categoryId === '' &&
    fields.githubUrl.trim() === '' &&
    fields.websiteUrl.trim() === '' &&
    fields.huggingFaceUrl.trim() === '' &&
    fields.youtubeUrl.trim() === '';

  function setField(key: FieldKey, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validateUrlField(key: UrlFieldKey): boolean {
    const value = fields[key].trim();
    if (value && !normalizeUrl(value)) {
      setErrors((current) => ({
        ...current,
        [key]: 'URL invalide (ex. https://exemple.com).',
      }));
      return false;
    }
    setErrors((current) => ({ ...current, [key]: undefined }));
    return true;
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setCategoryBusy(true);
    const created = await onCreateCategory(name);
    setCategoryBusy(false);
    if (created) {
      setNewCategoryName('');
      setCreatingCategory(false);
      setFields((current) => ({ ...current, categoryId: created.id }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<Record<FieldKey, string>> = {};
    for (const urlField of URL_FIELDS) {
      const value = fields[urlField.key].trim();
      if (value && !normalizeUrl(value)) {
        nextErrors[urlField.key] = 'URL invalide (ex. https://exemple.com).';
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    let categoryId: string | null = null;
    if (fields.categoryId === NEW_CATEGORY_VALUE) {
      const name = newCategoryName.trim();
      if (name) {
        const created = await onCreateCategory(name);
        categoryId = created?.id ?? null;
      }
    } else if (fields.categoryId) {
      categoryId = fields.categoryId;
    }

    const payload: ItemPayload = {
      categoryId,
      name: fields.name.trim() ? fields.name.trim() : null,
      description: fields.description.trim() ? fields.description.trim() : null,
      githubUrl: fields.githubUrl.trim() ? normalizeUrl(fields.githubUrl) : null,
      websiteUrl: fields.websiteUrl.trim() ? normalizeUrl(fields.websiteUrl) : null,
      huggingFaceUrl: fields.huggingFaceUrl.trim() ? normalizeUrl(fields.huggingFaceUrl) : null,
      youtubeUrl: fields.youtubeUrl.trim() ? normalizeUrl(fields.youtubeUrl) : null,
    };

    await onSubmit(payload);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel mt-4 p-4 sm:p-5"
      aria-label={isEditing ? 'Modifier la ressource' : 'Ajouter une ressource'}
      noValidate
    >
      <h3 className="text-base font-semibold tracking-tight text-paper">
        {isEditing ? 'Modifier la ressource' : 'Ajouter une ressource'}
      </h3>
      <p className="field-hint">
        Tous les champs sont facultatifs&nbsp;: renseignez uniquement ce qui est utile.
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="item-category">
            Catégorie
          </label>
          <select
            id="item-category"
            className="field-input"
            value={fields.categoryId}
            onChange={(event) => {
              const value = event.target.value;
              setCreatingCategory(value === NEW_CATEGORY_VALUE);
              setField('categoryId', value);
            }}
          >
            <option value="">Aucune catégorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
            <option value={NEW_CATEGORY_VALUE}>＋ Nouvelle catégorie…</option>
          </select>

          {creatingCategory ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="item-new-category">
                Nom de la nouvelle catégorie
              </label>
              <input
                id="item-new-category"
                className="field-input min-w-0 flex-1"
                placeholder="Nom de la catégorie"
                maxLength={60}
                autoFocus
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
              />
              <button
                type="button"
                className="btn"
                onClick={handleCreateCategory}
                disabled={categoryBusy || newCategoryName.trim() === ''}
              >
                {categoryBusy ? 'Création…' : 'Créer'}
              </button>
            </div>
          ) : null}
        </div>

        <div>
          <label className="field-label" htmlFor="item-name">
            Nom
          </label>
          <input
            id="item-name"
            className="field-input"
            placeholder="Ollama"
            maxLength={200}
            value={fields.name}
            onChange={(event) => setField('name', event.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="item-description">
            Description (en français)
          </label>
          <textarea
            id="item-description"
            className="field-input"
            rows={3}
            maxLength={4000}
            placeholder="Exécutez des grands modèles de langage en local grâce à une interface en ligne de commande."
            value={fields.description}
            onChange={(event) => setField('description', event.target.value)}
          />
        </div>

        {URL_FIELDS.map((urlField) => (
          <div key={urlField.key}>
            <label className="field-label" htmlFor={`item-${urlField.key}`}>
              {urlField.label}
            </label>
            <input
              id={`item-${urlField.key}`}
              type="text"
              inputMode="url"
              className="field-input"
              placeholder={urlField.placeholder}
              maxLength={2048}
              value={fields[urlField.key]}
              onChange={(event) => setField(urlField.key, event.target.value)}
              onBlur={() => validateUrlField(urlField.key)}
              aria-invalid={Boolean(errors[urlField.key])}
            />
            {errors[urlField.key] ? (
              <p className="field-error">⚠ {errors[urlField.key]}</p>
            ) : (
              <p className="field-hint">Icône affichée uniquement si l’URL est renseignée.</p>
            )}
          </div>
        ))}
      </div>

      {isEmpty ? (
        <p className="field-hint mt-5">
          ⓘ Tous les champs sont vides&nbsp;: cette ressource sera enregistrée sans nom, sans
          description, sans catégorie et sans lien.
        </p>
      ) : null}

      {serverIssues.length > 0 ? (
        <ul role="alert" className="field-error mt-4 space-y-1">
          {serverIssues.map((issue) => (
            <li key={issue}>⚠ {issue}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" className="btn" onClick={onCancel} disabled={submitting}>
          Annuler
        </button>
      </div>
    </form>
  );
}
