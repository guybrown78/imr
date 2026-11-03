# imrservices.net

A static Astro site plus a small Node.js + MySQL quote API (`server/`), hosted on HostPresto and deployed by GitHub Actions on every push to `main`.

```bash
nvm use            # Node 24
npm install
npm run dev        # http://localhost:4321
npm test           # pricing + auth unit tests
npm run build      # → dist/ (and copies shared pricing into server/shared/)
```

### Quote API locally
The form posts to `/api/quote/`, which `npm run dev` proxies to the Node API on port 8787.
```bash
npm install --prefix server
cp server/.env.example server/.env   # point it at a local MySQL, set MAIL_TRANSPORT=log, INSECURE_COOKIES=1
npm run api                          # http://localhost:8787 · inbox at http://localhost:4321/api/admin/
```
Quick local MySQL: `docker run -d --name imr-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=imr -e MYSQL_USER=imr -e MYSQL_PASSWORD=imrpw -p 3307:3306 mysql:8.0`, then load `db/schema.sql`.

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
