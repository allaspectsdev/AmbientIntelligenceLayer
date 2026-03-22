import type Database from 'better-sqlite3';
import type { Agent, AgentStatus } from '@ail/common';

export class AgentRepository {
  constructor(private db: Database.Database) {}

  insert(agent: Omit<Agent, 'id' | 'createdAt'>): number {
    const result = this.db.prepare(`
      INSERT INTO agents (name, type, config_json, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(agent.name, agent.type, agent.configJson, agent.status, Date.now());
    return result.lastInsertRowid as number;
  }

  getById(id: number): Agent | undefined {
    return this.db.prepare(`
      SELECT id, name, type, config_json as configJson, status, created_at as createdAt
      FROM agents WHERE id = ?
    `).get(id) as Agent | undefined;
  }

  getAll(): Agent[] {
    return this.db.prepare(`
      SELECT id, name, type, config_json as configJson, status, created_at as createdAt
      FROM agents ORDER BY created_at DESC
    `).all() as Agent[];
  }

  updateStatus(id: number, status: AgentStatus): void {
    this.db.prepare('UPDATE agents SET status = ? WHERE id = ?').run(status, id);
  }

  delete(id: number): boolean {
    return this.db.prepare('DELETE FROM agents WHERE id = ?').run(id).changes > 0;
  }
}
