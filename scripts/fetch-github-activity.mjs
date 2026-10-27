#!/usr/bin/env node
// Fetches repo-level activity (last push, language, description) for every
// project repo listed in src/content/projects/*.mdx via the GitHub REST API.
// Writes src/lib/github-activity.generated.json (gitignored). Set GITHUB_TOKEN
// in CI / Cloudflare Pages to avoid the 60 req/h anonymous rate limit.
// Never fails the build: on error the previous file is kept, and the tile
// falls back to a static repo list when no file exists.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const projectsDir = join(root, 'src', 'content', 'projects');
const outPath = join(root, 'src', 'lib', 'github-activity.generated.json');

function projectRepos() {
  const repos = [];
  for (const file of readdirSync(projectsDir).filter((f) => f.endsWith('.mdx'))) {
    const source = readFileSync(join(projectsDir, file), 'utf8');
    const match = source.match(/^repoUrl:\s*['"]?https:\/\/github\.com\/([^'"\s]+?)['"]?\s*$/m);
    if (match) repos.push(match[1]);
  }
  return repos;
}

async function fetchRepo(fullName) {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  const res = await fetch(`https://api.github.com/repos/${fullName}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'mateokadiu-portfolio-build',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const repo = await res.json();
  return {
    name: repo.name,
    description: repo.description ?? null,
    language: repo.language ?? null,
    pushedAt: repo.pushed_at,
    url: repo.html_url,
  };
}

async function main() {
  const repos = projectRepos();
  const results = await Promise.allSettled(repos.map(fetchRepo));
  const activity = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') activity.push(result.value);
    else process.stderr.write(`[github-activity] skip ${repos[i]}: ${result.reason?.message}\n`);
  });

  if (activity.length === 0) {
    const kept = existsSync(outPath) ? 'keeping previous file' : 'tile will use its fallback';
    process.stderr.write(`[github-activity] no data fetched — ${kept}\n`);
    return;
  }

  activity.sort((a, b) => (a.pushedAt < b.pushedAt ? 1 : -1));
  writeFileSync(outPath, `${JSON.stringify(activity, null, 2)}\n`);
  process.stdout.write(`[github-activity] wrote ${activity.length} repos\n`);
}

main().catch((err) => {
  process.stderr.write(`[github-activity] fatal: ${err.message ?? err}\n`);
});
