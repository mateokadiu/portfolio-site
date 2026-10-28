import type { APIRoute } from 'astro';
import { loadPersonal, loadRoles } from '~/lib/cv';
import { SITE, SOCIAL, siteUrl } from '~/lib/data';
import { getProjects } from '~/lib/projects';

// Plain-markdown site summary for LLM-based search/assistants (llmstxt.org).
export const GET: APIRoute = async () => {
  const [personal, roles, projects] = await Promise.all([
    loadPersonal(),
    loadRoles(),
    getProjects(),
  ]);
  const currentRole = roles.find((r) => r.endDate === null);

  const projectLines = projects.map(
    (p) => `- [${p.name}](${siteUrl(`/projects/${p.slug}`)}): ${p.description}`,
  );

  const body = [
    `# ${SITE.author}`,
    '',
    `> ${SITE.jobTitle}${currentRole ? ` at ${currentRole.company}` : ''}, based in ${SITE.city}, ${SITE.country} (CET time zone), open to relocation.`,
    '',
    personal.tagline,
    '',
    '## About',
    '',
    `- [About, experience and skills](${siteUrl('/about')})`,
    `- [CV (PDF)](${SITE.url}${SITE.cvPath})`,
    '',
    '## Projects',
    '',
    `- [All projects](${siteUrl('/projects')}): every project is open source (MIT) with an interactive demo.`,
    ...projectLines,
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
