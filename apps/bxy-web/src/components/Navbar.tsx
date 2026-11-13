import { CORE_PRICE_NET, formatClp, navLinks } from "../config/site";

/**
 * Fixed technical top bar. Static markup (no hydration): the mobile menu is a native
 * <details> disclosure, so it works without JavaScript.
 */
export function Navbar() {
  const cta = `[ INICIAR PROYECTO // ${formatClp(CORE_PRICE_NET)} + IVA ]`;

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-line bg-bg/95 backdrop-blur-sm">
      <nav
        aria-label="Principal"
        className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-6 border-x border-line px-4 md:px-8"
      >
        <a href="#top" className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-[13px] font-semibold tracking-tight text-fg">BxY // BOLDER x YEY</span>
          <span className="tag hidden border border-line px-2 py-0.5 2xl:inline">INFRASTRUCTURE & DESIGN STUDIO</span>
        </a>

        <ul className="hidden items-center gap-5 xl:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-mono text-[11px] tracking-wide text-muted transition-colors hover:text-fg"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a href="#configurador" className="btn btn-primary hidden lg:inline-flex">
          {cta}
        </a>

        <details className="group relative lg:hidden">
          <summary className="btn btn-ghost h-9 cursor-pointer list-none px-3 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">[ MENÚ ]</span>
            <span className="hidden group-open:inline">[ CERRAR ]</span>
          </summary>
          <div className="absolute right-0 top-[calc(100%+13px)] w-[min(20rem,calc(100vw-2rem))] border border-line bg-surface">
            <ul className="flex flex-col">
              {navLinks.map((link) => (
                <li key={link.href} className="border-b border-line last:border-b-0">
                  <a href={link.href} className="block px-4 py-3 font-mono text-[12px] text-muted hover:text-fg">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <a href="#configurador" className="btn btn-primary w-full">
              [ INICIAR PROYECTO ]
            </a>
          </div>
        </details>
      </nav>
    </header>
  );
}
