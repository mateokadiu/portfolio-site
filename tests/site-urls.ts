import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Tests read the same source of truth as the site: the project MDX files.
const PROJECTS_DIR = join(import.meta.dirname, '..', 'src', 'content', 'projects');

export interface ProjectFixture {
  slug: string;
  name: string;
  order: number;
}

function frontmatterValue(source: string, key: string): string | undefined {
  const match = source.match(new RegExp(`^${key}:\\s*['"]?(.+?)['"]?\\s*$`, 'm'));
  return match?.[1];
}

export const PROJECTS: ProjectFixture[] = readdirSync(PROJECTS_DIR)
  .filter((file) => file.endsWith('.mdx'))
  .map((file) => {
    const source = readFileSync(join(PROJECTS_DIR, file), 'utf8');
    return {
      slug: frontmatterValue(source, 'slug') ?? file.replace(/\.mdx$/, ''),
      name: frontmatterValue(source, 'name') ?? '',
      order: Number(frontmatterValue(source, 'order')),
    };
  })
  .sort((a, b) => a.order - b.order);

export const PROJECT_SLUGS = PROJECTS.map((p) => p.slug);

/** Utility tiles after the project tiles: about, now, github, contact. */
export const UTILITY_TILE_COUNT = 4;

export function projectPath(slug: string): string {
  return `/projects/${slug}/`;
}

export const PAGES = ['/', '/about/', '/projects/', ...PROJECT_SLUGS.map(projectPath)];
