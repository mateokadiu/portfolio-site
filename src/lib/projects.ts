import { type CollectionEntry, getCollection } from 'astro:content';

export type ProjectEntry = CollectionEntry<'projects'>;
export type Project = ProjectEntry['data'] & { slug: string };
export type TileSize = Project['tileSize'];

export const toProject = (entry: ProjectEntry): Project => ({ slug: entry.id, ...entry.data });

/** Every project, in grid order. */
export async function getProjects(): Promise<Project[]> {
  const entries = await getCollection('projects');
  return entries.map(toProject).sort((a, b) => a.order - b.order);
}
