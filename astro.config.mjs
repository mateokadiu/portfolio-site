import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mateokadiu.com',
  trailingSlash: 'always',
  output: 'static',
  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/embeds/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: [
        'three',
        '@react-three/fiber',
        '@react-three/drei',
        'gsap',
        'zustand',
        'framer-motion',
      ],
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
});
