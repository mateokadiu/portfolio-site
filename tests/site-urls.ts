/** Slugs that render a "try the demo" hint block on their project page. */
export const PROJECTS_WITH_DEMO_HINTS = [
  'temporal-stripe',
  'webhook-gateway',
  'webhook-gateway-admin',
  'shadowkit',
  'studybuddy',
  'tax-ledger',
  'grpc-monorepo-starter',
] as const;

export function projectPath(slug: string): string {
  return `/projects/${slug}/`;
}
