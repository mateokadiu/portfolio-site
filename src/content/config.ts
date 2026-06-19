import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    status: z.enum(['shipped', 'beta', 'private', 'wip']),
    stack: z.array(z.string()),
    repoUrl: z.string().url().nullable(),
    isPrivate: z.boolean().default(false),
    tileSize: z.enum(['1x1', '2x1', '2x2']).default('2x2'),
    accent: z.string().optional(),
  }),
});

export const collections = { projects };
