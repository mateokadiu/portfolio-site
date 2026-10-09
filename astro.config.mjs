import { execFileSync } from 'node:child_process';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// Source files whose last commit date is a page's sitemap <lastmod>.
const PAGE_SOURCES = {
  '/': ['src/pages/index.astro', 'src/lib/data.ts', 'src/tiles', 'src/components'],
  '/about/': ['src/pages/about.astro', 'src/content/cv', 'src/components/cv'],
  '/projects/': ['src/pages/projects/index.astro', 'src/lib/data.ts'],
};

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

// Shallow clones (common on CI) would report every page as modified at the
// last commit — an inaccurate lastmod is worse than none, so skip it there.
let hasHistory = false;
try {
  hasHistory = git(['rev-parse', '--is-shallow-repository']) === 'false';
} catch {
  // not a git checkout
}

function lastModified(pathname) {
  if (!hasHistory) return undefined;
  const project = pathname.match(/^\/projects\/([^/]+)\/$/);
  const sources = project
    ? [`src/content/projects/${project[1]}.mdx`, 'src/pages/projects/[slug].astro']
    : PAGE_SOURCES[pathname];
  if (!sources) return undefined;
  try {
    const date = git(['log', '-1', '--format=%cI', '--', ...sources.map((s) => `:(literal)${s}`)]);
    return date || undefined;
  } catch {
    return undefined;
  }
}

export default defineConfig({
  site: 'https://mateokadiu.com',
  trailingSlash: 'always',
  output: 'static',
  integrations: [
    react(),
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/embeds/') && !page.includes('/404'),
      serialize(item) {
        const lastmod = lastModified(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod } : item;
      },
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
    // One shared Tailwind sheet (~7 KB gzipped). Inlining it removes the only
    // render-blocking request, which dominated mobile FCP/LCP.
    inlineStylesheets: 'always',
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
});
