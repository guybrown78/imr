# Deploying imrservices.net

The site builds into static files in `dist/` and is uploaded to HostPresto by GitHub Actions on every push to `main`. No webhooks are needed on the host.

## Change prices or contact details
- Prices: edit `src/data/pricing.json`.
- Phone and email: edit `src/data/site.json`.

Commit and push to `main`. Every page, the calculator, the structured data and the PHP quote API update from those two files.

## One-time setup

### 1. cPanel: database
1. **MySQL Databases**: create the database `imr` and a user, and give the user ALL privileges on it.
2. **phpMyAdmin**: select the database, then **SQL**, and paste `db/schema.sql`.
3. **Email Accounts**: make sure `info@imrservices.net` exists.

### 2. cPanel: server config (outside the web root)
1. Use **File Manager** to open your home directory, which is the folder above `public_html`.
2. Upload `api-config/imr-config.sample.php` as `imr-config.php` and fill in the database details, `ip_salt` and `admin_hash`.
   To generate the hash without local PHP, use cPanel **Terminal**: `php -r "echo password_hash('YOUR-PASSWORD', PASSWORD_DEFAULT);"`

### 3. SSH key for GitHub
1. Locally: `ssh-keygen -t ed25519 -f imr_deploy -N ""`
2. cPanel **SSH Access**, then **Manage SSH Keys**, then **Import Key**: paste `imr_deploy.pub` and **Authorize** it.
3. GitHub repo, then **Settings → Secrets and variables → Actions**:
   - Secrets: `SSH_HOST` (server hostname from your HostPresto welcome email), `SSH_USER` (cPanel username), `SSH_KEY` (contents of `imr_deploy`), `SSH_PORT` (usually `22`; check SSH Access).
   - Variable (optional): `DEPLOY_PATH`, which defaults to `public_html`.
   - Variable: `DEPLOY_ENABLED` = `true`. This is the launch switch. Until it's set, pushes only test and build, and nothing is uploaded.
4. Delete the local private key once it's saved in GitHub.

If HostPresto has SSH turned off on your plan, ask support to enable it. The fallback is FTPS with `SamKirkland/FTP-Deploy-Action`.

### 4. Staging (optional)
In cPanel, create a `staging.imrservices.net` subdomain. On a `staging` GitHub environment, set `DEPLOY_PATH` to that subdomain's folder. Pushing the `staging` branch then deploys there.
Add `Header set X-Robots-Tag "noindex"` to that folder's `.htaccess` so Google ignores it.

## Enquiries
- Each enquiry is stored in the MySQL table `enquiries`, and an email goes to `info@` with a copy to the customer.
- Inbox: https://imrservices.net/admin/ (password = the one you hashed).

## Before launch
- Back up the old site: in cPanel **File Manager**, compress `public_html` and download it.
- After the first deploy, check that `curl -I https://imrservices.net/pat-testing.htm` returns `301` to `/pat-testing/`.
- Submit `https://imrservices.net/sitemap-index.xml` in Google Search Console.
- Update the phone and email on Google Business Profile, Yell and FreeIndex to match `site.json`.
