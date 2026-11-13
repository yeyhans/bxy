import type { CSSProperties, ReactNode } from "react";
import { CORE_PRICE_NET, formatClp } from "../config/site";

interface HeroSectionProps {
  /** Media column. Passed from the page so the video player can hydrate as its own island. */
  children?: ReactNode;
}

const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

const guarantees = ["PAGO ÚNICO, 0% COMISIÓN", "LLAVE EN MANO", "MÓDULOS A TU MEDIDA"] as const;

export function HeroSection({ children }: HeroSectionProps) {
  return (
    <section id="top" aria-labelledby="hero-title" className="border-b border-line pt-16">
      <div className="grid grid-cols-1 lg:min-h-[calc(100dvh-4rem-3.25rem)] lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col justify-center gap-7 px-4 py-12 md:px-8 md:py-16 lg:border-r lg:border-line">
          <p className="tag enter" style={stagger(0)}>
            BXY COMMERCE CORE // E-COMMERCE PROPIO
          </p>

          <h1
            id="hero-title"
            className="enter max-w-[24ch] font-display text-4xl font-semibold leading-[1.04] tracking-tight md:text-5xl xl:text-[3.4rem]"
            style={stagger(1)}
          >
            Tu tienda online,{" "}
            <span className="text-muted">tuya de verdad.</span>
          </h1>

          <p
            className="enter max-w-[48ch] text-base leading-relaxed text-muted md:text-lg"
            style={stagger(2)}
          >
            Pagas una vez{" "}
            <strong className="font-mono font-semibold text-fg">{formatClp(CORE_PRICE_NET)} + IVA</strong>. Sin
            mensualidades en dólares, sin comisión por venta y sin una plataforma extranjera que pueda cerrarte la
            cuenta.
          </p>

          <div className="enter flex flex-wrap gap-3" style={stagger(3)}>
            <a href="#configurador" className="btn btn-primary">
              [ CONFIGURAR MI TIENDA ]
            </a>
            <a href="#propuesta" className="btn btn-ghost">
              [ CÓMO FUNCIONA ]
            </a>
          </div>
        </div>

        <div className="flex items-center justify-center border-t border-line bg-bg px-4 py-10 md:px-8 lg:border-t-0">
          <div className="w-full max-w-[22rem] lg:max-w-[min(22rem,calc((100dvh-12rem)*9/16))]">{children}</div>
        </div>
      </div>

      {/* Guarantee band: lives under the hero copy, not inside it. */}
      <ul className="grid grid-cols-1 border-t border-line sm:grid-cols-3">
        {guarantees.map((item, i) => (
          <li
            key={item}
            className={`flex h-[3.25rem] items-center gap-3 px-4 font-mono text-[12px] font-medium tracking-wide text-fg md:px-8 ${
              i > 0 ? "border-t border-line sm:border-l sm:border-t-0" : ""
            }`}
          >
            <span className="text-accent" aria-hidden="true">
              [+]
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
