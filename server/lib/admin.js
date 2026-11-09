// /api/admin – read-only enquiries inbox behind a password (hash in the ADMIN_HASH env var).
import { gbp } from '../shared/quote-core.js';
import { config } from './config.js';
import { db } from './db.js';
import { verifyPassword, createSession, validSession, SESSION_MAX_AGE } from './auth.js';
import { readBody, html, redirect, cookies, escapeHtml as h } from './http.js';

const COOKIE = 'imr_admin';
const PATH = '/api/admin';
const cookie = (value, maxAge) =>
  `${COOKIE}=${value}; Path=${PATH}; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${config.secureCookies ? '; Secure' : ''}`;

const page = (title, body, styles) => `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title><style>${styles}</style>${body}</html>`;

const loginPage = (error = '') =>
  page(
    'IMR inbox',
    `<form method="post" action="${PATH}/"><strong>IMR enquiries</strong>${error ? `<p class="err">${error}</p>` : ''}<input type="password" name="password" placeholder="Password" autofocus required><button>Sign in</button></form>`,
    'body{font:16px system-ui;background:#F3FAF6;display:grid;place-items:center;min-height:100vh;margin:0}form{background:#fff;padding:2rem;border-radius:12px;display:grid;gap:.75rem;border:1px solid #d4e6dc}input,button{font:inherit;padding:.7rem;border-radius:8px;border:1px solid #a9c9b8}button{background:#0B5D3B;color:#fff;border:0}.err{color:#a3261b;margin:0}',
  );

const when = (s) => new Date(String(s).replace(' ', 'T') + 'Z').toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

function inboxPage(rows) {
  const tr = rows
    .map(
      (r) => `<tr><td>${h(when(r.created_at))}</td><td>${h(r.ref)}</td>
<td>${h(r.name)}<br><small>${h(r.business)}</small></td>
<td><a href="tel:${h(r.phone)}">${h(r.phone)}</a><br><a href="mailto:${h(r.email)}">${h(r.email)}</a></td>
${r.quote_status === 'message' ? `<td colspan="2"><strong class="msg">Message</strong></td>` : `<td>${Number(r.appliances)}</td><td>${h(r.quoted_price === null ? 'TBC' : gbp(Number(r.quoted_price)))}<br><small>${h(r.quote_status)}</small></td>`}
<td>${h(r.postcode)}</td><td>${h(r.preferred)}</td><td>${h(r.message).replace(/\n/g, '<br>')}</td></tr>`,
    )
    .join('');
  return page(
    `IMR inbox (${rows.length})`,
    `<p><strong>Enquiries</strong> · latest ${rows.length} · <a href="${PATH}/logout/">Sign out</a></p>
<div class="wrap"><table><tr><th>When</th><th>Ref</th><th>Name / business</th><th>Contact</th><th>Items</th><th>Price</th><th>Postcode</th><th>When suits</th><th>Message</th></tr>${tr}</table></div>`,
    'body{font:14px system-ui;background:#F3FAF6;color:#0B1F16;margin:0;padding:1rem}table{border-collapse:collapse;width:100%;background:#fff}th,td{text-align:left;padding:.5rem;border-bottom:1px solid #d4e6dc;vertical-align:top}th{font:12px ui-monospace,monospace;text-transform:uppercase;color:#0B5D3B}.wrap{overflow-x:auto}a{color:#0B5D3B}.msg{background:#FFE9A8;padding:.15rem .4rem;border-radius:4px;font-size:12px}',
  );
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

export async function handleAdmin(req, res, sub) {
  if (sub === '/logout') return redirect(res, `${PATH}/`, { 'Set-Cookie': cookie('', 0) });

  if (req.method === 'POST') {
    const body = await readBody(req).catch(() => ({}));
    if (config.adminHash && verifyPassword(body.password || '', config.adminHash)) {
      return redirect(res, `${PATH}/`, { 'Set-Cookie': cookie(createSession(config.sessionSecret), SESSION_MAX_AGE) });
    }
    await pause(400); // slow down guessing
    return html(res, 401, loginPage('Wrong password.'));
  }

  if (!validSession(cookies(req)[COOKIE], config.sessionSecret)) return html(res, 200, loginPage());

  const [rows] = await db().query('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 300');
  return html(res, 200, inboxPage(rows));
}
