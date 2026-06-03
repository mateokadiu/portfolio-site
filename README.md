# portfolio-site

Personal portfolio at [mateokadiu.pages.dev](https://mateokadiu.pages.dev) — a bento-grid interactive showcase where every project tile is a live mini-demo of the actual work.

Astro 5 + Tailwind v4 + React islands + Framer Motion + GSAP + react-three-fiber. Zero JS on first paint, lazy-hydrated tiles, Lighthouse 95+ across the board.

## What's in the grid

| Tile | What it is |
|---|---|
| `temporal-stripe` | Animated state machine — reauth timer, multicapture, illegal-transition shake |
| `webhook-gateway` | Retry-backoff timeline with exponential-backoff visualisation |
| `shadowkit` | A real `<sk-counter>` Web Component embed proving the Shadow DOM cascade boundary |
| `studybuddy` | 53×7 SVG heatmap with staggered fill animation |
| `tax-ledger` | Refund-split visualiser — jurisdiction deltas with layout animations |
| `grpc-monorepo-starter` | Proto-to-clients fan-out with typewriter codegen |
| `ai-trading-copilot` | Typewriter narrative over a sample trade (private, links to write-up) |
| `github-globe` | react-three-fiber rotating globe with commit dots |
| `about`, `now`, `github`, `contact` | Static utility tiles |

## Scripts

```bash
pnpm install
pnpm dev          # astro dev
pnpm build        # static export to dist/
pnpm preview      # serve dist/
pnpm typecheck    # astro check
pnpm lint         # biome check
pnpm test         # vitest
pnpm test:visual  # playwright visual smoke
```

## Stack

- Astro 5 (static, islands)
- Tailwind v4 via `@tailwindcss/vite`
- React 18 for interactive islands
- Framer Motion 11 for per-tile motion
- GSAP 3 (SplitText + ScrollTrigger) for the hero
- react-three-fiber + drei for the globe tile
- MDX for per-project deep-dives via Astro Content Collections
- Biome for lint + format, Vitest for units, Playwright for visual smoke

## Deploy

Cloudflare Pages (free tier). Build command `pnpm build`, output `dist/`. Deploys to [mateokadiu.pages.dev](https://mateokadiu.pages.dev).

## License

MIT — see [LICENSE](./LICENSE).
