// Site identity — the single source for name, contact and location. Projects
// live in the `projects` content collection (src/lib/projects.ts); CV prose in
// src/content/cv.

export const NOW = [
  'on-device LLMs · ExecuTorch on RN',
  'web components + shadow-dom theming',
  'gRPC + connect-web client codegen',
  'temporal workflows for retries',
];

export const SOCIAL = {
  email: 'mateokadiu18@gmail.com',
  github: 'https://github.com/mateokadiu',
  linkedin: 'https://www.linkedin.com/in/mateo-kadiu/',
};

export const SITE = {
  title: 'Mateo Kadiu — Senior Software Engineer',
  description:
    'Mateo Kadiu, senior software engineer in Tirana (CET), open to relocation. React, Next.js, Angular, NestJS, Stripe Connect. Every project has a live demo.',
  jobTitle: 'Senior Software Engineer',
  url: 'https://mateokadiu.com',
  author: 'Mateo Kadiu',
  location: 'Tirana, AL',
  city: 'Tirana',
  country: 'Albania',
  countryCode: 'AL',
  timezone: 'Europe/Tirane',
  /** Path of the downloadable CV. */
  cvPath: '/Mateo%20Kadiu%20-%20CV.pdf',
};

/** Site-relative path with trailing slash (hash paths like /#work are unchanged). */
export function sitePath(path = '/'): string {
  if (!path || path === '/') return '/';
  if (path.includes('#')) return path.startsWith('/') ? path : `/${path}`;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

/** Absolute canonical URL for a site path. */
export function siteUrl(path = '/'): string {
  if (!path || path === '/') return `${SITE.url}/`;
  return `${SITE.url}${sitePath(path)}`;
}
