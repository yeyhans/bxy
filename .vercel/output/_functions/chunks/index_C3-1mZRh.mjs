import { c as createComponent } from './astro-component_DHXNhMne.mjs';
import 'piccolore';
import { h as addAttribute, r as renderTemplate, n as renderHead, u as unescapeHTML, o as renderComponent } from './entrypoint_DmDZ76Jh.mjs';
import 'clsx';

const $$BaseHead = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$BaseHead;
  const canonicalURL = new URL(Astro2.url.pathname, Astro2.site);
  const { title, description, image = "/og-image.png" } = Astro2.props;
  return renderTemplate`<!-- Global Metadata --><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><!-- Font preloads --><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;500&display=swap" rel="stylesheet"><!-- Canonical URL --><link rel="canonical"${addAttribute(canonicalURL, "href")}><!-- Primary Meta Tags --><title>${title}</title><meta name="title"${addAttribute(title, "content")}><meta name="description"${addAttribute(description, "content")}><!-- Open Graph / Facebook --><meta property="og:type" content="website"><meta property="og:url"${addAttribute(Astro2.url, "content")}><meta property="og:title"${addAttribute(title, "content")}><meta property="og:description"${addAttribute(description, "content")}><meta property="og:image"${addAttribute(new URL(image, Astro2.url), "content")}><!-- Twitter --><meta property="twitter:card" content="summary_large_image"><meta property="twitter:url"${addAttribute(Astro2.url, "content")}><meta property="twitter:title"${addAttribute(title, "content")}><meta property="twitter:description"${addAttribute(description, "content")}><meta property="twitter:image"${addAttribute(new URL(image, Astro2.url), "content")}>`;
}, "C:/Users/yeyso/Desktop/web/byx/src/components/BaseHead.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const title = "BYX | Experiencias Digitales Minimalistas";
  const description = "Portfolio y servicios profesionales de BYX. Creamos experiencias web minimalistas, rápidas y de alto rendimiento.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BYX",
    "url": "https://byx.cl",
    "description": description,
    "sameAs": [
      "https://bolderprocess.com/",
      "https://yhans.cl"
    ]
  };
  return renderTemplate(_a || (_a = __template(['<html lang="es"> <head>', '<script type="application/ld+json">', "<\/script>", '</head> <body> <main> <div class="logo-container"> <img src="/logo.PNG" alt="BYX Logo" class="logo"> </div> </main> <footer> <div class="social-links"> <a href="https://bolderprocess.com/" target="_blank" rel="noopener noreferrer" class="social-link"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> <span>Bolder Process</span> </a> <a href="https://yhans.cl" target="_blank" rel="noopener noreferrer" class="social-link"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> <span>Yhans.cl</span> </a> </div> </footer> </body> </html>'])), renderComponent($$result, "BaseHead", $$BaseHead, { "title": title, "description": description }), unescapeHTML(JSON.stringify(jsonLd)), renderHead());
}, "C:/Users/yeyso/Desktop/web/byx/src/pages/index.astro", void 0);

const $$file = "C:/Users/yeyso/Desktop/web/byx/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
