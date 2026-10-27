// Server-only CV loaders over the content collections in src/content.config.ts.
// Client-safe types + display helpers live in ./cv-types.ts.

import { getCollection, getEntry } from 'astro:content';
import type { EducationEntry, Role, Skill } from './cv-types';

export type { EducationEntry, Proficiency, Role, Skill, SkillCategory } from './cv-types';
export { categoryHue, categoryLabel, proficiencyDots } from './cv-types';

export async function loadPersonal() {
  const entry = await getEntry('personal', 'personal');
  if (!entry) throw new Error('src/content/cv/personal.yaml is missing');
  return entry.data;
}

export async function loadSkills(): Promise<Skill[]> {
  const entries = await getCollection('skills');
  return entries
    .map((entry) => ({ slug: entry.id, ...entry.data }))
    .sort((a, b) => a.order - b.order);
}

export async function loadRoles(): Promise<Role[]> {
  const entries = await getCollection('roles');
  return entries
    .map((entry) => ({ slug: entry.id, ...entry.data }))
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
}

export async function loadEducation(): Promise<EducationEntry[]> {
  const entries = await getCollection('education');
  return entries
    .map((entry) => ({ slug: entry.id, ...entry.data }))
    .sort((a, b) => b.endYear - a.endYear);
}
