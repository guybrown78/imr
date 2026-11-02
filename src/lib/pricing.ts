import rules from '../data/pricing.json';

export type QuoteStatus = 'ok' | 'outside' | 'large' | 'invalid';
export interface Quote {
  status: QuoteStatus;
  count: number;
  price: number | null;
  extraItems: number;
}

export const pricing = rules;

/** Pound formatting without pence when the amount is whole. */
export const gbp = (n: number) =>
  '£' + (Number.isInteger(n) ? n.toLocaleString('en-GB') : n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

export const normalisePostcode = (pc = '') => pc.toUpperCase().replace(/\s+/g, '');

/** True when the postcode is in an area we price instantly (blank counts as in-area). */
export function inCoveredArea(postcode = '', r = rules): boolean {
  const pc = normalisePostcode(postcode);
  if (!pc) return true;
  return r.coveredPostcodePrefixes.some((p) => pc.startsWith(p) && /\d/.test(pc.charAt(p.length)));
}

export function priceFor(count: number, r = rules): number {
  const extra = Math.max(0, count - r.itemsIncluded);
  return r.minimumCharge + extra * r.perExtraItem;
}

export function calcQuote(count: number, postcode = '', r = rules): Quote {
  const n = Math.floor(Number(count));
  if (!Number.isFinite(n) || n < 1) return { status: 'invalid', count: 0, price: null, extraItems: 0 };
  const extraItems = Math.max(0, n - r.itemsIncluded);
  if (n > r.maxInstantItems) return { status: 'large', count: n, price: null, extraItems };
  const price = priceFor(n, r);
  return { status: inCoveredArea(postcode, r) ? 'ok' : 'outside', count: n, price, extraItems };
}

/** "£40 covers your first 10 appliances, then £1 each" — used in copy everywhere. */
export const priceLine = (r = rules) =>
  `${gbp(r.minimumCharge)} covers your first ${r.itemsIncluded} appliances, then ${gbp(r.perExtraItem)} each`;

export const vatNote = (r = rules) => (r.vatRegistered ? 'Prices exclude VAT' : 'No VAT to add');
