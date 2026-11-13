/**
 * Shared contracts between client storefronts (commerce-core API),
 * the bxy.cl configurator and the video-engine.
 *
 * Money is always an integer amount in CLP (no decimals).
 */

export type ISODateString = string;
export type CLP = number;

/* ------------------------------------------------------------------ */
/* Brand                                                              */
/* ------------------------------------------------------------------ */

export interface BrandPalette {
  background: string;
  foreground: string;
  accent: string;
  muted: string;
  border: string;
}

export interface BrandTypography {
  /** Technical / mono face, e.g. "JetBrains Mono" or "Geist Mono". */
  mono: string;
  /** Display face for headlines. */
  display: string;
  body: string;
}

export interface BrandVoice {
  /** ElevenLabs voice id used by the video-engine. */
  elevenLabsVoiceId: string;
  /** BCP-47 locale, e.g. "es-CL". */
  locale: string;
  /**
   * Phonetic replacements applied before TTS,
   * e.g. { "BxY": "B por Y", "$350.000 + IVA": "trescientos cincuenta mil pesos más IVA" }.
   */
  phonetics: Record<string, string>;
}

export interface BrandConfig {
  /** Stable kebab-case id, e.g. "bxy", "tripseeds". */
  slug: string;
  name: string;
  domain: string;
  logo: { light: string; dark: string };
  palette: BrandPalette;
  typography: BrandTypography;
  voice: BrandVoice;
  /** Base URL of the client's commerce-core Worker, e.g. "https://tripseeds-core.example.workers.dev". */
  storeApiUrl?: string;
}

/* ------------------------------------------------------------------ */
/* Commerce                                                           */
/* ------------------------------------------------------------------ */

export interface ProductImage {
  /** R2 object key or public URL. */
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: CLP;
  compareAtPrice?: CLP;
  stock: number;
  weightGrams?: number;
}

/** Shape returned by `GET /api/store/products`. */
export interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentProvider = "webpay" | "mercadopago" | "flow";

export interface OrderLine {
  productId: string;
  variantId: string;
  name: string;
  quantity: number;
  unitPrice: CLP;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  number: string;
  apartment?: string;
  commune: string;
  region: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotal: CLP;
  shippingCost: CLP;
  total: CLP;
  payment: { provider: PaymentProvider; reference?: string };
  shipping?: { address: ShippingAddress; quote: CourierQuote; trackingCode?: string };
  customerEmail: string;
  createdAt: ISODateString;
}

/* ------------------------------------------------------------------ */
/* Logistics module                                                   */
/* ------------------------------------------------------------------ */

export type Courier = "starken" | "blueexpress" | "chilexpress";

export interface CourierQuote {
  courier: Courier;
  service: string;
  price: CLP;
  estimatedDays: { min: number; max: number };
  originCommune: string;
  destinationCommune: string;
  quotedAt: ISODateString;
}

/* ------------------------------------------------------------------ */
/* Modular add-ons (upsell catalog)                                   */
/* ------------------------------------------------------------------ */

export type AddonId = "logistics" | "data-bi" | "motion-ai" | "design-packaging";

export type BillingModel = "one_time" | "monthly" | "per_service";

export interface ModularAddon {
  id: AddonId;
  name: string;
  description: string;
  billing: BillingModel;
  /** Net price in CLP (before IVA). Undefined when quoted per project. */
  priceNet?: CLP;
  owner: "bolder" | "yey";
}

/* ------------------------------------------------------------------ */
/* Video engine                                                       */
/* ------------------------------------------------------------------ */

export type SceneKind = "hook" | "product" | "feature" | "price" | "cta" | "logo";

export interface VideoStoryboardScene {
  id: string;
  kind: SceneKind;
  /** On-screen copy. */
  text: string;
  /** Spoken script sent to ElevenLabs (phonetic, may contain [tags] or SSML <break/>). */
  voiceover?: string;
  /** Path to the generated audio file, filled after TTS. */
  audioSrc?: string;
  /**
   * Scene length in frames. Must be derived from the real audio duration
   * when `audioSrc` exists; otherwise a fixed fallback.
   */
  durationInFrames: number;
  productId?: string;
}
