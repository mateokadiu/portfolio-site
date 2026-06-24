import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const publicDir = resolve(root, 'public');

const svg = await readFile(resolve(publicDir, 'favicon.svg'));

const targets = [
  { file: 'favicon-32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-maskable-512.png', size: 512, padding: 56 },
];

for (const t of targets) {
  const innerSize = t.padding ? t.size - t.padding * 2 : t.size;
  const inner = await sharp(svg, { density: 384 }).resize(innerSize, innerSize).png().toBuffer();
  const composed = t.padding
    ? await sharp({
        create: {
          width: t.size,
          height: t.size,
          channels: 4,
          background: { r: 38, g: 38, b: 38, alpha: 1 },
        },
      })
        .composite([{ input: inner, gravity: 'center' }])
        .png()
        .toBuffer()
    : inner;
  await writeFile(resolve(publicDir, t.file), composed);
  console.log(`[icons] wrote ${t.file} (${t.size}x${t.size})`);
}

const manifest = {
  name: 'Mateo Kadiu — portfolio',
  short_name: 'mateokadiu',
  description:
    'Senior full-stack engineer. Bento-grid interactive showcase: every project tile is a live mini-demo of the real work.',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#252525',
  theme_color: '#252525',
  orientation: 'portrait-primary',
  icons: [
    { src: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    { src: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    { src: '/icon-maskable-512.png', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
    { src: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' },
  ],
};
await writeFile(
  resolve(publicDir, 'manifest.webmanifest'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log('[icons] wrote manifest.webmanifest');
