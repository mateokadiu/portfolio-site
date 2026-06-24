import {
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from 'd3-force';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type Proficiency,
  type Skill,
  type SkillCategory,
  categoryHue,
  proficiencyDots,
} from '~/lib/cv-types';

interface Props {
  skills: Skill[];
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  skill: Skill;
  w: number;
  h: number;
}

type SimLink = SimulationLinkDatum<SimNode>;

const WIDTH = 900;
const HEIGHT = 540;

const PROFICIENCY_ALPHA: Record<Proficiency, number> = {
  expert: 1,
  strong: 0.85,
  working: 0.65,
  learning: 0.45,
};
const PROFICIENCY_HEIGHT: Record<Proficiency, number> = {
  expert: 34,
  strong: 30,
  working: 26,
  learning: 24,
};
const PROFICIENCY_FONT: Record<Proficiency, number> = {
  expert: 11,
  strong: 10,
  working: 10,
  learning: 9.5,
};

const CHAR_W = 6.8;
const PAD_X = 14;

function rectW(skill: Skill): number {
  return Math.max(56, skill.name.length * CHAR_W + PAD_X * 2);
}

const CATEGORY_ANCHOR: Record<SkillCategory, { x: number; y: number }> = {
  languages: { x: 0.16, y: 0.5 },
  backend: { x: 0.42, y: 0.55 },
  frontend: { x: 0.72, y: 0.4 },
  mobile: { x: 0.88, y: 0.72 },
  infra: { x: 0.55, y: 0.86 },
  data: { x: 0.22, y: 0.82 },
  tools: { x: 0.52, y: 0.16 },
};

