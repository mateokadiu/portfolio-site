import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';

const reader = createReader(process.cwd(), keystaticConfig);

export type SkillCategory =
  | 'languages'
  | 'backend'
  | 'frontend'
  | 'mobile'
  | 'infra'
  | 'data'
  | 'tools';

export type Proficiency = 'expert' | 'strong' | 'working' | 'learning';

export interface Skill {
  slug: string;
  name: string;
  category: SkillCategory;
  proficiency: Proficiency;
  yearsUsing: number;
  unlockedBy: string[];
  order: number;
}

export interface Role {
  slug: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  location: string;
  remote: boolean;
  summary: string;
  bullets: string[];
  stack: string[];
  accent: 'orange' | 'cyan' | 'lime';
}

export interface EducationEntry {
  slug: string;
  school: string;
  degree: string;
  startYear: number;
  endYear: number;
  location: string;
  notes: string;
}

export interface Certification {
  slug: string;
  name: string;
  issuer: string;
  date: string;
  credentialUrl: string;
}

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
    .map((entry) => ({
      slug: entry.slug,
      name: entry.slug,
      category: entry.entry.category as SkillCategory,
      proficiency: entry.entry.proficiency as Proficiency,
      yearsUsing: entry.entry.yearsUsing,
      unlockedBy: entry.entry.unlockedBy,
      order: entry.entry.order,
    }))
    .sort((a, b) => a.order - b.order);
}

export async function loadRoles(): Promise<Role[]> {
  const all = await reader.collections.roles.all();
  return all
    .map((entry) => ({
      slug: entry.slug,
      company: entry.entry.company,
      title: entry.entry.title,
      startDate: entry.entry.startDate,
      endDate: entry.entry.endDate,
      location: entry.entry.location,
      remote: entry.entry.remote,
      summary: entry.entry.summary,
      bullets: entry.entry.bullets,
      stack: entry.entry.stack,
      accent: entry.entry.accent as Role['accent'],
    }))
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
}

export async function loadEducation(): Promise<EducationEntry[]> {
  const all = await reader.collections.education.all();
  return all
    .map((entry) => ({
      slug: entry.slug,
      school: entry.entry.school,
      degree: entry.entry.degree,
      startYear: entry.entry.startYear,
      endYear: entry.entry.endYear,
      location: entry.entry.location,
      notes: entry.entry.notes,
    }))
    .sort((a, b) => b.endYear - a.endYear);
}

export async function loadCertifications(): Promise<Certification[]> {
  const all = await reader.collections.certifications.all();
  return all
    .map((entry) => ({
      slug: entry.slug,
      name: entry.entry.name,
      issuer: entry.entry.issuer,
      date: entry.entry.date,
      credentialUrl: entry.entry.credentialUrl ?? '',
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  languages: 'languages',
  backend: 'backend',
  frontend: 'frontend',
  mobile: 'mobile',
  infra: 'infra · devops',
  data: 'data',
  tools: 'tools',
};

const CATEGORY_HUE: Record<SkillCategory, number> = {
  languages: 25, // warm orange (accent)
  backend: 200, // cyan
  frontend: 130, // lime
  mobile: 50, // amber
  data: 280, // violet
  infra: 350, // rose
  tools: 0, // neutral gray (zero chroma in oklch)
};

export function categoryLabel(c: SkillCategory): string {
  return CATEGORY_LABELS[c];
}

export function categoryHue(c: SkillCategory): number {
  return CATEGORY_HUE[c];
}

export function proficiencyDots(p: Proficiency): number {
  switch (p) {
    case 'expert':
      return 4;
    case 'strong':
      return 3;
    case 'working':
      return 2;
    case 'learning':
      return 1;
  }
}
