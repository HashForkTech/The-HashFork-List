import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { MIGRATIONS, migrate } from '@/lib/db/schema';
import { createItem, getItem } from '@/lib/db/repositories/items';

describe('GitHub star count migration', () => {
  it('upgrades existing resources without treating personal ratings as GitHub counts', () => {
    const db = new Database(':memory:');
    try {
      for (const migration of MIGRATIONS.filter((entry) => entry.version <= 5)) {
        db.exec(migration.sql);
        db.pragma(`user_version = ${migration.version}`);
      }
      db.prepare(
        'INSERT INTO items (id, name, rating, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      ).run('legacy', 'Existing resource', 5, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

      migrate(db);
      migrate(db); // Reopening an upgraded database is safe.

      expect(getItem(db, 'legacy')).toMatchObject({ name: 'Existing resource', githubStars: null });
      expect(createItem(db, { name: 'Popular project', githubStars: 123456 }).githubStars).toBe(123456);
    } finally {
      db.close();
    }
  });
});
