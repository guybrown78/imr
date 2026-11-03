import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, createSession, validSession } from '../server/lib/auth.js';

describe('admin password', () => {
  it('verifies the right password and rejects others', () => {
    const stored = hashPassword('correct horse battery');
    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(verifyPassword('correct horse battery', stored)).toBe(true);
    expect(verifyPassword('wrong', stored)).toBe(false);
  });
  it('rejects a missing or malformed hash', () => {
    expect(verifyPassword('x', '')).toBe(false);
    expect(verifyPassword('x', 'md5$abc')).toBe(false);
  });
});

describe('admin session cookie', () => {
  const secret = 'test-secret';
  it('accepts its own fresh cookie', () => {
    expect(validSession(createSession(secret), secret)).toBe(true);
  });
  it('rejects tampered, foreign or expired cookies', () => {
    const c = createSession(secret);
    const [exp, sig] = c.split('.');
    expect(validSession(`${Number(exp) + 1000}.${sig}`, secret)).toBe(false);
    expect(validSession(c, 'other-secret')).toBe(false);
    expect(validSession(createSession(secret, Date.now() - 13 * 3600 * 1000), secret)).toBe(false);
    expect(validSession('', secret)).toBe(false);
  });
});
