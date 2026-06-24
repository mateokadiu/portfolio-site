import {
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
} from '~/lib/cv';

interface Props {
  skills: Skill[];
}

interface SimNode {
  id: string;
  skill: Skill;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink {
  source: string | SimNode;
  target: string | SimNode;
}

const WIDTH = 900;
const HEIGHT = 540;
const PROFICIENCY_ALPHA: Record<Proficiency, number> = {
  expert: 1,
  strong: 0.85,
  working: 0.65,
  learning: 0.45,
};
const PROFICIENCY_RADIUS: Record<Proficiency, number> = {
  expert: 28,
  strong: 24,
  working: 20,
  learning: 16,
};

export default function SkillGraph({ skills }: Props) {
  const reduced = useReducedMotion();
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const simRef = useRef<ReturnType<typeof forceSimulation> | null>(null);

  const { initialNodes, links } = useMemo(() => {
    const nodeMap = new Map<string, SimNode>();
    for (const s of skills) {
      nodeMap.set(s.slug, { id: s.slug, skill: s });
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
          .distance(90)
          .strength(0.35),
      )
      .force('charge', forceManyBody().strength(-280))
      .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
      .force(
        'collide',
        forceCollide<SimNode>().radius((d) => PROFICIENCY_RADIUS[d.skill.proficiency] + 8),
      )
      .force(
        'x',
        forceX<SimNode>((d) => {
          // Cluster categories horizontally
          const slot: Record<SkillCategory, number> = {
            languages: WIDTH * 0.15,
            backend: WIDTH * 0.4,
            frontend: WIDTH * 0.6,
            mobile: WIDTH * 0.78,
            data: WIDTH * 0.32,
            infra: WIDTH * 0.85,
            tools: WIDTH * 0.5,
          };
          return slot[d.skill.category];
        }).strength(0.06),
      )
      .force(
        'y',
        forceY<SimNode>((d) => {
          const slot: Record<SkillCategory, number> = {
            languages: HEIGHT * 0.3,
            backend: HEIGHT * 0.7,
            frontend: HEIGHT * 0.3,
            mobile: HEIGHT * 0.7,
            data: HEIGHT * 0.85,
            infra: HEIGHT * 0.3,
            tools: HEIGHT * 0.15,
          };
          return slot[d.skill.category];
        }).strength(0.06),
      );

    if (reduced) {
      sim.alpha(0).stop();
      // run a single tick to layout positions deterministically
      for (let i = 0; i < 300; i++) sim.tick();
      setNodes([...sim.nodes()]);
    } else {
      sim.on('tick', () => {
        setNodes([...sim.nodes()]);
      });
    }

    simRef.current = sim;
    return () => {
      sim.stop();
    };
  }, [initialNodes, links, reduced]);

  const connectedTo = useMemo(() => {
    if (!hover) return new Set<string>();
    const set = new Set<string>();
    for (const l of links) {
      const s = typeof l.source === 'string' ? l.source : l.source.id;
      const t = typeof l.target === 'string' ? l.target : l.target.id;
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
            const s = typeof l.source === 'string' ? l.source : l.source.id;
            const t = typeof l.target === 'string' ? l.target : l.target.id;
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
                stroke={isHot ? 'oklch(0.65 0.18 25)' : 'oklch(0.4 0 0)'}
                strokeWidth={isHot ? 1.2 : 0.8}
                strokeOpacity={isHot ? 0.85 : 0.28}
              />
            );
          })}
        </g>
        <g>
          {nodes.map((n) => {
            if (n.x == null || n.y == null) return null;
            const hue = categoryHue(n.skill.category);
            const r = PROFICIENCY_RADIUS[n.skill.proficiency];
            const alpha = PROFICIENCY_ALPHA[n.skill.proficiency];
            const isHot = hover === n.id || connectedTo.has(n.id);
            const dimmed = hover && !isHot;
            return (
              <motion.g
                key={n.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(n.id)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                role="button"
                aria-label={`${n.skill.name} · ${n.skill.proficiency} · ${n.skill.yearsUsing}y`}
                animate={
                  reduced ? undefined : { opacity: dimmed ? 0.4 : 1, scale: isHot ? 1.06 : 1 }
                }
                transition={{ duration: 0.18 }}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r}
                  fill={
                    n.skill.category === 'tools'
                      ? 'oklch(0.205 0 0)'
                      : `oklch(0.205 0.04 ${hue} / ${alpha})`
                  }
                  stroke={
                    hover === n.id ? 'oklch(0.85 0.16 25)' : `oklch(0.55 0.14 ${hue} / ${alpha})`
                  }
                  strokeWidth={hover === n.id ? 1.6 : 1}
                />
                <text
                  x={n.x}
                  y={n.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={alpha > 0.7 ? 'oklch(0.985 0 0)' : 'oklch(0.78 0 0)'}
                  className="font-mono pointer-events-none select-none"
                  fontSize={n.skill.proficiency === 'expert' ? 10 : 9}
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
            hover any node — bigger = more years using · brighter = stronger
          </p>
        )}
      </div>
    </div>
  );
}
