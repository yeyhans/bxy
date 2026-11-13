# 02 — Architecture

## Repositories

```text
bxy-platform/            (this repo)  agency web, video-engine, shared types, templates
../clients/<client-slug>  (one repo per client, generated from templates/)
```

Client repos stay outside this repo so their context, secrets and CI/CD never mix with the agency's.

## Client e-commerce: single-tenant in our Cloudflare account ("Option 3")

Every client gets its own resources inside the BxY Cloudflare account:

| Resource | Name |
|----------|------|
| Worker (API + Admin) | `<cliente>-core` |
| D1 database | `<cliente>-db` |
| R2 bucket | `<cliente>-media` |

Rules:

- **No shared tables with `tenant_id`.** Each client has an isolated schema so AI-assisted
  customizations for one client can never break another.
- Schema changes are per client, applied with D1 migrations in that client's repo.

## commerce-core: API + Admin unified

One project, one deploy, using **Cloudflare Workers Static Assets**:

```text
<cliente>-core Worker
├── /api/*        Hono API (store + admin endpoints)
│   ├── /api/store/products    public catalog (consumed by storefront and video-engine)
│   └── /api/admin/*           authenticated admin endpoints
└── /*            React/Vite Admin SPA (static assets)
```

Bindings: `DB` (D1), `MEDIA` (R2). Contracts come from `@bxy/shared-types`
(copied/pinned into the client repo at provisioning time).

## storefront-base

Client-facing store. Reads `/api/store/products` from its `<cliente>-core` Worker.
Fully custom design per client (Bolder), built from this base.

## video-engine (`apps/video-engine`)

- One Remotion engine, many brands: `src/brands/<slug>.brand.ts` exports a `BrandConfig`
  registered in `src/brands/index.ts`.
- Pulls catalog data from `<BrandConfig.storeApiUrl>/api/store/products` to build dynamic Reels.
- Structure: `src/primitives/` (reusable animated blocks), `src/storyboards/` (compositions),
  `src/formats/<format>/` (formats with their own pipeline), `studios/<format>/` (non-JS tooling, e.g. Blender).
- Brand and format are independent axes: a format receives a `BrandConfig` as a prop and never
  edits `src/brands/*`.
- **What-if 3D format:** `studios/whatif-3d` (Blender + Python kit) renders brand-neutral
  `footage.mp4` without captions; `src/formats/whatif-3d/WhatIf3D.tsx` overlays brand captions
  and tag. Flow and overrides in `studios/whatif-3d/CLAUDE.md`.
- **Determinism:** only `useCurrentFrame()`, `spring()`, `interpolate()`, `flubber`, `@remotion/three`.
  Forbidden: CSS transitions/animations, anime.js, framer-motion.

### Audio-first (ElevenLabs MCP)

1. Write the script per scene with phonetic Spanish for figures and acronyms
   (`"trescientos cincuenta mil pesos más IVA"`, `"B por Y"`).
2. Add vocal direction (`[sighs]`, `[excited]`, `[confident]`) or SSML `<break/>`.
3. Generate audio through the ElevenLabs MCP.
4. Set each scene's `durationInFrames` from the real audio duration
   (`Math.ceil(seconds * fps)`), never the other way around.

## Agency web (`apps/bxy-web`)

Astro 6, `output: 'server'`, `@astrojs/vercel` adapter, deployed on Vercel.
Vercel project **Root Directory must be `apps/bxy-web`**.