export default function SkillGraph({ skills }: Props) {
  const reduced = useReducedMotion();
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);

  const { initialNodes, links } = useMemo(() => {
    const nodeMap = new Map<string, SimNode>();
    for (const s of skills) {
      nodeMap.set(s.slug, {
        id: s.slug,
        skill: s,
        w: rectW(s),
        h: PROFICIENCY_HEIGHT[s.proficiency],
      });
    }
    const linksOut: SimLink[] = [];
    for (const s of skills) {
      for (const dep of s.unlockedBy) {
        if (nodeMap.has(dep)) {
          linksOut.push({ source: dep, target: s.slug });
        }
      }
    }
    return { initialNodes: Array.from(nodeMap.values()), links: linksOut };
  }, [skills]);

  useEffect(() => {
    const sim = forceSimulation<SimNode>(initialNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(58)
          .strength(0.4),
      )
      .force('charge', forceManyBody().strength(-180))
      .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
      .force(
        'collide',
        forceCollide<SimNode>().radius((d) => {
          // circumscribed circle around the rect + padding
          return Math.sqrt((d.w / 2) ** 2 + (d.h / 2) ** 2) + 4;
        }),
      )
      .force(
        'x',
        forceX<SimNode>((d) => CATEGORY_ANCHOR[d.skill.category].x * WIDTH).strength(0.12),
      )
      .force(
        'y',
        forceY<SimNode>((d) => CATEGORY_ANCHOR[d.skill.category].y * HEIGHT).strength(0.12),
      );

    // Run the simulation to a stable layout synchronously so first paint has
    // positioned nodes. Production builds were rendering an empty SVG when we
    // relied on the async .on('tick') subscription only.
    sim.stop();
    for (let i = 0; i < 360; i++) sim.tick();

    // Clamp inside viewport with rect-aware margins.
    const placed = sim.nodes().map((n) => {
      const halfW = n.w / 2;
      const halfH = n.h / 2;
      const x = Math.max(halfW + 4, Math.min(WIDTH - halfW - 4, n.x ?? WIDTH / 2));
      const y = Math.max(halfH + 4, Math.min(HEIGHT - halfH - 4, n.y ?? HEIGHT / 2));
      return { ...n, x, y };
    });
    setNodes(placed);

    simRef.current = sim;
    return () => {
      sim.stop();
    };
  }, [initialNodes, links, reduced]);

  const getId = (endpoint: string | number | SimNode) =>
    typeof endpoint === 'object' ? endpoint.id : String(endpoint);

  const connectedTo = useMemo(() => {
    if (!hover) return new Set<string>();
    const set = new Set<string>();
    for (const l of links) {
      const s = getId(l.source);
      const t = getId(l.target);
      if (s === hover) set.add(t);
      if (t === hover) set.add(s);
    }
    return set;
  }, [hover, links]);

  const focused = hover ? nodes.find((n) => n.id === hover)?.skill : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="skill graph"
      >
        <g>
          {links.map((l) => {
            const s = getId(l.source);
            const t = getId(l.target);
            const a = nodes.find((n) => n.id === s);
            const b = nodes.find((n) => n.id === t);
            if (!a || !b || a.x == null || b.x == null) return null;
            const isHot = hover && (s === hover || t === hover);
            return (
              <line
                key={`${s}-${t}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={isHot ? 'oklch(0.7 0.18 25)' : 'oklch(0.45 0 0)'}
                strokeWidth={isHot ? 1.4 : 0.8}
                strokeOpacity={isHot ? 0.9 : 0.22}
              />
            );
          })}
        </g>
        <g>
          {nodes.map((n) => {
            if (n.x == null || n.y == null) return null;
            const hue = categoryHue(n.skill.category);
            const alpha = PROFICIENCY_ALPHA[n.skill.proficiency];
            const isHot = hover === n.id || connectedTo.has(n.id);
            const dimmed = hover && !isHot;
            const isTools = n.skill.category === 'tools';
            return (
              <motion.g
                key={n.id}
                style={{ cursor: 'pointer', transformOrigin: `${n.x}px ${n.y}px` }}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(n.id)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                role="button"
                aria-label={`${n.skill.name} · ${n.skill.proficiency} · ${n.skill.yearsUsing}y`}
                animate={
                  reduced ? undefined : { opacity: dimmed ? 0.35 : 1, scale: isHot ? 1.04 : 1 }
                }
                transition={{ duration: 0.18 }}
              >
                <rect
                  x={n.x - n.w / 2}
                  y={n.y - n.h / 2}
                  width={n.w}
                  height={n.h}
                  rx={2}
                  ry={2}
                  fill={
                    isTools
                      ? 'oklch(0.18 0 0)'
                      : `oklch(0.2 0.05 ${hue} / ${0.55 + alpha * 0.3})`
                  }
                  stroke={
                    hover === n.id
                      ? `oklch(0.78 0.18 ${hue})`
                      : `oklch(0.6 0.16 ${hue} / ${alpha})`
                  }
                  strokeWidth={hover === n.id ? 1.6 : 1}
                />
                <text
                  x={n.x}
                  y={n.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={
                    alpha > 0.7
                      ? 'oklch(0.985 0 0)'
                      : `oklch(0.85 0.06 ${hue})`
                  }
                  className="pointer-events-none select-none font-mono"
                  fontSize={PROFICIENCY_FONT[n.skill.proficiency]}
                  letterSpacing="0.02em"
                >
                  {n.skill.name}
                </text>
              </motion.g>
            );
          })}
        </g>
      </svg>

      {/* Detail panel */}
      <div className="mt-4 min-h-[88px] rounded-xl border border-border bg-card p-4">
        {focused ? (
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-semibold text-foreground">
                  {focused.name}
                </span>
                <span
                  className="rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                  style={{
                    color: `oklch(0.78 0.12 ${categoryHue(focused.category)})`,
                    borderColor: `oklch(0.55 0.14 ${categoryHue(focused.category)} / 0.5)`,
                  }}
                >
                  {focused.category}
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-muted">
                {focused.proficiency} · {focused.yearsUsing}{' '}
                {focused.yearsUsing === 1 ? 'year' : 'years'} using
                {focused.unlockedBy.length > 0 ? (
                  <span>
                    {' '}
                    · built on{' '}
                    <span className="text-foreground">{focused.unlockedBy.join(', ')}</span>
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      i < proficiencyDots(focused.proficiency)
                        ? `oklch(0.7 0.16 ${categoryHue(focused.category)})`
                        : 'oklch(0.3 0 0)',
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="font-mono text-[11px] text-muted">
            hover any node — wider = longer name · brighter border = stronger · lines = built on
          </p>
        )}
      </div>
    </div>
  );
}
