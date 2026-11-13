# storefront-base (template)

Base storefront for a client. Custom-designed per client on top of this base.
Consumes the client's `__CLIENT_SLUG__-core` API. Waiting for the decoupled TripSeeds code.

## Target structure

```text
storefront-base/
├── src/
│   ├── lib/api.ts            typed client for <core>/api/store/* (StoreProduct, Order, CourierQuote)
│   ├── components/           atomic: atoms/ molecules/ organisms/
│   ├── pages/                home, catalog, product/[slug], cart, checkout, order/[id]
│   └── styles/               brand tokens (palette, typography) from the client's BrandConfig
├── public/
├── .env.example              PUBLIC_CORE_API_URL=https://__CLIENT_SLUG__-core.<account>.workers.dev
└── package.json
```

## Rules

- No business logic here: prices, stock and shipping quotes come from the core API.
- Checkout shipping uses the logistics module endpoint when contracted.
