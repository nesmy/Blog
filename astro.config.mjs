import { defineConfig } from 'astro/config'
import tailwind from '@tailwindcss/vite'

// https://docs.astro.build
export default defineConfig({
  site: 'https://example.com', // set this later
  prefetch: true,
  vite: {
    plugins: [tailwind()]
  }
})
