// IMR quote API. cPanel "Setup Node.js App" runs this file (Passenger) at imrservices.net/api.
import { createServer } from 'node:http';
import { handleQuote } from './lib/quote.js';
import { handleAdmin } from './lib/admin.js';
import { json } from './lib/http.js';

const server = createServer(async (req, res) => {
  // Passenger may or may not strip the /api base path, so accept both.
  const path = new URL(req.url, 'http://x').pathname.replace(/^\/api(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  try {
    if (path === '/quote') return await handleQuote(req, res);
    if (path === '/admin' || path.startsWith('/admin/')) return await handleAdmin(req, res, path.slice('/admin'.length));
    if (path === '/health') return json(res, 200, { ok: true });
    return json(res, 404, { ok: false, error: 'Not found' });
  } catch (err) {
    console.error('[imr api]', err);
    if (!res.headersSent) json(res, 500, { ok: false, error: 'Server error' });
  }
});

server.listen(process.env.PORT || 8787, () => console.log(`[imr api] listening on ${process.env.PORT || 8787}`));
