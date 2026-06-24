import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '..', 'public', 'og');

const projects = [
  {
    slug: 'default',
    name: 'Mateo Kadiu',
    tagline: 'Senior full-stack — bento-grid interactive portfolio.',
  },
  {
    slug: 'temporal-stripe',
    name: 'temporal-stripe',
    tagline: 'Temporal workflows for the full Stripe Connect lifecycle.',
  },
  {
    slug: 'webhook-gateway',
    name: 'webhook-gateway',
    tagline: 'Self-hosted webhook reliability with exp-backoff + DLQ.',
  },
  {
    slug: 'shadowkit',
    name: 'shadowkit',
    tagline: 'Web Components toolkit — Tailwind v4 in Shadow DOM.',
  },
  {
    slug: 'studybuddy',
    name: 'studybuddy',
    tagline: 'On-device RAG study app — RN + Skia + ExecuTorch.',
  },
  {
    slug: 'tax-ledger',
    name: 'tax-ledger',
    tagline: 'OSS tax line-item splitter with multi-adapter ledger.',
  },
  {
    slug: 'grpc-monorepo-starter',
    name: 'grpc-monorepo-starter',
    tagline: 'Turborepo + NestJS + gRPC + Connect-Web starter.',
  },
];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function svgFor({ name, tagline }) {
  const isHome = name === 'Mateo Kadiu';
  const eyebrow = isHome ? 'mateokadiu.pages.dev' : 'mateo kadiu · portfolio';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1c1c1c"/>
      <stop offset="100%" stop-color="#111111"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.15" r="0.6">
      <stop offset="0%" stop-color="#f08a3e" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#f08a3e" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="0" y="0" width="8" height="630" fill="#f08a3e"/>
  <text x="80" y="120" font-family="JetBrains Mono, monospace" font-size="22" fill="#a1a1a1" letter-spacing="2">${esc(eyebrow.toUpperCase())}</text>
  <text x="80" y="270" font-family="Geist Mono, JetBrains Mono, monospace" font-size="78" font-weight="600" fill="#fafafa">${esc(name)}</text>
  <text x="80" y="350" font-family="Geist, system-ui, sans-serif" font-size="32" fill="#d4d4d8">${esc(tagline)}</text>
  <g transform="translate(80, 510)" font-family="JetBrains Mono, monospace" font-size="18" fill="#71717a">
    <text x="0" y="0">github.com/mateokadiu</text>
    <text x="0" y="30">astro · framer motion · gsap · three.js</text>
  </g>
  <g transform="translate(1050, 530)" fill="#f08a3e">
    <circle cx="0" cy="0" r="6"/>
    <circle cx="22" cy="0" r="6" fill-opacity="0.5"/>
    <circle cx="44" cy="0" r="6" fill-opacity="0.2"/>
  </g>
</svg>`;
}

await mkdir(outDir, { recursive: true });

for (const p of projects) {
  const svg = svgFor(p);
  const out = resolve(outDir, `${p.slug}.png`);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`[og] wrote ${p.slug}.png`);
}
