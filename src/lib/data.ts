export type ProjectStatus = 'shipped' | 'beta' | 'private' | 'wip';
export type TileSize = '1x1' | '2x1' | '2x2';

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  blurb: string;
  stack: string[];
  status: ProjectStatus;
  repoUrl: string | null;
  isPrivate: boolean;
  tileSize: TileSize;
}

export const NOW = [
  'on-device LLMs · llama.rn on RN',
  'web components + shadow-dom theming',
  'gRPC + connect-web client codegen',
  'temporal workflows for retries',
];

export const PROJECTS: Project[] = [
  {
    slug: 'temporal-stripe',
    name: 'temporal-stripe',
    tagline: 'Temporal workflows for the full Stripe Connect lifecycle.',
    blurb:
      'Open-source Temporal library covering reauthorization, multicapture, refunds and chargebacks behind type-safe signals and a saga primitive.',
    stack: ['Temporal', 'TypeScript', 'Stripe Connect', 'Vitest'],
    status: 'shipped',
    repoUrl: 'https://github.com/mateokadiu/temporal-stripe',
    isPrivate: false,
    tileSize: '2x2',
  },
  {
    slug: 'webhook-gateway',
    name: 'webhook-gateway',
    tagline: 'Self-hosted webhook reliability with exponential backoff + DLQ.',
    blurb:
      'A small Nest service that takes inbound webhooks, persists them, retries with exp backoff, and parks the dead ones in a DLQ for replay.',
    stack: ['NestJS', 'Postgres', 'BullMQ', 'TypeScript'],
    status: 'shipped',
    repoUrl: 'https://github.com/mateokadiu/webhook-gateway',
    isPrivate: false,
    tileSize: '2x1',
  },
  {
    slug: 'shadowkit',
    name: 'shadowkit',
    tagline: 'Tailwind v4 inside the Shadow DOM, the cascade-safe way.',
    blurb:
      'Tiny set of helpers for building Web Components that survive the host page CSS — theme tokens scoped to :host, deduped stylesheet injection, a typed bridge for cross-instance state.',
    stack: ['Web Components', 'Tailwind v4', 'Vite', 'TypeScript'],
    status: 'shipped',
    repoUrl: 'https://github.com/mateokadiu/shadowkit',
    isPrivate: false,
    tileSize: '2x1',
  },
  {
    slug: 'tax-ledger',
    name: 'tax-ledger',
    tagline: 'OSS tax line-item splitter with provable invariants.',
    blurb:
      'Library that splits sales-tax-inclusive orders into per-jurisdiction line items and proves the sum invariant holds across refunds, partial captures, and FX conversion.',
    stack: ['TypeScript', 'Big.js', 'Property-based testing'],
    status: 'shipped',
    repoUrl: 'https://github.com/mateokadiu/tax-ledger',
    isPrivate: false,
    tileSize: '2x2',
  },
  {
    slug: 'grpc-monorepo-starter',
    name: 'grpc-monorepo-starter',
    tagline: 'Turborepo + NestJS + gRPC + multi-language clients.',
    blurb:
      'Opinionated monorepo template — define a service in proto, get TS / Go / Python / Connect-Web clients regenerated on save.',
    stack: ['Turborepo', 'NestJS', 'gRPC', 'Buf'],
    status: 'shipped',
    repoUrl: 'https://github.com/mateokadiu/grpc-monorepo-starter',
    isPrivate: false,
    tileSize: '2x1',
  },
  {
    slug: 'stripe-eu-vat-moss',
    name: 'stripe-eu-vat-moss',
    tagline: 'EU VAT One-Stop-Shop automation engine.',
    blurb:
      'Java 21 + Spring Boot 3.4 + JOOQ + Liquibase. Bitemporal event store, 27-country VAT matrix, SAF-OSS XML returns, Stripe Tax + Connect (Art. 14a) ingestion, Pulumi-Java to Oracle Cloud Free.',
    stack: ['Java 21', 'Spring Boot', 'JOOQ', 'Postgres', 'Pulumi'],
    status: 'shipped',
    repoUrl: 'https://github.com/mateokadiu/stripe-eu-vat-moss',
    isPrivate: false,
    tileSize: '2x1',
  },
  {
    slug: 'tide',
    name: 'tide',
    tagline: 'Self-hostable read-later — Pocket / Omnivore replacement.',
    blurb:
      'Next.js 16 + RSC + Drizzle + Postgres + pgvector. Save from web / extension (MV3) / email / API. Streaming AI summaries via Anthropic, semantic search, RSC reader with typographic theming. Docker compose + Pulumi-TS to Oracle Cloud Free.',
    stack: ['Next.js 16', 'React 19', 'Drizzle', 'pgvector', 'BullMQ', 'Anthropic SDK'],
    status: 'shipped',
    repoUrl: 'https://github.com/mateokadiu/tide',
    isPrivate: false,
    tileSize: '2x1',
  },
  {
    slug: 'studybuddy',
    name: 'studybuddy',
    tagline: 'On-device RAG study app for React Native.',
    blurb:
      'A flashcard / study app with retrieval-augmented question generation, all model inference on-device via llama.rn. Skia for the heatmap.',
    stack: ['React Native', 'Skia', 'llama.rn', 'SQLite'],
    status: 'beta',
    repoUrl: 'https://github.com/mateokadiu/studybuddy',
    isPrivate: false,
    tileSize: '2x1',
  },
];

export const PROJECT_BY_SLUG: Record<string, Project> = Object.fromEntries(
  PROJECTS.map((p) => [p.slug, p]),
);

export const SOCIAL = {
  email: 'mateokadiu17@gmail.com',
  github: 'https://github.com/mateokadiu',
  linkedin: 'https://www.linkedin.com/in/mateo-kadiu/',
};

export const SITE = {
  title: 'Mateo Kadiu — portfolio',
  description:
    'Senior full-stack engineer. Bento-grid interactive showcase: every project tile is a live mini-demo of the real work.',
  url: 'https://mateokadiu.pages.dev',
  author: 'Mateo Kadiu',
  location: 'Tirana, AL',
};
