// Copies the pricing engine and data the Node quote API shares with the site into server/shared/.
// Run before starting or deploying the API, so it always uses the same rules as the website.
import { rmSync, mkdirSync, cpSync } from 'node:fs';

const out = 'server/shared';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync('src/lib/quote-core.js', `${out}/quote-core.js`);
cpSync('src/data/pricing.json', `${out}/pricing.json`);
cpSync('src/data/site.json', `${out}/site.json`);

console.log(`[build-api] wrote ${out}/`);
