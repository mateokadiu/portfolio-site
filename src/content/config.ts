import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
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
    tileSize: z.enum(['1x1', '2x1', '2x2']).default('2x2'),
    accent: z.string().optional(),
  }),
});

export const collections = { projects };
