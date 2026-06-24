#!/usr/bin/env node
// Pulls the latest commits across the seven OSS repos via `gh api`. Writes
// src/lib/recent-commits.json. Failures fall back to the existing file (so
// CI / Cloudflare-Pages builds without gh available still ship).

import { execFile } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, '..', 'src', 'lib', 'recent-commits.json');

const REPOS = [
  'mateokadiu/temporal-stripe',
  'mateokadiu/webhook-gateway',
  'mateokadiu/shadowkit',
  'mateokadiu/studybuddy',
  'mateokadiu/tax-ledger',
  'mateokadiu/grpc-monorepo-starter',
  'mateokadiu/portfolio-site',
];

async function fetchRepo(repo) {
  const { stdout } = await exec(
    'gh',
    ['api', `repos/${repo}/commits?per_page=3`, '-H', 'Accept: application/vnd.github+json'],
    { maxBuffer: 4 * 1024 * 1024 },
  );
  const json = JSON.parse(stdout);
  if (!Array.isArray(json)) return [];
  return json.slice(0, 3).map((c) => ({
    repo,
    sha: c.sha?.slice(0, 7) ?? '',
    message: (c.commit?.message ?? '').split('\n', 1)[0],
    date: c.commit?.author?.date ?? c.commit?.committer?.date ?? null,
    url: c.html_url ?? `https://github.com/${repo}/commit/${c.sha}`,
  }));
}

const STATIC_FALLBACK = [
  {
    repo: 'mateokadiu/portfolio-site',
    sha: 'pending',
    message: 'building the portfolio in public',
    date: new Date().toISOString(),
    url: 'https://github.com/mateokadiu/portfolio-site',
  },
];

async function main() {
  const all = [];
  for (const repo of REPOS) {
    try {
      const items = await fetchRepo(repo);
      all.push(...items);
    } catch (err) {
      process.stderr.write(`[fetch-commits] skip ${repo}: ${err.message?.split('\n')[0] ?? err}\n`);
    }
  }

  const valid = all
    .filter((c) => c.sha && c.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  if (valid.length === 0 && existsSync(outPath)) {
    const cur = readFileSync(outPath, 'utf8');
    process.stderr.write('[fetch-commits] keeping existing file (no fresh data)\n');
    process.stdout.write(cur);
    return;
  }

  const out = valid.length > 0 ? valid : STATIC_FALLBACK;
  writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
  process.stdout.write(`[fetch-commits] wrote ${out.length} entries to ${outPath}\n`);
}

main().catch((err) => {
  process.stderr.write(`[fetch-commits] fatal: ${err.message ?? err}\n`);
  process.exit(0); // never fail the build
});
