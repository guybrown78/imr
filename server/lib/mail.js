import nodemailer from 'nodemailer';
import { config } from './config.js';

let transport;

function getTransport() {
  const m = config.mail;
  if (transport) return transport;
  if (m.transport === 'log') transport = nodemailer.createTransport({ jsonTransport: true });
  else if (m.transport === 'smtp')
    transport = nodemailer.createTransport({ host: m.smtpHost, port: m.smtpPort, secure: m.smtpPort === 465, auth: { user: m.smtpUser, pass: m.smtpPass } });
  else transport = nodemailer.createTransport({ sendmail: true, newline: 'unix', path: '/usr/sbin/sendmail' });
  return transport;
}

/** Best-effort: the enquiry is already saved, so a mail failure is logged, not thrown. */
export async function sendMail(message) {
  try {
    const info = await getTransport().sendMail(message);
    if (config.mail.transport === 'log') console.log('[imr mail]', info.message.toString());
  } catch (err) {
    console.error('[imr mail] failed:', err.message);
  }
}
