import rules from '../data/pricing.json';
import * as core from './quote-core.js';

export type { Quote, QuoteStatus } from './quote-core.js';
type Rules = typeof rules;

export const pricing = rules;
export const gbp = core.gbp;
export const normalisePostcode = core.normalisePostcode;

/** True when the postcode is in an area we price instantly (blank counts as in-area). */
export const inCoveredArea = (postcode = '', r: Rules = rules) => core.inCoveredArea(postcode, r);
export const priceFor = (count: number, r: Rules = rules) => core.priceFor(count, r);
/** Same engine the quote API uses, so the browser and server always agree. */
export const calcQuote = (count: number, postcode = '', r: Rules = rules) => core.calcQuote(count, postcode, r);

/** "£40 covers your first 10 appliances, then £1 each" — used in copy everywhere. */
export const priceLine = (r = rules) =>
  `${gbp(r.minimumCharge)} covers your first ${r.itemsIncluded} appliances, then ${gbp(r.perExtraItem)} each`;

export const vatNote = (r = rules) => (r.vatRegistered ? 'Prices exclude VAT' : 'No VAT to add');
