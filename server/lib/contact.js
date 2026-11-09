// POST /api/contact – a general message from the contact page. Saved alongside quotes in the
// enquiries table (quote_status 'message', appliances 0) so it shows in the admin inbox, then emailed.
// Works for fetch() (JSON response) and plain form posts (redirects to /message-sent/).
import { createHash, randomBytes } from 'node:crypto';
import { config, site } from './config.js';
import { db } from './db.js';
import { sendMail } from './mail.js';
import { readBody, json, redirect, clientIp, clean } from './http.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const newRef = () => 'MSG-' + randomBytes(3).toString('hex').toUpperCase();

export async function handleContact(req, res) {
  const wantsJson = String(req.headers.accept || '').includes('application/json');
  const reply = (ok, extra = {}, status = 200) =>
    wantsJson ? json(res, status, { ok, ...extra }) : redirect(res, ok ? '/message-sent/' : '/contact/?error=1#message');

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
  const email = clean(body.email, 120);
  const phone = clean(body.phone, 20);
  const message = String(body.message ?? '').trim().slice(0, 3000);

  if (!name || !EMAIL_RE.test(email)) return reply(false, { error: 'Please fill in your name and a valid email.' }, 422);
  if (message.length < 2) return reply(false, { error: 'Please write your message.' }, 422);

  const ref = newRef();
  const ipHash = createHash('sha256').update(clientIp(req) + config.ipSalt).digest('hex');

  try {
    const [[{ recent }]] = await db().execute(
      'SELECT COUNT(*) AS recent FROM enquiries WHERE ip_hash = ? AND created_at > (NOW() - INTERVAL 1 HOUR)',
      [ipHash],
    );
    if (recent >= 5) return reply(false, { error: 'Too many messages. Please call or WhatsApp us instead.' }, 429);

    await db().execute(
      `INSERT INTO enquiries (ref, name, email, phone, appliances, quote_status, message, source_page, ip_hash)
       VALUES (?,?,?,?,0,'message',?,'contact',?)`,
      [ref, name, email, phone, message, ipHash],
    );
  } catch (err) {
    console.error('[imr contact]', err.message);
    return reply(false, { error: "We couldn't send that just now." }, 500);
  }

  const from = `${site.name} <${site.email}>`;
  const preview = message.replace(/\s+/g, ' ').slice(0, 50) + (message.length > 50 ? '…' : '');

  await Promise.all([
    sendMail({
      from,
      to: config.notifyTo,
      replyTo: `${name} <${email}>`,
      subject: `📩 WEBSITE MESSAGE from ${name}: "${preview}" [${ref}]`,
      text:
        `New message from the website contact form (${ref}).\n` +
        `Just hit Reply to answer ${name.split(' ')[0]} directly.\n\n` +
        `Name:   ${name}\nEmail:  ${email}\nPhone:  ${phone || '(not given)'}\n\n` +
        `Message:\n${message}\n`,
    }),
    sendMail({
      from,
      to: email,
      subject: `We've got your message (${ref})`,
      text:
        `Hi ${name.split(' ')[0]},\n\nThanks for getting in touch. We've received your message and will get back to you as soon as we can.\n\n` +
        `Your message:\n${message}\n\n` +
        `If it's urgent, call or WhatsApp ${site.phone}.\n\n` +
        `${site.name}\n${site.url}\n`,
    }),
  ]);

  return reply(true, { ref });
}
