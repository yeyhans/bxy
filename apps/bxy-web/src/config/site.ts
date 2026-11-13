/**
 * Commercial data for the bxy.cl landing page.
 * Source of truth for prices and modules: docs/01-BUSINESS-MODEL.md.
 * Money is integer CLP, net of IVA unless stated.
 */

export const IVA_RATE = 0.19;

export const CORE_PRICE_NET = 350_000;

export const contact = {
  /**
   * WhatsApp number in international format without "+" (e.g. "56912345678").
   * TODO: set the agency number. While empty, the quoter opens WhatsApp's contact picker.
   */
  whatsapp: "",
  /** TODO: confirm the agency inbox. */
  email: "hola@bxy.cl",
} as const;

export const navLinks = [
  { href: "#commerce-core", label: "01. COMMERCE CORE" },
  { href: "#vs-shopify", label: "02. VS SHOPIFY" },
  { href: "#ecosistema", label: "03. ECOSISTEMA" },
  { href: "#casos", label: "04. CASOS" },
  { href: "#configurador", label: "05. CONFIGURADOR" },
] as const;

/** Hero video slot. Drop the rendered file from apps/video-engine into public/video/. */
export const heroVideo = {
  src: "/video/anti-shopify-manifesto.mp4",
  poster: "/video/anti-shopify-manifesto.jpg",
  label: "RENDER // ANTI-SHOPIFY-MANIFESTO.MP4 // 60FPS",
} as const;

/* ------------------------------------------------------------------ */
/* Comparison                                                          */
/* ------------------------------------------------------------------ */

export const comparisonRows = [
  {
    concept: "Costo base",
    shopify: "~$39 a $105 USD/mes de por vida",
    bxy: "$350.000 CLP + IVA pago único. Frontend de por vida",
  },
  {
    concept: "Comisión por transacción externa (Webpay / MercadoPago / Flow)",
    shopify: "1% a 2% de castigo por cada venta",
    bxy: "0%. Todo el margen es tuyo",
  },
  {
    concept: "Apps y plugins (couriers, popups, SEO)",
    shopify: "+$50 a $150 USD/mes en apps lentas",
    bxy: "Módulos nativos en el código, sin frenar la web",
  },
  {
    concept: "Riesgo de censura (rubro cannábico / grow / autor)",
    shopify: "Alto riesgo de congelamiento de cuenta por políticas de EE.UU.",
    bxy: "Soberanía total: base de datos y servidor propios",
  },
] as const;

/**
 * Conservative 24-month reference scenario. Every input is shown on the page,
 * so the visitor can audit the math. Update the exchange rate when it drifts.
 */
export const savingsScenario = {
  months: 24,
  usdToClp: 950,
  planUsd: 39,
  appsUsd: 80,
  monthlySalesClp: 2_000_000,
  commissionRate: 0.01,
} as const;

export function computeSavings(s = savingsScenario) {
  const subscriptions = Math.round((s.planUsd + s.appsUsd) * s.usdToClp * s.months);
  const commissions = Math.round(s.monthlySalesClp * s.commissionRate * s.months);
  const shopifyTotal = subscriptions + commissions;
  const bxyTotal = Math.round(CORE_PRICE_NET * (1 + IVA_RATE));
  return { subscriptions, commissions, shopifyTotal, bxyTotal, savings: shopifyTotal - bxyTotal };
}

/* ------------------------------------------------------------------ */
/* Core package                                                        */
/* ------------------------------------------------------------------ */

export const corePackage = [
  {
    title: "Storefront de alta conversión",
    term: "De por vida",
    body: "Diseño UI/UX adaptado a tu marca por Bolder, servido desde el edge en milisegundos.",
  },
  {
    title: "Core Engine unificado",
    term: "API + Admin",
    body: "Panel privado para gestionar productos, stock, pedidos y clientes sin depender de terceros.",
  },
  {
    title: "Base de datos D1 + almacenamiento R2",
    term: "Aislados",
    body: "Instancia dedicada por cliente. Tus datos no se mezclan con los de otras tiendas.",
  },
  {
    title: "Checkout chileno nativo",
    term: "Webpay / MercadoPago / Flow",
    body: "Listo para conectar tus credenciales directas de pago. El dinero llega a tu cuenta.",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Modules                                                             */
/* ------------------------------------------------------------------ */

export type QuoterItemId =
  | "logistics"
  | "data-bi"
  | "motion-ai"
  | "design-packaging"
  | "catalog-migration";

export const modules = [
  {
    id: "logistics",
    title: "API logística Chile",
    detail: "Starken, BlueExpress, Chilexpress",
    body: "Cotización dinámica por peso y comuna en el checkout, más generación de envíos.",
    credit: "[ENGINEERED BY YEY]",
  },
  {
    id: "data-bi",
    title: "Ciencia de datos, BI e informes ejecutivos",
    detail: "Rentabilidad, stock, clientes",
    body: "Rentabilidad real, predicción de quiebre de stock y comportamiento de clientes para decidir con datos.",
    credit: "[DATA SCIENCE BY YEY]",
  },
  {
    id: "motion-ai",
    title: "Motion graphics programáticos",
    detail: "Reels Remotion + IA",
    body: "Reels dinámicos conectados a tu catálogo para campañas y lanzamientos.",
    credit: "[MOTION BY BOLDER x YEY]",
  },
  {
    id: "design-packaging",
    title: "Dirección de arte y packaging",
    detail: "Envases, etiquetas, banners",
    body: "Cajas, etiquetas y gráfica continua para que el producto destaque en físico y digital.",
    credit: "[DESIGNED BY BOLDER]",
  },
] as const;

export const quoterItems: ReadonlyArray<{ id: QuoterItemId; label: string }> = [
  { id: "logistics", label: "Integración API Couriers (Starken / BlueExpress / Chilexpress)" },
  { id: "data-bi", label: "Módulo Ciencia de Datos & Informes de Toma de Decisiones" },
  { id: "motion-ai", label: "Pack Motion Graphics (Reels Remotion) & Contenido RRSS" },
  { id: "design-packaging", label: "Diseño de Packaging, Etiquetas o Banners de Campaña" },
  { id: "catalog-migration", label: "Migración de Catálogo desde Shopify / WooCommerce" },
];

export const industries = [
  "Growshop",
  "Semillas",
  "E-commerce general",
  "Marca propia",
] as const;

/* ------------------------------------------------------------------ */
/* Case study                                                          */
/* ------------------------------------------------------------------ */

export const tripseeds = {
  /** TODO: set the production URL once confirmed. Hidden while empty. */
  url: "",
  /**
   * TODO: replace with measured values (PageSpeed Insights + real checkout traces)
   * before publishing. These come from the brief, not from a measurement in this repo.
   */
  metrics: [
    { label: "LIGHTHOUSE PERFORMANCE", value: "99/100" },
    { label: "ARCHITECTURE", value: "SINGLE-TENANT EDGE" },
    { label: "CHECKOUT LATENCY", value: "<50MS" },
  ],
} as const;

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export const formatClp = (value: number) => clpFormatter.format(value);
