# 01 — Business Model

## Agency

BxY is a two-partner studio:

| Partner | Area |
|---------|------|
| **Bolder (Iván)** | Art direction, visual identity, UI/UX, packaging design, labels, motion design |
| **Yey** | Edge/Cloudflare architecture, e-commerce engine, API integrations, data science, BI, AI |

Default aesthetic for every deliverable: industrial / technical brutalist and compact.
High-contrast monochrome, technical type (`JetBrains Mono` / `Geist Mono`) + strong display face,
compact scales, `1px solid` borders, no unnecessary diffuse shadows, no emojis.

## Land & Expand ("Trojan horse")

### Entry product: BxY Commerce Core

- Price: **$350.000 CLP + IVA (pago único)**.
- Includes:
  - Custom storefront, for life.
  - Dedicated backend instance: API + unified Admin + D1 database + R2 bucket.
- No forced monthly fees in USD.
- **0% commission per sale.**

### Anti-Shopify argument

Target: cannabis ecosystem, growshops, author brands.

1. Removes the yearly USD drain of Shopify + patch apps + the extra 2% commission on
   Chilean gateways (Webpay / MercadoPago / Flow).
2. Total sovereignty and zero risk of account blocking or closure due to foreign policies
   against the cannabis sector (seeds, terpenes, paraphernalia).
3. Extreme speed from the Cloudflare Edge, with no junk plugins slowing mobile checkout.

### Founding case

**TripSeeds** — Blueprint 01, first client in production on this architecture.

## Expand: modular ecosystem

On top of the $350.000 + IVA chassis, clients add modules as they grow
(recurring or per-service billing):

| Module | Scope | Owner |
|--------|-------|-------|
| Logistics (Chile APIs) | Real-time rates and dispatch in checkout with **Starken, BlueExpress, Chilexpress** | Yey |
| Data Science & BI | Sales analysis, stock prediction, cohorts, executive reports | Yey |
| Motion Graphics & AI content | Programmatic catalog/campaign Reels with `apps/video-engine` (Remotion + ElevenLabs) | Bolder + Yey |
| Design & Packaging | Packaging, regulatory/creative labels, campaign banners | Bolder |

Module prices are not defined yet; quote per project. When defined, record them here
and in `ModularAddon.priceNet` (`packages/shared-types`).
