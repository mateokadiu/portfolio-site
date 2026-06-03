# `portfolio-site` — Implementation Plan

> A bento-grid interactive showcase at `mateokadiu.pages.dev`. Every project tile is a live mini-demo of the actual work — Stripe state machine animating through reauth, webhook gateway retry-backoff curve, **real** `<sk-counter>` Web Component embed from `shadowkit`, Skia-style heatmap from `studybuddy`, tax-ledger refund splitting animation, a rotating Three.js globe with my commit dots. Astro Islands + Framer Motion per tile + GSAP for hero scroll. Sub-50 KB JS homepage. Lighthouse 95+.

**Status:** Locked. Phase 0 starts.

## Locked decisions

| # | Setting | Locked value |
|---|---|---|
| 1 | Folder + repo name | `portfolio-site` at `~/Desktop/development/personal/portfolio-site/` and `github.com/mateokadiu/portfolio-site` |
| 2 | Deploy URL | `mateokadiu.pages.dev` — Cloudflare Pages free tier, $0/year forever |
| 3 | Theme | Dark-only, no light-mode toggle |
| 4 | 3D Three.js globe tile | **YES** — added as tile §5.9, `react-three-fiber` rotating globe with commit dots |
| 5 | shadowkit `<sk-counter>` | Real, vendored — copy from `~/Desktop/development/personal/shadowkit/examples/embed-counter/dist/` |
| 6 | Analytics | None |
| 7 | Accent color | Warm orange `oklch(0.65 0.18 25)` |
| 8 | Commit timeline | Spread Jun 3 → Jun 24, 2026 (~3 weeks, organic evening cadence, ~25-30 commits) |
| 9 | Visibility | Public OSS from day 1 |
| 10 | OG strategy | Per-project dynamic OG via `@vercel/og` at build time |
| 11 | License | MIT |
| 12 | Author email | `mateokadiu17@gmail.com` everywhere — no exceptions |
| 13 | Attribution | **No AI/Claude/Anthropic trace anywhere** — commits, comments, PRs, docs |

---

## 1. Goals & non-goals

