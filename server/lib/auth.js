// Admin password hashing (scrypt) and a signed, stateless session cookie. Node built-ins only.
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';

const KEYLEN = 32;

/** Returns "scrypt$<salt>$<hash>" (base64url). */
export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(String(password), salt, KEYLEN);
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export function verifyPassword(password, stored) {
  const [kind, salt, hash] = String(stored || '').split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const actual = scryptSync(String(password), Buffer.from(salt, 'base64url'), expected.length);
  return timingSafeEqual(actual, expected);
}

const SESSION_HOURS = 12;
const sign = (value, secret) => createHmac('sha256', secret).update(value).digest('base64url');

/** Cookie value "<expiry>.<signature>". */
export function createSession(secret, now = Date.now()) {
  const exp = String(now + SESSION_HOURS * 3600 * 1000);
  return `${exp}.${sign(exp, secret)}`;
}

export function validSession(value, secret, now = Date.now()) {
  const [exp, sig] = String(value || '').split('.');
  if (!exp || !sig || Number(exp) < now) return false;
  const expected = Buffer.from(sign(exp, secret));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export const SESSION_MAX_AGE = SESSION_HOURS * 3600;
