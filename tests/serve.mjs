#!/usr/bin/env node
// Zero-dependency static server for dist/, mimicking Cloudflare Pages:
// `/about` → 308 `/about/`, `/x/` → `/x/index.html`, unknown paths → 404.html
// with a 404 status. Used by Playwright and Lighthouse CI so tests run the
// same way on macOS, in CI and inside the Playwright Docker image.

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { createGzip } from 'node:zlib';

const root = resolve(process.argv[2] ?? 'dist');
const port = Number(process.env.PORT ?? 4321);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

const COMPRESSIBLE = new Set([
  '.html',
  '.js',
  '.mjs',
  '.css',
  '.json',
  '.webmanifest',
  '.xml',
  '.txt',
  '.svg',
]);

// Gzip text like the CDN does, so Lighthouse sees realistic transfer sizes.
function send(req, res, status, file) {
  const ext = extname(file);
  const headers = { 'Content-Type': TYPES[ext] ?? 'application/octet-stream' };
  const gzip = COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '');
  if (gzip) headers['Content-Encoding'] = 'gzip';
  res.writeHead(status, headers);
  const stream = createReadStream(file);
  (gzip ? stream.pipe(createGzip()) : stream).pipe(res);
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  const file = normalize(join(root, pathname));
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }

  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!pathname.endsWith('/')) {
      res.writeHead(308, { Location: `${pathname}/${url.search}` }).end();
      return;
    }
    const index = join(file, 'index.html');
    if (existsSync(index)) return send(req, res, 200, index);
  } else if (existsSync(file)) {
    return send(req, res, 200, file);
  }

  const notFound = join(root, '404.html');
  if (existsSync(notFound)) return send(req, res, 404, notFound);
  res.writeHead(404).end('not found');
});

server.listen(port, '0.0.0.0', () => {
  process.stdout.write(`serving ${root} on http://localhost:${port}\n`);
});
