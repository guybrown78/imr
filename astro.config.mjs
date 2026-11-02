import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://imrservices.net',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  integrations: [
    sitemap({ filter: (page) => !page.includes('/thanks/') && !page.includes('/admin/') }),
  ],
});
