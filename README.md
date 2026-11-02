# imrservices.net

A static Astro site plus a small PHP/MySQL quote API, hosted on HostPresto and deployed by GitHub Actions on every push to `main`.

```bash
nvm use            # Node 24
npm install
npm run dev        # http://localhost:4321
npm test           # pricing unit tests
npm run build      # → dist/
```

## Edit these, not the pages
| What | File |
| --- | --- |
| Prices (minimum charge, items included, price per extra item, covered postcodes) | `src/data/pricing.json` |
| Phone, email, opening hours, credentials, reviews | `src/data/site.json` |
| Town pages (one entry = one page) | `src/data/areas.json` |
| Sector pages | `src/data/sectors.json` |
| Guides (Markdown) | `src/content/guides/*.md` |

Never type a price or phone number straight into a page or guide. Import it from `src/lib/pricing.ts` or `src/lib/site.ts`.

See `docs/deploy.md` for server setup and `docs/research.md` for the competitor research.
