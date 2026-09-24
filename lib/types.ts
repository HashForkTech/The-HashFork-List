/**
 * Shared domain types. These are the only shapes that cross the boundary
 * between the storage layer, the API and the UI, which keeps a future
 * migration (e.g. to PostgreSQL) contained behind the repositories.
 */

export type Category = {
  id: string;
  name: string;
  createdAt: string;
};

export type CategoryWithCount = Category & {
  itemCount: number;
};

export type ListItem = {
  id: string;
  categoryId?: string | null;
  name?: string | null;
  description?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  huggingFaceUrl?: string | null;
  youtubeUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Writable subset of a list item — every field is optional. */
export type ItemPayload = {
  categoryId?: string | null;
  name?: string | null;
  description?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  huggingFaceUrl?: string | null;
  youtubeUrl?: string | null;
};

export const BACKUP_FORMAT = 'the-hashfork-list/backup';
export const BACKUP_VERSION = 1;

export type BackupFile = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  categories: Category[];
  items: ListItem[];
};
