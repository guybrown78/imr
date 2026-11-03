// All secrets come from environment variables, set in cPanel → Setup Node.js App (never committed).
// Pricing and contact details come from the same JSON files the website is built from.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const shared = (file) => JSON.parse(readFileSync(fileURLToPath(new URL(`../shared/${file}`, import.meta.url)), 'utf8'));

export const pricing = shared('pricing.json');
export const site = shared('site.json');

const env = process.env;

function required(name) {
  const v = env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

export const config = {
  db: {
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 3306),
    database: required('DB_NAME'),
    user: required('DB_USER'),
    password: required('DB_PASS'),
  },
  ipSalt: required('IP_SALT'),
  sessionSecret: required('SESSION_SECRET'),
  adminHash: env.ADMIN_HASH || '',
  notifyTo: env.NOTIFY_TO || site.email,
  mail: {
    // 'sendmail' (default, uses the host's mail system), 'smtp', or 'log' for local testing.
    transport: env.MAIL_TRANSPORT || 'sendmail',
    smtpHost: env.SMTP_HOST,
    smtpPort: Number(env.SMTP_PORT || 465),
    smtpUser: env.SMTP_USER,
    smtpPass: env.SMTP_PASS,
  },
  // Off only for local http testing; the admin cookie must be Secure in production.
  secureCookies: env.INSECURE_COOKIES !== '1',
};
