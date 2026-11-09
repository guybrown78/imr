import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://imrservices.net',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  // In dev, the quote form talks to the local Node API (npm run api).
  vite: { server: { proxy: { '/api': 'http://localhost:8787' } } },
  integrations: [
    sitemap({ filter: (page) => !page.includes('/thanks/') && !page.includes('/message-sent/') }),
  ],
});
