import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { loadPersonal, loadRoles } from '~/lib/cv';
import { PROJECTS, SITE, SOCIAL, siteUrl } from '~/lib/data';

// Plain-markdown site summary for LLM-based search/assistants (llmstxt.org).
export const GET: APIRoute = async () => {
  const [personal, roles, entries] = await Promise.all([
    loadPersonal(),
    loadRoles(),
    getCollection('projects'),
  ]);
  const bySlug = new Map(entries.map((e) => [e.id.replace(/\.mdx$/, ''), e.data]));
  const currentRole = roles.find((r) => r.endDate === null);

  const projects = PROJECTS.map((p) => {
    const description = bySlug.get(p.slug)?.description ?? p.tagline;
    return `- [${p.name}](${siteUrl(`/projects/${p.slug}`)}): ${description}`;
  });

  const body = [
    `# ${SITE.author}`,
    '',
    `> ${SITE.jobTitle}${currentRole ? ` at ${currentRole.company}` : ''}, based in ${personal.location} (EU time zone).`,
    '',
    personal.tagline,
    '',
    '## About',
    '',
    `- [About, experience and skills](${siteUrl('/about')})`,
    `- [CV (PDF)](${SITE.url}/Mateo%20Kadiu%20-%20CV.pdf)`,
    '',
    '## Projects',
    '',
    `- [All projects](${siteUrl('/projects')}): every project is open source (MIT) with an interactive demo.`,
    ...projects,
    '',
    '## Contact',
    '',
    `- Email: ${SOCIAL.email}`,
    `- GitHub: ${SOCIAL.github}`,
    `- LinkedIn: ${SOCIAL.linkedin}`,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
