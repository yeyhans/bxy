# commerce-core (template)

Single-tenant backend for one client: Hono API + React/Vite Admin SPA in one
Cloudflare Worker, deployed with Workers Static Assets. Waiting for the decoupled
TripSeeds code. `__CLIENT_SLUG__` is replaced by `scripts/create-client.sh`.

## Target structure

```text
commerce-core/
├── wrangler.jsonc            name: __CLIENT_SLUG__-core
│                             d1_databases: DB  -> __CLIENT_SLUG__-db
│                             r2_buckets:   MEDIA -> __CLIENT_SLUG__-media
│                             assets: { directory: "./dist/admin", not_found_handling: "single-page-application", run_worker_first: ["/api/*"] }
├── migrations/               D1 SQL migrations (0001_init.sql, ...)
├── src/
│   ├── worker/
│   │   ├── index.ts          Hono app, mounted under /api
│   │   ├── routes/
│   │   │   ├── store.ts      GET /api/store/products (public)
│   │   │   └── admin/        /api/admin/* (authenticated)
│   │   ├── modules/          optional: logistics (starken, blueexpress, chilexpress), payments
│   │   └── db/               queries / repositories over D1
│   └── admin/                React + Vite SPA (built to dist/admin)
├── package.json
└── vite.config.ts
```

## Rules

- No `tenant_id`: this instance belongs to exactly one client.
- Shapes returned by the API follow `@bxy/shared-types` (`StoreProduct`, `Order`, `CourierQuote`).
