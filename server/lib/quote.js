// POST /api/quote – saves a quote request to MySQL and emails the business.
// Works for fetch() (JSON response) and plain form posts (redirects to /thanks/).
import { createHash, randomBytes } from 'node:crypto';
import { calcQuote, gbp, normalisePostcode } from '../shared/quote-core.js';
import { config, pricing, site } from './config.js';
import { db } from './db.js';
import { sendMail } from './mail.js';
import { readBody, json, redirect, clientIp, clean } from './http.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const newRef = () => 'IMR-' + randomBytes(3).toString('hex').toUpperCase();

export async function handleQuote(req, res) {
  const wantsJson = String(req.headers.accept || '').includes('application/json');
  const reply = (ok, extra = {}, status = 200) =>
    wantsJson ? json(res, status, { ok, ...extra }) : redirect(res, ok ? '/thanks/' : '/quote/?error=1');

  if (req.method !== 'POST') return reply(false, { error: 'Method not allowed.' }, 405);

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    return reply(false, { error: 'Bad request.' }, err.status || 400);
  }

  // Bots: honeypot filled, or submitted faster than a human could (JS sets ts on page load).
  const ts = Number(body.ts) || 0;
  if (clean(body.website, 200) || (ts > 0 && Date.now() - ts < 2500)) return reply(true, { ref: newRef() }); // pretend success

  const name = clean(body.name, 80);
  const business = clean(body.business, 120);
  const phone = clean(body.phone, 20);
  const email = clean(body.email, 120);
  const postcode = clean(body.pc, 9).toUpperCase();
  const count = Math.floor(Number(body.n)) || 0;
  const when = clean(body.when, 60);
  const message = String(body.message ?? '').trim().slice(0, 1500);
  const source = clean(body.source, 80);

  if (!name || !phone || !EMAIL_RE.test(email)) return reply(false, { error: 'Please fill in your name, phone and a valid email.' }, 422);
  if (count < 1 || count > 99999) return reply(false, { error: 'Please enter how many appliances you have.' }, 422);

  // Price is always recalculated here from pricing.json; anything the browser sent is ignored.
  const q = calcQuote(count, normalisePostcode(postcode), pricing);
  const ref = newRef();
  const ipHash = createHash('sha256').update(clientIp(req) + config.ipSalt).digest('hex');

  try {
    const [[{ recent }]] = await db().execute(
      'SELECT COUNT(*) AS recent FROM enquiries WHERE ip_hash = ? AND created_at > (NOW() - INTERVAL 1 HOUR)',
      [ipHash],
    );
    if (recent >= 5) return reply(false, { error: 'Too many requests. Please call or WhatsApp us instead.' }, 429);

    await db().execute(
      `INSERT INTO enquiries (ref, name, business, email, phone, postcode, appliances, quoted_price, quote_status, preferred, message, source_page, ip_hash)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [ref, name, business || null, email, phone, postcode || null, count, q.price, q.status, when || null, message || null, source || null, ipHash],
    );
  } catch (err) {
    console.error('[imr quote]', err.message);
    return reply(false, { error: "We couldn't send that just now." }, 500);
  }

  const priceText = q.price === null ? 'TBC' : q.status === 'ok' ? gbp(q.price) : `${gbp(q.price)} (${q.status} – confirm)`;
  const from = `${site.name} <${site.email}>`;

  await Promise.all([
    sendMail({
      from,
      to: config.notifyTo,
      replyTo: email,
      subject: `New PAT quote ${ref} – ${count} items – ${priceText}`,
      text:
        `New quote request ${ref}\n\n` +
        `Name:       ${name}\nBusiness:   ${business}\nPhone:      ${phone}\nEmail:      ${email}\nPostcode:   ${postcode}\n` +
        `Appliances: ${count}\nPrice:      ${priceText}\nWhen:       ${when}\nSource:     ${source}\n\nMessage:\n${message}\n`,
    }),
    sendMail({
      from,
      to: email,
      subject: `Your PAT testing request (${ref})`,
      text:
        `Hi ${name.split(' ')[0]},\n\nThanks for your PAT testing request. Your reference is ${ref}.\n\n` +
        `Appliances: ${count}\nPrice: ${priceText}\n\n` +
        `We'll get back to you as soon as we can to agree a date that suits you. If it's urgent, call or WhatsApp ${site.phone}.\n\n` +
        `${site.name}\n${site.url}\n`,
    }),
  ]);

  return reply(true, { ref, price: q.price, status: q.status });
}
