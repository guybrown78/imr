// Tiny request/response helpers so the API needs no framework.

const MAX_BODY = 20 * 1024;

/** Reads a urlencoded (or JSON) body into a plain object. */
export function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Body too large'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        if ((req.headers['content-type'] || '').includes('application/json')) resolve(JSON.parse(raw || '{}'));
        else resolve(Object.fromEntries(new URLSearchParams(raw)));
      } catch {
        reject(Object.assign(new Error('Bad body'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

export function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', ...headers });
  res.end(body);
}

export const json = (res, status, data) => send(res, status, JSON.stringify(data), { 'Content-Type': 'application/json' });
export const html = (res, status, body, headers = {}) => send(res, status, body, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
export const redirect = (res, location, headers = {}) => send(res, 303, '', { Location: location, ...headers });

/** Client IP behind Apache/Passenger. Only used (hashed) for rate limiting. */
export function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
  return fwd.at(-1) || req.headers['x-real-ip'] || req.socket.remoteAddress || '';
}

export function cookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter(([k]) => k).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]),
  );
}

/** Trim, strip control characters and cap length. */
export function clean(v, max) {
  return String(v ?? '').trim().replace(/[\x00-\x1F\x7F]/g, ' ').slice(0, max);
}

export const escapeHtml = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
