// IMR quote API. cPanel "Setup Node.js App" runs this file (Passenger) at imrservices.net/api.
import { createServer } from 'node:http';
import { handleQuote } from './lib/quote.js';
import { handleContact } from './lib/contact.js';
import { handleAdmin } from './lib/admin.js';
import { json } from './lib/http.js';
import { db } from './lib/db.js';

// 'ok', or the database error code only (e.g. ER_ACCESS_DENIED_ERROR), so it is safe to show publicly.
async function dbStatus() {
  try {
    await db().query('SELECT 1 FROM enquiries LIMIT 1');
    return 'ok';
  } catch (err) {
    return err.code || 'error';
  }
}

const server = createServer(async (req, res) => {
  // Passenger may or may not strip the /api base path, so accept both.
  const path = new URL(req.url, 'http://x').pathname.replace(/^\/api(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  try {
    if (path === '/quote') return await handleQuote(req, res);
    if (path === '/contact') return await handleContact(req, res);
    if (path === '/admin' || path.startsWith('/admin/')) return await handleAdmin(req, res, path.slice('/admin'.length));
    if (path === '/health') return json(res, 200, { ok: true, db: await dbStatus() });
    return json(res, 404, { ok: false, error: 'Not found' });
  } catch (err) {
    console.error('[imr api]', err);
    if (!res.headersSent) json(res, 500, { ok: false, error: 'Server error' });
  }
});

server.listen(process.env.PORT || 8787, () => console.log(`[imr api] listening on ${process.env.PORT || 8787}`));
