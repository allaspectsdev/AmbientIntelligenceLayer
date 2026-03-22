import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let _db: Database.Database | null = null;

export function getDatabase(dataDir: string = './data'): Database.Database {
  if (_db) return _db;

  mkdirSync(dataDir, { recursive: true });
  mkdirSync(join(dataDir, 'screenshots'), { recursive: true });

  const dbPath = join(dataDir, 'ail.db');
  _db = new Database(dbPath);

  // Performance optimizations
  _db.pragma('journal_mode = WAL');
  _db.pragma('synchronous = NORMAL');
  _db.pragma('foreign_keys = ON');

  runMigrations(_db);

  return _db;
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
    );
  `);

  const migrationsDir = join(__dirname, 'migrations');
  const migrationFile = '001_initial.sql';

  const applied = db
    .prepare('SELECT name FROM _migrations WHERE name = ?')
    .get(migrationFile) as { name: string } | undefined;

  if (!applied) {
    const sql = readFileSync(join(migrationsDir, migrationFile), 'utf-8');
    db.exec(sql);
    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(migrationFile);
    console.log(`Applied migration: ${migrationFile}`);
  }
}

export function closeDatabase(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
