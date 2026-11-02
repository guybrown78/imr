import { describe, it, expect } from 'vitest';
import { calcQuote, priceFor, inCoveredArea, gbp } from '../src/lib/pricing';
import { toE164 } from '../src/lib/site';
import rules from '../src/data/pricing.json';

describe('pricing (from pricing.json)', () => {
  it('applies the minimum charge up to the included items', () => {
    expect(priceFor(1)).toBe(rules.minimumCharge);
    expect(priceFor(rules.itemsIncluded)).toBe(rules.minimumCharge);
  });
  it('adds the per-item rate after the included items', () => {
    expect(priceFor(rules.itemsIncluded + 1)).toBe(rules.minimumCharge + rules.perExtraItem);
    expect(priceFor(50)).toBe(rules.minimumCharge + (50 - rules.itemsIncluded) * rules.perExtraItem);
  });
  it('matches the current published examples (£40 min, 10 included, £1 each)', () => {
    const r = { ...rules, minimumCharge: 40, itemsIncluded: 10, perExtraItem: 1 };
    expect([1, 10, 11, 50].map((n) => priceFor(n, r))).toEqual([40, 40, 41, 80]);
  });
  it('flags postcodes outside the covered prefixes', () => {
    expect(calcQuote(20, 'TS18 1AB').status).toBe('ok');
    expect(calcQuote(20, 'ts5').status).toBe('ok');
    expect(calcQuote(20, '').status).toBe('ok');
    expect(calcQuote(20, 'DL1 1AA').status).toBe('outside');
    expect(inCoveredArea('TSX')).toBe(false);
  });
  it('handles invalid and very large counts', () => {
    expect(calcQuote(0).status).toBe('invalid');
    expect(calcQuote(NaN).status).toBe('invalid');
    expect(calcQuote(rules.maxInstantItems + 1).status).toBe('large');
  });
  it('formats pounds', () => {
    expect(gbp(40)).toBe('£40');
    expect(gbp(1250)).toBe('£1,250');
    expect(gbp(1.5)).toBe('£1.50');
  });
});

describe('contact', () => {
  it('derives the international number from the single stored number', () => {
    expect(toE164('07939 666650')).toBe('+447939666650');
  });
});
