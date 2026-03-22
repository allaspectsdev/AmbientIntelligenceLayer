import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { ExecutionContext } from '../runners/types.js';

/**
 * Resolves {{placeholder}} tokens in template scripts.
 * All resolution is deterministic code — zero LLM tokens.
 *
 * Built-in resolvers:
 * - {{today}}        → 2026-03-22
 * - {{now}}          → 2026-03-22T14:30:00.000Z
 * - {{weekday}}      → Saturday
 * - {{year}}         → 2026
 * - {{month}}        → 03
 * - {{day}}          → 22
 * - {{hour}}         → 14
 * - {{timestamp}}    → 1774156157654
 * - {{latest_file:path}} → most recently modified file in path
 * - {{env:VAR_NAME}} → process.env.VAR_NAME
 * - {{config:key}}   → from context params
 * - {{literal:value}} → the value itself (passthrough)
 */
export function resolveTemplate(template: string, context?: ExecutionContext): string {
  const now = new Date();
  const params = context?.params || {};

  return template.replace(/\{\{([^}]+)\}\}/g, (_match, token: string) => {
    const trimmed = token.trim();

    // Check context params first (override built-ins)
    if (params[trimmed] !== undefined) return params[trimmed];

    // Built-in resolvers
    if (trimmed === 'today') return now.toISOString().split('T')[0];
    if (trimmed === 'now') return now.toISOString();
    if (trimmed === 'weekday') return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    if (trimmed === 'year') return String(now.getFullYear());
    if (trimmed === 'month') return String(now.getMonth() + 1).padStart(2, '0');
    if (trimmed === 'day') return String(now.getDate()).padStart(2, '0');
    if (trimmed === 'hour') return String(now.getHours()).padStart(2, '0');
    if (trimmed === 'timestamp') return String(now.getTime());

    // Parameterized resolvers (prefix:arg)
    if (trimmed.startsWith('latest_file:')) {
      const dir = trimmed.substring('latest_file:'.length);
      return resolveLatestFile(dir);
    }

    if (trimmed.startsWith('env:')) {
      const varName = trimmed.substring('env:'.length);
      return process.env[varName] || `(env:${varName} not set)`;
    }

    if (trimmed.startsWith('config:')) {
      const key = trimmed.substring('config:'.length);
      return params[key] || `(config:${key} not set)`;
    }

    if (trimmed.startsWith('literal:')) {
      return trimmed.substring('literal:'.length);
    }

    // Unresolved — leave as-is for debugging
    return `{{${trimmed}}}`;
  });
}

function resolveLatestFile(dir: string): string {
  try {
    const files = readdirSync(dir)
      .filter(f => !f.startsWith('.'))
      .map(f => ({ name: f, mtime: statSync(join(dir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);

    return files.length > 0 ? join(dir, files[0].name) : '(no files)';
  } catch {
    return `(dir not accessible: ${dir})`;
  }
}
