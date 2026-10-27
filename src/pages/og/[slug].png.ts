import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import type { APIRoute } from 'astro';
import satori from 'satori';
import { SITE } from '~/lib/data';
import { getProjects } from '~/lib/projects';

const WIDTH = 1200;
const HEIGHT = 630;

interface OgSpec {
  slug: string;
  title: string;
  tagline: string;
  stack: string[];
}

const HOME_STACK = ['react', 'next.js', 'angular', 'nestjs', 'typescript'];
const ABOUT_STACK = ['nestjs', 'next.js', 'stripe connect', 'kubernetes', 'pulumi'];
const PROJECTS_STACK = ['temporal', 'stripe connect', 'nestjs', 'angular', 'spring boot'];

async function loadOgSpecs(): Promise<OgSpec[]> {
  const projects = await getProjects();
  const specs: OgSpec[] = [
    {
      slug: 'default',
      title: SITE.author,
      tagline:
        'Senior software engineer — React · Next.js · Angular · NestJS · Stripe Connect. Every project has an interactive demo.',
      stack: HOME_STACK,
    },
    {
      slug: 'about',
      title: SITE.author,
      tagline: `${SITE.jobTitle} · ${SITE.city}, ${SITE.countryCode} · remote-friendly, EU timezone.`,
      stack: ABOUT_STACK,
    },
    {
      slug: 'projects',
      title: 'projects',
      tagline: `${projects.length} open-source projects, each with an interactive demo.`,
      stack: PROJECTS_STACK,
    },
  ];

  for (const p of projects) {
    const stack = p.stack.slice(0, 5).map((s) => s.toLowerCase());
    specs.push({ slug: p.slug, title: p.name, tagline: p.tagline, stack });
  }

  return specs;
}

let fontCache: { mono: Buffer; monoBold: Buffer } | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;
  const root = process.cwd();
  const [mono, monoBold] = await Promise.all([
    readFile(resolve(root, 'src/lib/og-fonts/JetBrainsMono-Regular.ttf')),
    readFile(resolve(root, 'src/lib/og-fonts/JetBrainsMono-SemiBold.ttf')),
  ]);
  fontCache = { mono, monoBold };
  return fontCache;
}

function template(spec: OgSpec) {
  const isHome = spec.slug === 'default';
  const eyebrow = 'MATEOKADIU.COM';
  const stackLine = spec.stack.join(' · ');

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        // Satori (Yoga 3) defaults to content-box: without this the padding is
        // added to the canvas size and the footer + dots render off-canvas.
        boxSizing: 'border-box',
        backgroundColor: '#1a1a1a',
        backgroundImage:
          'radial-gradient(circle at 85% 15%, rgba(232, 88, 84, 0.22), rgba(232, 88, 84, 0) 55%)',
        color: '#fafafa',
        fontFamily: 'JetBrains Mono',
        position: 'relative',
        padding: '72px 80px',
      },
      children: [
        // Left accent bar
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '8px',
              backgroundColor: '#e85854',
            },
          },
        },
        // Header eyebrow
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontFamily: 'JetBrains Mono',
              fontSize: 24,
              letterSpacing: '0.16em',
              color: '#a1a1a1',
              textTransform: 'uppercase',
            },
            children: eyebrow,
          },
        },
        // Title + tagline block (pushed toward center)
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              marginTop: 96,
              maxWidth: '90%',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'JetBrains Mono',
                    fontSize: isHome ? 84 : 76,
                    fontWeight: 600,
                    color: '#fafafa',
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em',
                  },
                  children: spec.title,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    marginTop: 28,
                    fontFamily: 'JetBrains Mono',
                    fontSize: 26,
                    lineHeight: 1.4,
                    color: 'rgba(250, 250, 250, 0.72)',
                    maxWidth: '78%',
                  },
                  children: spec.tagline,
                },
              },
            ],
          },
        },
        // Footer — pushed to bottom via flex
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              marginTop: 'auto',
              fontFamily: 'JetBrains Mono',
              fontSize: 18,
              color: 'rgba(250, 250, 250, 0.5)',
              gap: 8,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex' },
                  children: 'github.com/mateokadiu',
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex' },
                  children: stackLine,
                },
              },
            ],
          },
        },
        // Bottom-right dots
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              right: 80,
              bottom: 96,
              display: 'flex',
              gap: 16,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#e85854',
                  },
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(232, 88, 84, 0.55)',
                  },
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(232, 88, 84, 0.25)',
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export const getStaticPaths = async () => {
  const specs = await loadOgSpecs();
  return specs.map((spec) => ({
    params: { slug: spec.slug },
    props: { spec },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const spec = props.spec as OgSpec;
  const fonts = await loadFonts();

  const svg = await satori(template(spec) as unknown as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: 'JetBrains Mono', data: fonts.mono, weight: 400, style: 'normal' },
      { name: 'JetBrains Mono', data: fonts.monoBold, weight: 600, style: 'normal' },
    ],
  });

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
  })
    .render()
    .asPng();

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
