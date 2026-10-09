import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const publicDir = resolve(root, 'public');

// Source of truth for every icon. Colors must be hex/rgb — librsvg (sharp)
// doesn't parse oklch() and silently renders the shapes black.
const svg = await readFile(resolve(publicDir, 'favicon.svg'));
// iOS and maskable PWA icons get masked by the OS, so they need a square,
// full-bleed background instead of transparent rounded corners.
const fullBleedSvg = Buffer.from(svg.toString().replace(/ rx="[\d.]+"/, ''));
const BG = '#171717';

// Rasterize at a density that matches the target size so large icons stay sharp.
function render(source, size) {
  const density = Math.ceil((size / 32) * 72 * 2);
  return sharp(source, { density }).resize(size, size).png().toBuffer();
}

const targets = [
  { file: 'favicon-32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180, fullBleed: true },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-maskable-512.png', size: 512, fullBleed: true, padding: 56 },
];

for (const t of targets) {
  const source = t.fullBleed ? fullBleedSvg : svg;
  const innerSize = t.padding ? t.size - t.padding * 2 : t.size;
  const inner = await render(source, innerSize);
  const composed = t.padding
    ? await sharp({
        create: { width: t.size, height: t.size, channels: 4, background: BG },
      })
        .composite([{ input: inner, gravity: 'center' }])
        .png()
        .toBuffer()
    : inner;
  await writeFile(resolve(publicDir, t.file), composed);
  console.log(`[icons] wrote ${t.file} (${t.size}x${t.size})`);
}

// favicon.ico — PNG-in-ICO container (16/32/48). Browsers and crawlers still
// request /favicon.ico directly regardless of <link rel="icon">.
const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(icoSizes.map((size) => render(svg, size)));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(icoImages.length, 4);
let offset = 6 + 16 * icoImages.length;
const entries = icoImages.map((png, i) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(icoSizes[i], 0); // width
  entry.writeUInt8(icoSizes[i], 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += png.length;
  return entry;
});
await writeFile(
  resolve(publicDir, 'favicon.ico'),
  Buffer.concat([header, ...entries, ...icoImages]),
);
console.log(`[icons] wrote favicon.ico (${icoSizes.join('/')})`);

const manifest = {
  id: '/',
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
