# bxy-platform

Master monorepo of the BxY agency (`bxy.cl`). pnpm workspaces. Read `docs/` before
touching commercial copy, pricing, architecture or client provisioning.

## Map

| Path | What | Workspace pkg |
|------|------|---------------|
| `apps/bxy-web/` | Commercial site bxy.cl (Astro 6, Vercel adapter) | `@bxy/web` |
| `apps/video-engine/` | Central Reels/video factory (Remotion + ElevenLabs MCP) | `@bxy/video-engine` |
| `apps/video-engine/studios/whatif-3d/` | Blender + Python studio for 3D explainer footage (own `CLAUDE.md`) | not a JS pkg |
| `apps/video-engine/studios/history-i-guess/` | Code-drawn studio for "history of ___, i guess" videos (own `CLAUDE.md`) | not a JS pkg |
| `packages/shared-types/` | Shared TS contracts (`BrandConfig`, `StoreProduct`, `Order`, `CourierQuote`, `ModularAddon`, `VideoStoryboardScene`) | `@bxy/shared-types` |
| `templates/commerce-core/` | Single-tenant client backend template (Worker API + Admin SPA + D1 + R2) | not a workspace pkg |
| `templates/storefront-base/` | Client storefront template | not a workspace pkg |
| `scripts/create-client.sh` | Copies templates into `../clients/<client-slug>` | — |
| `.claude/skills/` | `bxy-business-context`, `bxy-video-director` | — |

Client production repos (e.g. `tripseeds`) NEVER live in this repo. They are generated
outside, in `../clients/<client-slug>`, from `templates/`.

## Commands (run from root)

```sh
pnpm install
pnpm dev:web      # bxy.cl dev server
pnpm build:web
pnpm dev:video    # Remotion Studio
pnpm typecheck
pnpm create-client <client-slug>
```

## Agency identity

- **Bolder (Iván):** art direction, visual identity, UI/UX, packaging and label design, motion design.
- **Yey:** Edge/Cloudflare architecture, e-commerce engine, API integrations, data science, BI and AI.

## Default design aesthetic

Industrial / technical brutalist, compact. High-contrast monochrome. Technical type
(`JetBrains Mono` / `Geist Mono`) paired with a strong display face. Compact scales,
thin `1px solid` borders, no unnecessary diffuse shadows, **no emojis**.

## Business rules (summary — full detail in `docs/01-BUSINESS-MODEL.md`)

- Entry product **"BxY Commerce Core"**: **$350.000 CLP + IVA (pago único)**.
  Lifetime custom storefront + dedicated backend instance (API + unified Admin + D1 + R2).
  No forced USD subscriptions, **0% commission per sale**.
- Strategy: Land & Expand. Anti-Shopify pitch focused on cannabis ecosystem / growshops / author brands.
- Founding case (Blueprint 01): **TripSeeds**.
- Upsell modules: Logistics (Starken, BlueExpress, Chilexpress), Data Science & BI,
  Motion Graphics & AI content (video-engine), Design & Packaging.

## Technical rules (full detail in `docs/02-ARCHITECTURE.md`)

- **Single-tenant in our Cloudflare account:** per client `<cliente>-core` Worker,
  `<cliente>-db` D1, `<cliente>-media` R2. **Never** shared tables with `tenant_id`.
- **API + Admin unified:** Hono API under `/api/*` + React/Vite Admin SPA in one project,
  deployed with **Cloudflare Workers Static Assets**.
- **video-engine:** one Remotion engine, many brands via `src/brands/<slug>.brand.ts`,
  consumes `/api/store/products`. Only `useCurrentFrame()`, `spring()`, `interpolate()`,
  `flubber`, `@remotion/three`. **Forbidden:** CSS transitions, anime.js, framer-motion.
- **Audio-first with ElevenLabs MCP:** phonetic writing for figures/acronyms in Spanish
  ("trescientos cincuenta mil pesos más IVA", "B por Y"), vocal direction tags
  (`[sighs]`, `[excited]`, `[confident]`) or SSML `<break/>`. Scene duration is derived
  from the real audio duration.

## Conventions

- Money: integer CLP, no decimals. Prices shown net + IVA unless stated.
- Generated code, comments and docs in English; customer-facing copy in Spanish (es-CL).
- Types shared across apps go in `packages/shared-types`, never duplicated.
- Conventional commits.
