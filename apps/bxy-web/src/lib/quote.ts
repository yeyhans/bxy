import { CORE_PRICE_NET, IVA_RATE, contact, formatClp, quoterItems, type QuoterItemId } from "../config/site";

export interface QuoteRequest {
  brand: string;
  industry: string;
  currentUrl: string;
  modules: ReadonlyArray<QuoterItemId>;
}

export interface QuoteErrors {
  brand?: string;
  industry?: string;
  currentUrl?: string;
}

export function validateQuote(req: QuoteRequest): QuoteErrors {
  const errors: QuoteErrors = {};
  if (req.brand.trim().length < 2) errors.brand = "Escribe tu nombre o el de tu marca.";
  if (!req.industry) errors.industry = "Elige el rubro de tu tienda.";
  if (req.currentUrl.trim() && !isHttpUrl(normalizeUrl(req.currentUrl))) {
    errors.currentUrl = "Revisa la URL. Ejemplo: mitienda.cl";
  }
  return errors;
}

export function quoteTotals() {
  const iva = Math.round(CORE_PRICE_NET * IVA_RATE);
  return { net: CORE_PRICE_NET, iva, gross: CORE_PRICE_NET + iva };
}

/** Plain-text brief sent through WhatsApp or e-mail. Kept free of emojis by design. */
export function buildQuoteMessage(req: QuoteRequest): string {
  const totals = quoteTotals();
  const selected = quoterItems.filter((item) => req.modules.includes(item.id));
  const url = req.currentUrl.trim() ? normalizeUrl(req.currentUrl) : "Sin tienda actual";

  return [
    "Hola BxY, quiero solicitar el despliegue de mi tienda.",
    "",
    `Marca: ${req.brand.trim()}`,
    `Rubro: ${req.industry}`,
    `URL actual: ${url}`,
    "",
    "BASE",
    `- BxY Commerce Core (Storefront de por vida + Admin + API + DB dedicada): ${formatClp(totals.net)} CLP + IVA (${formatClp(totals.gross)} con IVA)`,
    "",
    "MÓDULOS ADICIONALES (cotización por proyecto)",
    ...(selected.length ? selected.map((item) => `- ${item.label}`) : ["- Ninguno por ahora"]),
  ].join("\n");
}

export function whatsappHref(message: string): string {
  const base = contact.whatsapp ? `https://wa.me/${contact.whatsapp}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function mailtoHref(req: QuoteRequest, message: string): string {
  const subject = `Solicitud BxY Commerce Core: ${req.brand.trim()}`;
  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}

function normalizeUrl(raw: string): string {
  const value = raw.trim();
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}
