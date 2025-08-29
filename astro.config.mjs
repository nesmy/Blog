import { defineConfig } from 'astro/config'
import tailwind from '@tailwindcss/vite'
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';

// https://docs.astro.build
export default defineConfig({
  site: 'https://debugplay.com',
  prefetch: true,
  vite: {
    plugins: [tailwind()]
  },
  integrations: [
    sitemap(),
    robotsTxt({
      policy: [{ userAgent: '*', allow: '/' }],
      sitemap: 'https://blog.debugplay.com/sitemap.xml',
    }),
  ],
})
