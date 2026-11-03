// Pricing rules engine shared by the website (via pricing.ts) and the Node quote API.
// Plain JS with no imports, so the server can use it without a build step. Rules come from pricing.json.

/** @typedef {{ minimumCharge: number, itemsIncluded: number, perExtraItem: number, coveredPostcodePrefixes: string[], maxInstantItems: number }} Rules */
/** @typedef {'ok' | 'outside' | 'large' | 'invalid'} QuoteStatus */
/** @typedef {{ status: QuoteStatus, count: number, price: number | null, extraItems: number }} Quote */

/** Pound formatting without pence when the amount is whole. @param {number} n */
export const gbp = (n) =>
  '£' + (Number.isInteger(n) ? n.toLocaleString('en-GB') : n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

/** @param {string} [pc] */
export const normalisePostcode = (pc = '') => String(pc).toUpperCase().replace(/\s+/g, '');

/** True when the postcode is in an area we price instantly (blank counts as in-area). @param {string} postcode @param {Rules} r */
export function inCoveredArea(postcode, r) {
  const pc = normalisePostcode(postcode);
  if (!pc) return true;
  return r.coveredPostcodePrefixes.some((p) => pc.startsWith(p) && /\d/.test(pc.charAt(p.length)));
}

/** @param {number} count @param {Rules} r */
export function priceFor(count, r) {
  const extra = Math.max(0, count - r.itemsIncluded);
  return r.minimumCharge + extra * r.perExtraItem;
}

/** @param {number} count @param {string} postcode @param {Rules} r @returns {Quote} */
export function calcQuote(count, postcode, r) {
  const n = Math.floor(Number(count));
  if (!Number.isFinite(n) || n < 1) return { status: 'invalid', count: 0, price: null, extraItems: 0 };
  const extraItems = Math.max(0, n - r.itemsIncluded);
  if (n > r.maxInstantItems) return { status: 'large', count: n, price: null, extraItems };
  const price = priceFor(n, r);
  return { status: inCoveredArea(postcode, r) ? 'ok' : 'outside', count: n, price, extraItems };
}
