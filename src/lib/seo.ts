// Server-only (imports the Keystatic reader via ./cv). Builds the JSON-LD
// entities shared by every page so Google sees one consistent Person and
// WebSite, referenced by `@id` from page-level nodes.

import { loadEducation, loadLinks, loadPersonal, loadRoles, loadSkills } from './cv';
import { SITE, siteUrl } from './data';

export type JsonLdNode = Record<string, unknown>;

export const PERSON_ID = `${siteUrl('/')}#person`;
export const WEBSITE_ID = `${siteUrl('/')}#website`;

export const personRef = { '@id': PERSON_ID };
export const websiteRef = { '@id': WEBSITE_ID };

const city = (location: string) => location.split(',')[0]?.trim() || undefined;

export async function buildPersonNode(): Promise<JsonLdNode> {
  const [personal, links, skills, roles, education] = await Promise.all([
    loadPersonal(),
    loadLinks(),
    loadSkills(),
    loadRoles(),
    loadEducation(),
  ]);
  const [givenName, ...rest] = personal.name.split(' ');
  const currentRole = roles.find((r) => r.endDate === null);

  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: personal.name,
    givenName,
    familyName: rest.join(' '),
    jobTitle: SITE.jobTitle,
    description: SITE.description,
    url: siteUrl('/'),
    mainEntityOfPage: siteUrl('/about'),
    image: siteUrl('/og/about.png'),
    email: `mailto:${personal.email}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city(personal.location) ?? 'Tirana',
      addressCountry: 'AL',
    },
    sameAs: [links.github, links.linkedin].filter(Boolean),
    knowsAbout: skills.map((s) => s.name),
    ...(currentRole && {
      worksFor: { '@type': 'Organization', name: currentRole.company },
    }),
    alumniOf: education.map((e) => ({
      '@type': 'CollegeOrUniversity',
      name: e.school,
      address: { '@type': 'PostalAddress', addressLocality: city(e.location) },
    })),
    hasOccupation: {
      '@type': 'Occupation',
      name: SITE.jobTitle,
      occupationLocation: { '@type': 'City', name: city(personal.location) },
    },
  };
}

export const websiteNode: JsonLdNode = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: siteUrl('/'),
  name: SITE.author,
  alternateName: SITE.title,
  description: SITE.description,
  inLanguage: 'en-US',
  author: personRef,
  publisher: personRef,
};

export function breadcrumbNode(crumbs: { name: string; path: string }[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: siteUrl(c.path),
    })),
  };
}
