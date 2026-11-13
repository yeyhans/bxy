# 03 — Client Provisioning

Flow to create a new satellite repository for a client.

## 1. Generate the repo

```sh
pnpm create-client <client-slug>
# or: bash scripts/create-client.sh <client-slug> [target-parent-dir]
```

- `<client-slug>`: lowercase kebab-case (`tripseeds`, `green-house`).
- Default target: `../clients/<client-slug>` (outside this repo).
- Copies `templates/commerce-core` → `<target>/core` and `templates/storefront-base` → `<target>/storefront`.
- Replaces the `__CLIENT_SLUG__` placeholder in text files.
- Runs `git init` in the new repo. Never overwrites an existing directory.

## 2. Create Cloudflare resources (BxY account)

```sh
npx wrangler d1 create <client-slug>-db
npx wrangler r2 bucket create <client-slug>-media
```

Put the returned D1 `database_id` into `core/wrangler.jsonc`.

## 3. Deploy

```sh
cd core && npx wrangler deploy        # creates the <client-slug>-core Worker
```

## 4. Register the brand in the video-engine

Create `apps/video-engine/src/brands/<client-slug>.brand.ts` exporting a `BrandConfig`
with `storeApiUrl` pointing to the client's Worker, and add it to `src/brands/index.ts`.

## 5. Checklist

- [ ] Repo generated in `../clients/<client-slug>` and pushed to its own remote
- [ ] `<client-slug>-db` and `<client-slug>-media` created
- [ ] `<client-slug>-core` deployed, Admin reachable
- [ ] Storefront deployed against the core API
- [ ] Brand registered in `apps/video-engine`
- [ ] Contracted modules recorded (logistics, data-bi, motion-ai, design-packaging)
