import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { hostname, userInfo } from 'node:os';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

let _cachedKey: Buffer | null = null;

function getSaltPath(): string {
  const dataDir = process.env.DATA_DIR || './data';
  return join(dataDir, '.crypto-salt');
}

function getOrCreateSalt(): string {
  const saltPath = getSaltPath();
  try {
    if (existsSync(saltPath)) {
      return readFileSync(saltPath, 'utf-8').trim();
    }
  } catch { /* will create new */ }

  // Generate random salt on first use
  const salt = randomBytes(32).toString('hex');
  try {
    mkdirSync(dirname(saltPath), { recursive: true });
    writeFileSync(saltPath, salt, { mode: 0o600 }); // Owner-only permissions
  } catch {
    console.warn('[Crypto] Could not persist salt — using ephemeral salt');
  }
  return salt;
}

function deriveKey(): Buffer {
  if (_cachedKey) return _cachedKey;
  const seed = `${hostname()}-${userInfo().username}-ail`;
  const salt = getOrCreateSalt();
  _cachedKey = scryptSync(seed, salt, 32);
  return _cachedKey;
}

export function encrypt(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`;
}

export function decrypt(encryptedStr: string): string {
  const key = deriveKey();
  const parts = encryptedStr.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted format');

  const iv = Buffer.from(parts[0], 'base64');
  const tag = Buffer.from(parts[1], 'base64');
  const encrypted = parts[2];

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