### Goals
- **Bento grid with live demos**, not screenshots. Each project tile *runs* a stripped-down version of the actual project. The work demonstrates itself.
- **Astro Islands architecture** — homepage ships near-zero JS unless the user scrolls a tile into view. Each tile is its own lazy-hydrated React island.
- **Lighthouse 95+** across Performance, Accessibility, Best Practices, SEO. No exceptions on mobile.
- **Per-project deep-dives** at `/projects/[slug]` rendering MDX adapted from the existing `~/Desktop/portfolio/*.md` cheat sheets, with the same demo widget embedded full-size at the top.
- **One-page-deep, not infinite scroll.** Hero + bento + about + contact, in that order, all above 2× viewport on desktop.
- **Dark mode default.** No light-mode toggle in v0.1 (decision §11 #3).
- **Public OSS** at `github.com/mateokadiu/portfolio-site` (or however the repo's named) — the site that ships your repos is itself shippable.
- **Free deploy** — Cloudflare Pages, edge-cached, sub-30ms global TTFB.

### Non-goals (v0.1)
- No blog / CMS. Per-project deep-dives are static MDX. Blog comes later if ever.
- No light mode toggle. Dark-only.
- No comments / interactions. The site has zero state of its own.
- No analytics by default. (Plausible / Umami toggle in §11.)
- No CMS or admin. Content lives in MDX + TypeScript.
- No i18n. English only.

---

## 2. The look

The reference camps:

| Style | Examples | Verdict |
|---|---|---|
| Minimalist single-page | brittanychiang.com | Excellent but ubiquitous; doesn't showcase animation chops |
| Awwwards full-animation | dev.nazmul.co, Pacôme Pertant | High WOW; usually slow + accessibility-hostile |
| **Bento-grid interactive** | **Rauno Freiberg, Linear, Vercel design-engineer pages, Resend, Cal.com** | **Sweet spot — interactive without being slow, modern without being trendy** |
| Long-form essay | thesephist.com, tonsky.me | Great if you have essays to publish; we don't yet |

We're shipping **bento-grid interactive**. Specifically the Linear / Vercel-design-engineer flavor — generous spacing, dark theme with one accent color, real interactive widgets per tile, restraint everywhere else.

Aesthetic palette:
- Background: near-black `oklch(0.145 0 0)`
- Cards: `oklch(0.205 0 0)`
- Borders: `oklch(0.269 0 0)`
- Foreground: `oklch(0.985 0 0)`
- Accent: one bright color — TBD per §11 (recommend `oklch(0.65 0.18 25)` warm orange or `oklch(0.7 0.18 200)` cyan)
- Mono font: `JetBrains Mono` for code + numbers
- Sans font: `Geist` (Vercel's font, free) for body
- Display font: `Geist Mono` weight 600 for the name reveal

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Astro 5 (zero JS by default; per-island hydration)                       │
│                                                                          │
│  /                                                                       │
│  ├── Hero            (GSAP SplitText name reveal; runs once)             │
│  ├── Bento grid     (~12 tiles)                                          │
│  │   ├── temporal-stripe  → react island: state-machine widget          │
│  │   ├── webhook-gateway  → react island: retry-backoff curve           │
│  │   ├── shadowkit        → real <sk-counter> embed (Web Component)     │
│  │   ├── studybuddy       → react-three-fiber Skia-style heatmap        │
│  │   ├── tax-ledger       → react island: refund-split visualizer       │
│  │   ├── grpc-monorepo    → react island: proto-to-clients fan-out      │
│  │   ├── ai-trading-cop.  → react island: typewriter narrative          │
│  │   ├── about            → static — bio + skills chips                 │
│  │   ├── now              → static — what I'm building this week        │
│  │   ├── github           → static — recent commits feed (build-time)   │
│  │   └── contact          → static — email + socials                    │
│  └── Footer          (license, repo link)                                │
│                                                                          │
│  /projects/[slug]                                                        │
│  ├── MDX content from ~/Desktop/portfolio/*.md (adapted)                 │
│  └── <Demo /> island — same widget as the bento tile but full-size      │
│                                                                          │
│  Build → static .html + per-island JS chunks → Cloudflare Pages         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Islands strategy:**
- `client:visible` for everything below the fold — tile hydrates only when scrolled near
- `client:idle` for the hero (boots after Astro's main work is done; SplitText kicks in on idle)
- `client:load` for nothing on the homepage — we want zero blocking JS

**Page weight budget:**

| Asset | Budget |
|---|---|
| Initial HTML | < 30 KB |
| Critical CSS (inlined) | < 14 KB |
| Hero island JS (GSAP core + ScrollTrigger + SplitText) | < 40 KB gzipped, lazy |
| Per-tile island JS | < 15 KB gzipped each, lazy |
| Total JS on first paint | **0 KB** |
| Lighthouse LCP (mobile, slow 3G) | < 1.2s |
| Lighthouse score | ≥ 95 across all four pillars |

---

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | **Astro 5** | Zero JS by default; Islands for the interactive tiles; multi-framework support (React for tiles, Web Components for shadowkit embed) |
| Styling | **Tailwind v4** | Same primitives as your other projects; visual coherence; OKLCH color tokens |
| Component primitives | shadcn-style (handwritten, no install) | Subset — Button, Card, Tooltip. Not the full kit. |
| Tile interactivity | **Framer Motion** | Per-island layout animations, gesture handlers; ~32 KB per island that uses it |
| Hero animation | **GSAP + ScrollTrigger + SplitText** | Best-in-class scroll-driven hero work; CSS animations can't do per-character delayed reveals at this quality |
| Heatmap | **react-three-fiber + drei** (only on the studybuddy tile if §11 #4 says yes) | The one tile that genuinely benefits from WebGL |
| Fonts | **Geist Sans + Geist Mono + JetBrains Mono** | All open-source, self-hosted, woff2 subset |
| Icons | **Lucide React** | Tree-shakeable; only the ~10 icons we use |
| Content | **MDX** for project deep-dives | Lets us embed `<Demo />` per project inside long-form content |
| Build / package | **pnpm 9** + Astro's built-in bundler (Vite) | Same workspace tooling as your other projects |
| Lint | **Biome** | Matches your other repos |
| Tests | **Vitest** for utility logic + **Playwright** for visual regression on the bento grid | Smoke-test that the demos boot, screenshots match |
| CI | **GitHub Actions** | install + typecheck + biome + Playwright on PR |
| Deploy | **Cloudflare Pages** | Free tier, edge-cached, sub-30ms TTFB; built-in preview-per-PR |
| Domain | TBD §11 #2 | Probably `mateokadiu.dev` |

---

## 5. The 7 interactive tiles — specifications

Each tile is a single React component, default-export'd as an Astro Island. Each ships < 15 KB gzipped on its own. They go in `src/tiles/<Project>Tile.tsx`.

### 5.1 `temporal-stripe` — Animated state machine

```
┌──────────────────────────────────────┐
│ temporal-stripe                       │
│ Temporal workflows for Stripe Connect │
│                                       │
│   ┌──[ authorized ]                  │
│   ▼     ▲                            │
│ [ reauthorizing ]                    │  ← live reauth timer 4d
│         │   compensated                       │
│         ▼   ▲                       │
│   ┌──[ revising ]                    │
│   ▼     │                            │
│  ─[ multicapture (3/3) ]─[ captured]│
│         │                            │
│       ─[ canceled ]                  │
│                                       │
│ ▶ play  ⏸ pause  ⟳ reset             │
└──────────────────────────────────────┘
```

**Behavior:**
- Nodes are SVG circles connected by animated paths (Framer Motion's `motion.path` with `pathLength` from 0→1).
- Click Play → walks a scripted sample lifecycle: `authorized` → 4-day-timer-fires (rendered as a 4-second sped-up timer) → `reauthorizing` → `authorized` → `multicapture × 2` → `captured`.
- Click a node directly → jumps to it; if the transition isn't legal (e.g., `captured` → `revising`), the node shakes + red flash for 300ms.
- The reauth timer is a tiny ring spinner that animates from 100% to 0% over 4 seconds (representing 4 days).
- All state in a Zustand store local to the island (no global state).

**Bento size:** 2×2 (large)

### 5.2 `webhook-gateway` — Retry-backoff curve visualizer

```
┌──────────────────────────────────────┐
│ webhook-gateway                       │
│ Self-hosted webhook reliability       │
│                                       │
│  delivery #1  delivery #2  ...        │
│  ▓ ok                                 │
│  ▓░░  retrying ← exp backoff 30s     │
│     ▓░░░░  retrying 2m                │
│         ▓░░░░░░░░░  retrying 10m      │
│                  ▓✘ failed → DLQ      │
│                                       │
│ [▶ replay all]   [💀 toggle failure]  │
└──────────────────────────────────────┘
```

**Behavior:**
- A timeline (horizontal) shows individual delivery attempts as colored bars (green = ok, amber = retrying, red = failed).
- Toggle "downstream is down" → next delivery shows exponential backoff bars getting longer at each retry.
- Click "Replay all" → all bars animate from-scratch on a faster scale.
- The backoff schedule animates in real time using Framer Motion's `motion.div` with width keyframes.

**Bento size:** 2×1 (wide)

### 5.3 `shadowkit` — **Real** `<sk-counter>` Web Component embed

```
┌──────────────────────────────────────┐
│ shadowkit                             │
│ Tailwind v4 inside Shadow DOM         │
│                                       │
│        ┌─────────────────────┐       │
│        │  count: 7           │       │
│        │  [ - ]  [ + ]       │       │ ← actual <sk-counter>
│        └─────────────────────┘       │   from @shadowkit/* packages
│                                       │
│ [×] try to style it from outside     │
│  → "Cannot reach into Shadow DOM"     │
└──────────────────────────────────────┘
```

**Behavior:**
- Loads the *real* `<sk-counter>` Web Component from a bundled copy of the shadowkit `examples/embed-counter/` build.
- Below the embed: a toggle button "Inject host-page CSS targeting the counter" — when clicked, attempts to add `<style>.sk-counter { background: pink !important }</style>` to the document head, then shows a checkmark + message: "Style did NOT bleed through — Shadow DOM cascade boundary holding."
- This is the killer demo: you can SEE the cascade boundary working in real time.

**Bento size:** 2×1

### 5.4 `studybuddy` — Skia-style heatmap

```
┌──────────────────────────────────────┐
│ studybuddy                            │
│ On-device RAG study app — RN          │
│                                       │
│ ░░░░░▓▓░░▓▓▓▓▓▓░░░▓▓▓░░░░░▓▓░░░░░░░ │
│ ░░░░▓▓▓░░▓▓▓▓░░░░▓▓▓░░░▓▓░░░░░░░░░░ │
│ ░░░░▓▓░░░▓▓▓░░░░░▓▓░░░░▓░░░░░░░░░░░ │
│ ░░░░▓▓░░░░▓▓░░░░░░▓░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░▓░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░▓░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░▓░░░░░░░░░░░░░░░░░░░░░░░░ │
│ Jan      Feb      Mar      Apr      │
└──────────────────────────────────────┘
```

**Behavior:**
- 53×7 grid of cells (a year of review activity), Skia-style visual rendered via SVG or Canvas (no react-three-fiber needed — overkill).
- Animates fill from left to right on entry.
- Hover any cell → tooltip with "March 14 · 23 reviews"
- The actual data is generated from a `seedrandom` fixture so it looks plausible.

**Bento size:** 2×1 (wide)

### 5.5 `tax-ledger` — Refund-split visualizer

```
┌──────────────────────────────────────┐
│ tax-ledger                            │
│ OSS tax line-item splitter            │
│                                       │
│ Order:  $40.00 $30.00 $20.00 → $90    │
│ Tax:                          $7.20   │
│                                       │
│ split → CA state (6%)  $3.60          │
│         SF county (1.5%) $0.90        │
│         SF city (0.5%)   $0.30        │
│                                       │
│ [refund item 2 ($30)]                 │
│   → state delta -$1.20 ← anim         │
│   → county delta -$0.30               │
│   → city delta -$0.10                 │
│   sum → -$1.60 ✓ matches              │
└──────────────────────────────────────┘
```

**Behavior:**
- Click "refund item 2" → the tax line for that item splits into per-jurisdiction deltas, each animating into place with Framer Motion's `layout`.
- A running total at the bottom highlights GREEN when the deltas sum correctly. The whole demo is the "the sum invariant holds" pitch made visual.

**Bento size:** 2×2 (large)

### 5.6 `grpc-monorepo-starter` — Proto → multi-language client fan-out

```
┌──────────────────────────────────────┐
│ grpc-monorepo-starter                 │
│ Turborepo + NestJS + gRPC + clients   │
│                                       │
│      ┌─[ orders.proto ]─┐            │
│      ▼     ▼      ▼     ▼            │
│    [TS]  [Go]  [Py]  [Web]           │
│     ✓    ✓    ✓    ✓                 │
│                                       │
│ [▶ replay codegen]                    │
└──────────────────────────────────────┘
```

**Behavior:**
- The `.proto` block at the top has an animated cursor adding `rpc CreateOrder(...) returns (Order);` line by line.
- After ~1s, four arrows draw down to the four client boxes (TS / Go / Python / Connect-Web), each checkmark popping in 200ms apart.
- Click "Replay" → restart.

**Bento size:** 2×1

### 5.7 `ai-trading-copilot` — Typewriter narrative (private)

```
┌──────────────────────────────────────┐
│ ai-trading-copilot · 🔒 private       │
│ Claude-powered trading-journal AI     │
│                                       │
│ [trade: EUR/USD long, 0.5 lot, +$87]  │
│                                       │
│ ▸ Generated narrative                 │
│ This trade fits your typical London  │
│ open pattern — sized at your 30-day  │
│ median, held 47 minutes. Your jour-  │
│ nal note today flagged "confident,   │
│ patient" which the outcome corrobo-  │
│ rates. The exit was below your 80th  │
│ pctile profit-target ▮                │
│                                       │
│ ⟳ regenerate                          │
└──────────────────────────────────────┘
```

**Behavior:**
- "Trade" sample data on top.
- Below: a typewriter effect (Framer Motion `<motion.span>` with `width: 0 → 100%`) types out a hand-written narrative one character at a time, ~30ms/char.
- Click ⟳ → restart with a different pre-written narrative (we ship 3-4 sample narratives in a json file).
- Tile is marked **🔒 private** — the link goes to the portfolio cheat sheet, not the (private) repo.

**Bento size:** 2×2 (large)

### 5.8 `github-globe` — Three.js rotating globe (locked-in optional tile)

```
┌──────────────────────────────────────┐
│ github contributions · live           │
│                                       │
│            .  ·  .                    │
│         .  · ● · . ·                  │ ← orange dots = commit
│       ·  · · · · · ·  .               │   density per location
│      . · · ● · · · ● · .              │
│       ·  · · ●  · · ·                 │
│         .  · · ·  .                   │
│            ·  ·                       │
│                                       │
│ 412 commits across 7 repos this yr    │
└──────────────────────────────────────┘
```

**Behavior:**
- `react-three-fiber` + `@react-three/drei` rendering a low-poly globe (sphere geometry + thin atmosphere shell).
- Orange commit dots scattered at lat/lon points sampled from a static `commit-locations.json` fixture (a few invented points + Tirana, AL as the densest cluster).
- Globe rotates slowly on Y axis (~30s period). Drag to rotate manually; release → resumes auto-rotation.
- Commit dots gently pulse (scale 1 → 1.2 → 1, 2s loop).
- Lazy-hydrated `client:visible` like the other tiles. Total JS budget: ≤ 50 KB gzipped (drei is tree-shaken to just `OrbitControls` + nothing else).
- `prefers-reduced-motion` → static (no rotation, no pulse).

**Bento size:** 2×2 (large, centerpiece of the grid)

### 5.9 Utility tiles (4 more, smaller)

| Tile | Size | Content |
|---|---|---|
| `about` | 1×1 | Avatar, "Mateo Kadiu · Senior full-stack · Tirana, AL", one-sentence bio |
| `now` | 1×1 | "Currently exploring: on-device LLMs · BLE health · Web Components" — manually editable list |
| `github` | 1×1 | Latest 5 commits across all 7 repos, fetched at build time via `gh api` and rendered as a static list |
| `contact` | 1×1 | Email + GitHub + LinkedIn icons; mailto: + http links |

Total bento: **7 project tiles + 1 globe tile + 4 utility tiles = 12 tiles**, in a CSS Grid with mixed cell spans. Layout breakpoints:
- Desktop (≥1024): 6-column grid, mixed spans 1-2
- Tablet (≥768): 4-column grid
- Mobile: single-column stack

---

## 6. Project structure

```
portfolio-site/
├── PLAN.md
├── README.md
├── LICENSE                       MIT
├── package.json
├── pnpm-workspace.yaml           (in case we add packages later)
├── astro.config.mjs              integrations: tailwind, react, mdx, sitemap
├── tailwind.config.ts            tokens + Geist + JetBrains Mono
├── tsconfig.json
├── biome.json
├── playwright.config.ts
├── public/
│   ├── fonts/                    Geist + JetBrains Mono woff2 subsets
│   ├── og/                       generated OG images per project
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── pages/
│   │   ├── index.astro           hero + bento grid
│   │   ├── projects/
│   │   │   └── [slug].astro      MDX renderer
│   │   └── og/                   on-demand OG image generation (Astro endpoint)
│   ├── content/                  Astro content collections
│   │   └── projects/             one .mdx per project
│   │       ├── temporal-stripe.mdx
│   │       ├── webhook-gateway.mdx
│   │       ├── shadowkit.mdx
│   │       ├── grpc-monorepo-starter.mdx
│   │       ├── tax-ledger.mdx
│   │       ├── studybuddy.mdx
│   │       └── ai-trading-copilot.mdx
│   ├── layouts/
│   │   └── ProjectLayout.astro   MDX wrapper
│   ├── components/
│   │   ├── Hero.tsx              React island, GSAP SplitText
│   │   ├── BentoGrid.astro
│   │   ├── Tile.astro            wrapper with className, link, hover
│   │   ├── ui/                   handwritten shadcn-style primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Tooltip.tsx
│   │   └── chips/
│   │       └── StackChip.tsx
│   ├── tiles/                    interactive bento tiles (React islands)
│   │   ├── TemporalStripeTile.tsx
│   │   ├── WebhookGatewayTile.tsx
│   │   ├── ShadowkitTile.tsx
│   │   ├── StudybuddyTile.tsx
│   │   ├── TaxLedgerTile.tsx
│   │   ├── GrpcMonorepoTile.tsx
│   │   ├── AiTradingCopilotTile.tsx
│   │   ├── AboutTile.astro
│   │   ├── NowTile.astro
│   │   ├── GithubTile.astro      build-time gh-api fetch
│   │   └── ContactTile.astro
│   ├── lib/
│   │   ├── seededRandom.ts       deterministic data for the heatmap
│   │   ├── animations.ts         shared spring configs
│   │   └── data.ts               PROJECTS[] manifest, single source of truth
│   ├── styles/
│   │   └── global.css            @import "tailwindcss" + @theme tokens
│   └── env.d.ts
├── tests/
│   └── visual/                   Playwright screenshot suite
└── .github/workflows/
    ├── ci.yml                    install + biome + typecheck + playwright
    └── deploy.yml                Cloudflare Pages adapter (or via Pages git integration)
```

---

## 7. Key flows

### 7.1 Page load

```
1. HTML arrives (~28 KB)
2. Critical CSS renders (inlined, ~12 KB)
3. Fonts (Geist Sans + Mono subset) load in parallel (preloaded)
4. Hero text appears with letters in their final positions (no jank)
5. Astro idle callback fires → Hero island hydrates
   → GSAP SplitText replaces the letters with per-char spans
   → ScrollTrigger watches the bento section
6. User scrolls → first tile enters viewport
   → that tile's island hydrates (`client:visible`)
   → Framer Motion mounts; demo starts in a "muted, paused" state
   → IntersectionObserver hits 100% visible → demo auto-plays once
7. Each subsequent tile follows the same lazy-hydrate pattern
```

### 7.2 Tile → detail page

```
1. User clicks a tile
2. Astro view transition (browser-native, no extra JS) fades to /projects/[slug]
3. The detail page is pre-rendered MDX from src/content/projects/[slug].mdx
4. The same demo component re-mounts at full size at the top of the article
5. Below: long-form content from the portfolio cheat sheet (problem / architecture / tech stack / Q&A / numbers)
```

### 7.3 Build-time GitHub commits feed

```
1. astro.config.mjs runs a custom integration on build
2. The integration shells `gh api ... --paginate` for each of the 7 repos
3. Aggregates the most recent ~5 commits across all of them
4. Writes the result to src/lib/recent-commits.json
5. <GithubTile /> reads that JSON at render time → static HTML
6. Re-builds nightly via a Cloudflare Pages cron (or on every push)
```

---

## 8. Animation system

### 8.1 Hero

```ts
// src/components/Hero.tsx
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(SplitText, ScrollTrigger);

// On mount:
// 1. SplitText.create('.hero-name', { type: 'chars' })
// 2. Set initial state: chars at y=80, opacity 0
// 3. gsap.to() the chars with stagger 0.03, y=0, opacity=1, duration 0.8, ease 'power3.out'
// 4. After completion, a one-line tagline fades in
// 5. The scroll cue (small arrow + 'scroll') gently bobs forever via gsap.to(loop: true, yoyo: true)
```

### 8.2 Bento tile entry

Each tile uses `framer-motion`'s `motion.div` with `whileInView`:

```tsx
<motion.div
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-80px' }}
  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
>
  <Tile>...</Tile>
</motion.div>
```

Stagger comes from the parent `BentoGrid` setting `transition.delay = tileIndex * 0.04`.

### 8.3 Tile hover

Pure CSS — Tailwind utilities + `transition-colors`. No JS. The interactive widgets *inside* the tile handle their own gestures via Framer Motion.

### 8.4 Tile → detail page transition

Astro 5's native View Transitions API. Tag the tile and the detail-page hero with the same `transition:name="project-{slug}"` and the browser cross-fades + scales the element across navigations. Zero JS cost.

### 8.5 Accessibility

- `prefers-reduced-motion: reduce` short-circuits all the per-tile animations to instant fades
- All interactive widgets are operable by keyboard
- The Web Component demo (`<sk-counter>`) has aria-live announcements when its count changes
- Focus rings everywhere, in the accent color, never `outline: none`

---

## 9. Performance budget — non-negotiable

| Metric | Target | Tool |
|---|---|---|
| Lighthouse Performance | ≥ 95 | Lighthouse CI on every PR |
| Lighthouse Accessibility | ≥ 95 | Lighthouse CI |
| Lighthouse Best Practices | ≥ 95 | Lighthouse CI |
| Lighthouse SEO | 100 | Lighthouse CI |
| LCP (mobile, slow 3G) | < 1.2 s | Lighthouse |
| CLS | < 0.05 | Lighthouse |
| INP (interaction-to-next-paint) | < 100 ms | Lighthouse |
| HTML response | < 30 KB gzipped | curl -I + wc |
| First-paint JS | 0 KB | Astro build report |
| Total per-route JS | < 80 KB gzipped (sum of lazy chunks) | Astro build report |

If a tile blows the per-tile 15-KB budget, it gets refactored or split before merge.

---

## 10. Build phases

| Phase | Scope | Effort |
|---|---|---|
| **0** | Astro scaffold, Tailwind v4, Biome, dark-theme tokens, fonts self-hosted, layout shell, README + LICENSE, CI | 1 evening |
| **1** | Hero — GSAP SplitText name reveal + scroll cue; About / Contact / Now / Github static tiles + `data.ts` manifest | 1 evening |
| **2** | Bento grid skeleton — Tile component, responsive grid, lazy-hydration wiring | 1 evening |
| **3** | `temporal-stripe` tile — state machine SVG, Zustand store, click-to-step | 2 evenings |
| **4** | `webhook-gateway` tile — retry-backoff timeline, toggle, replay | 1 evening |
| **5** | `shadowkit` tile — bundle the example `<sk-counter>` build into `public/`, mount it; cascade-boundary toggle demo | 2 evenings |
| **6** | `studybuddy` tile — Skia-style heatmap (SVG, not WebGL — overkill); seeded data | 1 evening |
| **7** | `tax-ledger` tile — interactive refund split with layout animations | 2 evenings |
| **8** | `grpc-monorepo-starter` tile — proto-typing + fan-out arrow animation | 1 evening |
| **9** | `ai-trading-copilot` tile — typewriter narrative + sample narrative rotation | 1 evening |
| **10** | `/projects/[slug]` MDX routes — port the 7 portfolio cheat sheets to MDX; embed full-size demos at top | 2 evenings |
| **11** | View Transitions hookup for tile → detail flow | 1 evening |
| **12** | Playwright visual-regression smoke suite, Lighthouse CI, OG-image generation per project | 1 evening |
| **13** | Deploy: Cloudflare Pages, custom domain, preview-per-PR | 1 evening |
| **14** | Polish — accessibility audit, Lighthouse to ≥95 across the board, screenshots in README | 1 evening |

**Total v0.1:** ~18 evenings. 4-6 weeks at a sustainable pace.

---

## 11. Decisions (locked — for the record)

| # | Decision | Default (Recommended) | Alternative |
|---|---|---|---|
| 1 | Repo + folder name | `portfolio-site` (working name) | `mateokadiu.dev`, `mateokadiu-com`, your-domain-here |
| 2 | Domain | `mateokadiu.dev` (recommend — `.dev` is now mainstream + forces HTTPS) | `mateokadiu.com`, `kadiu.dev`, just deploy at Cloudflare Pages default |
| 3 | Light mode toggle | **No — dark-only** (modern portfolios skip this; one less surface; matches Vercel/Linear) | Yes — add a Sun/Moon toggle with `prefers-color-scheme` default |
| 4 | 3D GitHub globe / Three.js element | **No** — keep weight + complexity down; the existing 7 tiles are already animated | Yes — a single `<GithubGlobe />` tile with react-three-fiber (~120 KB extra JS) |
| 5 | shadowkit `<sk-counter>` source | **Real, vendored** — copy the production build from `~/Desktop/development/personal/shadowkit/examples/embed-counter/dist/` into `public/`. Demonstrates the *actual* code working. | npm-installed once shadowkit is published |
| 6 | Analytics | **None** in v0.1 (privacy + simplicity) | Plausible (free for OSS, GDPR-clean), Cloudflare Web Analytics (free, no cookies) |
| 7 | Accent color | **Warm orange** `oklch(0.65 0.18 25)` (warm + memorable + matches portfolio "warm dark" feel) | Cyan `oklch(0.7 0.18 200)`, lime, electric blue |
| 8 | Commit timeline | **Spread over ~3 weeks** (Jun 5 → Jun 26, organic evening cadence, ~25-30 commits) | Single sprint "built this week", ~10-15 commits |
| 9 | Visibility | **Public** at `github.com/mateokadiu/portfolio-site` from day one — the source code IS part of the portfolio | Private until polished |
| 10 | Repo location | `~/Desktop/development/personal/portfolio-site/` | other |
| 11 | OG image strategy | **Per-project dynamic OG image** generated at build via `@vercel/og` or Astro's image endpoint — better social-share appearance | Single static OG image for everything |

---

## 12. Out of scope (explicit so we don't drift)

- Blog / writing — v0.2 if you decide you want one. Long-form essays at `/notes` would be a separate route group.
- CMS — content is in MDX + TypeScript. Adding Sanity / Contentful for a one-person site is over-engineering.
- Authentication — no users, no comments, no logged-in surface.
- Multi-language — English only.
- Light mode — v0.2 if anyone asks.
- Search across project content — small surface; Cmd-K shortcut to project list is overkill at 7 projects.
- Backend — entirely static. No API routes (except the optional build-time GitHub commits fetch, which is just shelling `gh`).

---

## 13. References

- **Astro 5 + Islands** — https://docs.astro.build/en/concepts/islands/
- **Astro view transitions** — https://docs.astro.build/en/guides/view-transitions/
- **GSAP SplitText** — https://gsap.com/docs/v3/Plugins/SplitText/
- **Framer Motion** — https://www.framer.com/motion/
- **Brittany Chiang's portfolio** — https://brittanychiang.com (minimalist reference)
- **Rauno Freiberg** — https://rauno.me (bento-grid interactive reference)
- **Linear Method site** — https://linear.app (bento + interactive widget reference)
- **Vercel design-engineer pages** — https://vercel.com/design (the gold standard for bento)
- **Awwwards Developer Portfolios** — https://www.awwwards.com/websites/developer/
- **Cloudflare Pages** — https://pages.cloudflare.com
- **Lucide React icons** — https://lucide.dev
- **Geist font** — https://vercel.com/font

---

## 14. Out-of-band: how this re-uses everything you already have

- The 7 portfolio cheat sheets at `~/Desktop/portfolio/*.md` are 90% of the per-project deep-dive content. Phase 10 ports them to MDX.
- The shadowkit `<sk-counter>` example is *literally the working production demo* — just bundled into `public/`.
- The `tax-ledger` refund split is a direct UI translation of the library's `split` + `reconcile` functions. We can `import { split } from '@tax-ledger/core'` and run it client-side.
- The `temporal-stripe` state machine is the actual state graph documented in that project's PLAN.md §3. We're animating real state transitions, not invented ones.
- The `webhook-gateway` backoff is the actual default schedule `[30s, 2m, 10m, 1h, 6h, 24h]` from the repo. The "downstream is down" toggle is the same `dead` status the real gateway produces.

This isn't decorative animation. It's the work, viewable.
