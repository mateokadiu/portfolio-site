import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Single source of truth for every project: the home grid, /projects, the
// deep-dive pages, OG cards, llms.txt, the GitHub tile and the tests all read
// this collection. The MDX body is the case study.
const projects = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    /** Position in the grid and lists (ascending). */
    order: z.number().int(),
    /** One-paragraph summary for the /projects index. */
    blurb: z.string(),
    /** <title> for search results; " — Mateo Kadiu" is appended, so ≤48 keeps it under ~62 chars. */
    seoTitle: z.string().max(48),
    /** Meta description — sized to avoid truncation in search results. */
    description: z.string().min(110).max(160),
    /** Primary programming language of the repo (schema.org programmingLanguage). */
    language: z.string().default('TypeScript'),
    status: z.enum(['shipped', 'beta', 'private', 'wip']),
    stack: z.array(z.string()),
    repoUrl: z.string().url().nullable(),
    isPrivate: z.boolean().default(false),
    tileSize: z.enum(['1x1', '2x1', '2x2']),
    /** "Try the demo" guide shown above the demo on the project page. */
    demoHint: z.object({
      headline: z.string(),
      steps: z.array(z.string()).min(1),
    }),
  }),
});

const cvDir = './src/content/cv';

const personal = defineCollection({
  loader: glob({ pattern: 'personal.yaml', base: cvDir }),
  schema: z.object({
    headline: z.string(),
    tagline: z.string(),
    bio: z.string(),
    openToWork: z.boolean(),
    availability: z.string(),
    /** Site-relative or absolute URL of a headshot; empty = initials avatar. */
    avatarUrl: z.string().default(''),
  }),
});

const roles = defineCollection({
  loader: glob({ pattern: '*.yaml', base: `${cvDir}/roles` }),
  schema: z.object({
    company: z.string(),
    title: z.string(),
    startDate: z.string(),
    /** null = current role. */
    endDate: z.string().nullable(),
    location: z.string(),
    remote: z.boolean(),
    summary: z.string(),
    bullets: z.array(z.string()),
    stack: z.array(z.string()),
    accent: z.enum(['orange', 'cyan', 'lime']),
  }),
});

const skills = defineCollection({
  loader: glob({ pattern: '*.yaml', base: `${cvDir}/skills` }),
  schema: z.object({
    name: z.string(),
    category: z.enum(['languages', 'backend', 'frontend', 'mobile', 'infra', 'data', 'tools']),
    proficiency: z.enum(['expert', 'strong', 'working', 'learning']),
    yearsUsing: z.number().int().positive(),
    /** Lower numbers appear first within a category. */
    order: z.number().default(100),
  }),
});

const education = defineCollection({
  loader: glob({ pattern: '*.yaml', base: `${cvDir}/education` }),
  schema: z.object({
    school: z.string(),
    degree: z.string(),
    startYear: z.number().int(),
    endYear: z.number().int(),
    location: z.string(),
    notes: z.string().default(''),
  }),
});

export const collections = { projects, personal, roles, skills, education };
