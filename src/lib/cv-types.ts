// Client-safe portion of cv.ts — types + display helpers only.
// The Keystatic reader (in cv.ts) calls `process.cwd()` at module load,
// which fails in the browser when client-side React islands import from
// cv.ts. Splitting types here lets the SkillGraph island avoid pulling the
// reader (and Node `process`) into the client bundle.

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
  tools: 0, // neutral gray
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
