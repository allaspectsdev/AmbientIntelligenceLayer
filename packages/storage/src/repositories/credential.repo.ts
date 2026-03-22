import type Database from 'better-sqlite3';
import type { Credential } from '@ail/common';

export class CredentialRepository {
  constructor(private db: Database.Database) {}

  insert(name: string, service: string | null, encryptedValue: string, scope: string | null): number {
    const now = Date.now();
    const result = this.db.prepare(`
      INSERT INTO credentials (name, service, encrypted_value, scope, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, service, encryptedValue, scope, now, now);
    return result.lastInsertRowid as number;
  }

  getById(id: number): (Credential & { encryptedValue: string }) | undefined {
    return this.db.prepare(`
      SELECT id, name, service, encrypted_value as encryptedValue, scope,
             created_at as createdAt, updated_at as updatedAt
      FROM credentials WHERE id = ?
    `).get(id) as (Credential & { encryptedValue: string }) | undefined;
  }

  getByName(name: string): (Credential & { encryptedValue: string }) | undefined {
    return this.db.prepare(`
      SELECT id, name, service, encrypted_value as encryptedValue, scope,
             created_at as createdAt, updated_at as updatedAt
      FROM credentials WHERE name = ?
    `).get(name) as (Credential & { encryptedValue: string }) | undefined;
  }

  /** Lists credentials WITHOUT encrypted values */
  getAll(): Credential[] {
    return this.db.prepare(`
      SELECT id, name, service, scope, created_at as createdAt, updated_at as updatedAt
      FROM credentials ORDER BY name
    `).all() as Credential[];
  }

  update(id: number, encryptedValue: string): void {
    this.db.prepare('UPDATE credentials SET encrypted_value = ?, updated_at = ? WHERE id = ?')
      .run(encryptedValue, Date.now(), id);
  }

  delete(id: number): boolean {
    return this.db.prepare('DELETE FROM credentials WHERE id = ?').run(id).changes > 0;
  }
}
