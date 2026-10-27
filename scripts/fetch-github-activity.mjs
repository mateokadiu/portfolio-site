#!/usr/bin/env node
// Fetches repo-level activity (last push, language, description) for every
// project repo listed in src/content/projects/*.mdx via the GitHub REST API.
// Writes src/lib/github-activity.generated.json (gitignored). Set GITHUB_TOKEN
// in CI / Cloudflare Pages to avoid the 60 req/h anonymous rate limit (locally
// the `gh` CLI's token is used when available).
// Never fails the build: a repo that can't be fetched keeps its previous entry,
// and the tile falls back to a static repo list when no file exists.

import { execFileSync } from 'node:child_process';
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

function resolveToken() {
  const fromEnv = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (fromEnv) return fromEnv;
  try {
    return execFileSync('gh', ['auth', 'token'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

function previousActivity() {
  if (!existsSync(outPath)) return [];
  try {
    const data = JSON.parse(readFileSync(outPath, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchRepo(fullName, token) {
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
  const token = resolveToken();
  const previous = new Map(previousActivity().map((r) => [r.name, r]));
  const results = await Promise.allSettled(repos.map((repo) => fetchRepo(repo, token)));
  const activity = [];
  let fetched = 0;
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      activity.push(result.value);
      fetched += 1;
      return;
    }
    const name = repos[i].split('/')[1];
    const kept = previous.get(name);
    if (kept) activity.push(kept);
    process.stderr.write(
      `[github-activity] ${repos[i]}: ${result.reason?.message}${kept ? ' (kept previous entry)' : ''}\n`,
    );
  });

  if (activity.length === 0) {
    process.stderr.write('[github-activity] no data — the tile will use its fallback list\n');
    return;
  }

  activity.sort((a, b) => (a.pushedAt < b.pushedAt ? 1 : -1));
  writeFileSync(outPath, `${JSON.stringify(activity, null, 2)}\n`);
  process.stdout.write(`[github-activity] wrote ${activity.length} repos (${fetched} fetched)\n`);
}

main().catch((err) => {
  process.stderr.write(`[github-activity] fatal: ${err.message ?? err}\n`);
});
