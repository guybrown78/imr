import site from '../data/site.json';
import { gbp, pricing } from './pricing';

/** 07939 666650 → +447939666650. The only place the international format is made. */
export const toE164 = (uk: string) => '+44' + uk.replace(/\D/g, '').replace(/^0/, '');

export const phone = {
  display: site.phone,
  e164: toE164(site.phone),
  tel: 'tel:' + toE164(site.phone),
  whatsapp: 'https://wa.me/' + toE164(site.phone).slice(1),
};

export const waLink = (text: string) => `${phone.whatsapp}?text=${encodeURIComponent(text)}`;
export const mailto = (subject = 'PAT testing enquiry') => `mailto:${site.email}?subject=${encodeURIComponent(subject)}`;
export const yearsTrading = () => new Date().getFullYear() - site.foundedYear;
export const fromPrice = () => gbp(pricing.minimumCharge);

export { site };
