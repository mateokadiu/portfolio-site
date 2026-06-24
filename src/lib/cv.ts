// Server-only Keystatic reader. Calls `process.cwd()` at module load, which
// is unsafe in client bundles — keep this file out of any React island's
// import graph. Client-safe types + helpers live in ./cv-types.ts.

import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';
import type {
  Certification,
  EducationEntry,
  Proficiency,
  Role,
  Skill,
  SkillCategory,
} from './cv-types';

export type {
  Certification,
  EducationEntry,
  Proficiency,
  Role,
  Skill,
  SkillCategory,
} from './cv-types';
export { categoryHue, categoryLabel, proficiencyDots } from './cv-types';

const reader = createReader(process.cwd(), keystaticConfig);

export async function loadPersonal() {
  const data = await reader.singletons.personal.read();
  if (!data) throw new Error('personal singleton missing');
  return data;
}

export async function loadLinks() {
  const data = await reader.singletons.links.read();
  if (!data) throw new Error('links singleton missing');
  return data;
}

export async function loadSkills(): Promise<Skill[]> {
  const all = await reader.collections.skills.all();
  return all
    .map<Skill>((entry) => ({
      slug: entry.slug,
      name: entry.slug,
      category: entry.entry.category as SkillCategory,
      proficiency: entry.entry.proficiency as Proficiency,
      yearsUsing: entry.entry.yearsUsing ?? 1,
      unlockedBy: [...entry.entry.unlockedBy],
      order: entry.entry.order ?? 100,
    }))
    .sort((a, b) => a.order - b.order);
}

export async function loadRoles(): Promise<Role[]> {
  const all = await reader.collections.roles.all();
  return all
    .map<Role>((entry) => ({
      slug: entry.slug,
      company: entry.entry.company,
      title: entry.entry.title,
      startDate: entry.entry.startDate ?? '1970-01-01',
      endDate: entry.entry.endDate ?? null,
      location: entry.entry.location,
      remote: entry.entry.remote,
      summary: entry.entry.summary,
      bullets: [...entry.entry.bullets],
      stack: [...entry.entry.stack],
      accent: entry.entry.accent as Role['accent'],
    }))
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
}

export async function loadEducation(): Promise<EducationEntry[]> {
  const all = await reader.collections.education.all();
  return all
    .map<EducationEntry>((entry) => ({
      slug: entry.slug,
      school: entry.entry.school,
      degree: entry.entry.degree,
      startYear: entry.entry.startYear ?? 0,
      endYear: entry.entry.endYear ?? 0,
      location: entry.entry.location,
      notes: entry.entry.notes,
    }))
    .sort((a, b) => b.endYear - a.endYear);
}

export async function loadCertifications(): Promise<Certification[]> {
  const all = await reader.collections.certifications.all();
  return all
    .map<Certification>((entry) => ({
      slug: entry.slug,
      name: entry.entry.name,
      issuer: entry.entry.issuer,
      date: entry.entry.date ?? '1970-01-01',
      credentialUrl: entry.entry.credentialUrl ?? '',
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
