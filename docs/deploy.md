# Deploying imrservices.net

Two parts, both uploaded by GitHub Actions on every push to `main` (once the launch switch is on):

- **The site**: static files from `dist/`, uploaded to `public_html`.
- **The quote API**: the Node.js app in `server/`, uploaded to `~/imr-api` (outside the web root) and run by cPanel's **Setup Node.js App** at `imrservices.net/api`.

No webhooks are needed on the host.

## Change prices or contact details
- Prices: edit `src/data/pricing.json`.
- Phone and email: edit `src/data/site.json`.

Commit and push to `main`. Every page, the calculator, the structured data and the quote API update from those two files. The API uses the same pricing code as the website (`src/lib/quote-core.js`).

## One-time setup

### 1. cPanel: database and email
1. **MySQL Databases**: create a database (e.g. `imr`) and a user, and give the user ALL privileges on it. cPanel prefixes both with your username, e.g. `cpuser_imr`.
2. **phpMyAdmin**: select the database, then **SQL**, and paste `db/schema.sql`.
3. **Email Accounts**: make sure `info@imrservices.net` exists.

### 2. cPanel: Node.js app
In **Setup Node.js App**, click **Create Application**:

| Field | Value |
| --- | --- |
| Node.js version | The newest offered (18 or later) |
| Application mode | Production |
| Application root | `imr-api` |
| Application URL | `imrservices.net` / `api` |
| Application startup file | `start.cjs` |

Then add these **environment variables** on the same screen (they are the app's secrets; they never go in git):

| Name | Value |
| --- | --- |
| `DB_NAME` | full database name, e.g. `cpuser_imr` |
| `DB_USER` | full database user, e.g. `cpuser_imr` |
| `DB_PASS` | the database user's password |
| `IP_SALT` | a long random string |
| `SESSION_SECRET` | a different long random string |
| `ADMIN_HASH` | output of `npm --prefix server run hash-password` (run locally) |
| `NOTIFY_TO` | optional, defaults to the email in `site.json` |

Random strings: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

Email is sent through the server's own mail system (sendmail), so no mailbox password is needed. If mail doesn't arrive, set `MAIL_TRANSPORT=smtp` plus `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` and `SMTP_PASS` for the info@ mailbox.

Click **Save**, then **Restart** after the first deploy. See `server/.env.example` for every option.

cPanel stores these values in `public_html/api/.htaccess`, next to the Passenger block that routes `/api` to the app. The site upload never touches `public_html/api/`.

### 3. SSH key for GitHub
1. Locally: `ssh-keygen -t ed25519 -f imr_deploy -N ""`
2. cPanel **SSH Access**, then **Manage SSH Keys**, then **Import Key**: paste `imr_deploy.pub` and **Authorize** it.
3. GitHub repo, then **Settings → Secrets and variables → Actions**:
   - Secrets: `SSH_HOST` (server hostname from your HostPresto welcome email), `SSH_USER` (cPanel username), `SSH_KEY` (contents of `imr_deploy`), `SSH_PORT` (`88` on HostPresto; port 22 is blocked even though their panel lists it for SFTP).
   - Variables (optional): `DEPLOY_PATH` (default `public_html`) and `API_PATH` (default `imr-api`).
   - Variable: `DEPLOY_ENABLED` = `true`. This is the launch switch. Until it's set, pushes only test and build, and nothing is uploaded.
4. Delete the local private key once it's saved in GitHub.

### 4. Staging (optional)
In cPanel, create a `staging.imrservices.net` subdomain. On a `staging` GitHub environment, set `DEPLOY_PATH` to that subdomain's folder. Pushing the `staging` branch then deploys there.
Add `Header set X-Robots-Tag "noindex"` to that folder's `.htaccess` so Google ignores it.

## How the deploy works
1. Install, test and build (`dist/` plus `server/shared/`, the pricing files the API shares with the site).
2. Save cPanel's Node.js (Passenger) block from `public_html/.htaccess`, upload the site, then put the block back, so a deploy never disconnects the API.
3. Upload `server/` to `~/imr-api`, run `npm install` inside cPanel's Node environment, and restart the app (`tmp/restart.txt`).
4. Check `https://imrservices.net/api/health/` answers.

## Enquiries
- Each enquiry is stored in the MySQL table `enquiries`, and an email goes to `info@` with a copy to the customer.
- Inbox: https://imrservices.net/api/admin/ (password = the one you hashed into `ADMIN_HASH`).

## Before launch
- Back up the old site: in cPanel **File Manager**, compress `public_html` and download it.
- After the first deploy, check that `curl -I https://imrservices.net/pat-testing.htm` returns `301` to `/pat-testing/`, and send a test quote.
- Submit `https://imrservices.net/sitemap-index.xml` in Google Search Console.
- Update the phone and email on Google Business Profile, Yell and FreeIndex to match `site.json`.
