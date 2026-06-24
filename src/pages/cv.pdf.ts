import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import type { APIRoute } from 'astro';
import React from 'react';
import {
  categoryLabel,
  loadCertifications,
  loadEducation,
  loadLinks,
  loadPersonal,
  loadRoles,
  loadSkills,
} from '~/lib/cv';

const COLORS = {
  bg: '#0f0f0f',
  card: '#1a1a1a',
  border: '#2b2b2b',
  fg: '#fafafa',
  muted: '#a1a1a1',
  accent: '#f08a3e',
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    color: COLORS.fg,
    backgroundColor: COLORS.bg,
    fontFamily: 'Helvetica',
  },
  name: { fontSize: 22, fontWeight: 700, color: COLORS.fg, marginBottom: 4 },
  headline: { fontSize: 10, color: COLORS.muted, marginBottom: 2 },
  meta: { fontSize: 8, color: COLORS.muted, marginBottom: 14 },
  bio: { fontSize: 9, color: COLORS.fg, lineHeight: 1.5, marginBottom: 14 },
  h2: {
    fontSize: 10,
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 14,
    marginBottom: 8,
    fontWeight: 700,
  },
  rolesWrap: { marginBottom: 8 },
  roleRow: {
    marginBottom: 10,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.accent,
    paddingLeft: 10,
  },
  roleHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  roleTitle: { fontSize: 10, fontWeight: 700, color: COLORS.fg },
  roleCompany: { color: COLORS.accent },
  roleMeta: { fontSize: 8, color: COLORS.muted },
  bullet: { fontSize: 9, color: COLORS.fg, marginTop: 2, marginLeft: 8 },
  stackRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  chip: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 7,
    color: COLORS.muted,
  },
  skillGroup: { marginBottom: 6 },
  skillCatLabel: {
    fontSize: 8,
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  skillChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  twoCol: { flexDirection: 'row', gap: 18, marginTop: 6 },
  col: { flex: 1 },
});

function chip(text: string, key: string | number) {
  return React.createElement(Text, { key, style: styles.chip }, text);
}

function PdfDoc({
  personal,
  links,
  skills,
  roles,
  education,
  certifications,
}: {
  personal: Awaited<ReturnType<typeof loadPersonal>>;
  links: Awaited<ReturnType<typeof loadLinks>>;
  skills: Awaited<ReturnType<typeof loadSkills>>;
  roles: Awaited<ReturnType<typeof loadRoles>>;
  education: Awaited<ReturnType<typeof loadEducation>>;
  certifications: Awaited<ReturnType<typeof loadCertifications>>;
}) {
  const fmt = (start: string, end: string | null) => {
    const f = (d: string) =>
      new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase();
    return `${f(start)} → ${end ? f(end) : 'now'}`;
  };

  const categories = [
    'languages',
    'backend',
    'frontend',
    'mobile',
    'data',
    'infra',
    'tools',
  ] as const;

  return React.createElement(
    Document,
    { title: `${personal.name} · CV`, author: personal.name },
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.name }, personal.name),
      React.createElement(Text, { style: styles.headline }, personal.headline),
      React.createElement(
        Text,
        { style: styles.meta },
        `${personal.location} · ${personal.email} · ${links.github} · ${links.linkedin}`,
      ),
      React.createElement(Text, { style: styles.bio }, personal.tagline),

      // SKILLS
      React.createElement(Text, { style: styles.h2 }, 'skills'),
      ...categories.map((cat) => {
        const inCat = skills.filter((s) => s.category === cat);
        if (inCat.length === 0) return null;
        return React.createElement(
          View,
          { key: cat, style: styles.skillGroup },
          React.createElement(Text, { style: styles.skillCatLabel }, categoryLabel(cat)),
          React.createElement(
            View,
            { style: styles.skillChips },
            ...inCat.map((s, i) => chip(s.name, `${cat}-${i}`)),
          ),
        );
      }),

      // EXPERIENCE
      React.createElement(Text, { style: styles.h2 }, 'experience'),
      React.createElement(
        View,
        { style: styles.rolesWrap },
        ...roles.map((r, i) =>
          React.createElement(
            View,
            { key: i, style: styles.roleRow, wrap: false },
            React.createElement(
              View,
              { style: styles.roleHeader },
              React.createElement(
                Text,
                { style: styles.roleTitle },
                `${r.title} · `,
                React.createElement(Text, { style: styles.roleCompany }, r.company),
              ),
              React.createElement(Text, { style: styles.roleMeta }, fmt(r.startDate, r.endDate)),
            ),
            React.createElement(
              Text,
              { style: styles.roleMeta },
              `${r.location}${r.remote ? ' · remote' : ''}`,
            ),
            ...r.bullets.map((b, j) =>
              React.createElement(Text, { key: j, style: styles.bullet }, `▸ ${b}`),
            ),
            r.stack.length > 0 &&
              React.createElement(
                View,
                { style: styles.stackRow },
                ...r.stack.map((s, k) => chip(s, `r-${i}-${k}`)),
              ),
          ),
        ),
      ),

      // EDUCATION + CERTS — two columns
      React.createElement(
        View,
        { style: styles.twoCol },
        education.length > 0 &&
          React.createElement(
            View,
            { style: styles.col },
            React.createElement(Text, { style: styles.h2 }, 'education'),
            ...education.map((e, i) =>
              React.createElement(
                View,
                { key: i, style: { marginBottom: 6 } },
                React.createElement(
                  Text,
                  { style: { fontSize: 9, fontWeight: 700 } },
                  `${e.degree} · ${e.school}`,
                ),
                React.createElement(
                  Text,
                  { style: styles.roleMeta },
                  `${e.startYear} — ${e.endYear} · ${e.location}`,
                ),
              ),
            ),
          ),
        certifications.length > 0 &&
          React.createElement(
            View,
            { style: styles.col },
            React.createElement(Text, { style: styles.h2 }, 'certifications'),
            ...certifications.map((c, i) =>
              React.createElement(
                View,
                { key: i, style: { marginBottom: 4 } },
                React.createElement(Text, { style: { fontSize: 9 } }, c.name),
                React.createElement(Text, { style: styles.roleMeta }, c.issuer),
              ),
            ),
          ),
      ),
    ),
  );
}

export const prerender = true;

export const GET: APIRoute = async () => {
  const [personal, links, skills, roles, education, certifications] = await Promise.all([
    loadPersonal(),
    loadLinks(),
    loadSkills(),
    loadRoles(),
    loadEducation(),
    loadCertifications(),
  ]);

  const buf = await renderToBuffer(
    PdfDoc({ personal, links, skills, roles, education, certifications }),
  );
  // Cast Node Buffer → Uint8Array for the Response BodyInit contract.
  return new Response(new Uint8Array(buf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'inline; filename="mateo-kadiu-cv.pdf"',
      'cache-control': 'public, max-age=3600',
    },
  });
};
