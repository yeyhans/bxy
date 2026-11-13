import type { ReactNode } from "react";
import { CORE_PRICE_NET, formatClp, modules } from "../config/site";
import { SectionHeading } from "./SectionHeading";

type ModuleId = (typeof modules)[number]["id"];

/**
 * One visual motif per module. Each communicates what the module does
 * (routes, signal, frames, dielines) and only the first three move, once per loop,
 * gated by prefers-reduced-motion in global.css.
 */
const visuals: Record<ModuleId, ReactNode> = {
  logistics: (
    <div className="grid-texture relative flex h-full min-h-[9rem] flex-col justify-center gap-2 overflow-hidden px-5">
      {["STARKEN", "BLUEEXPRESS", "CHILEXPRESS"].map((carrier, i) => (
        <div key={carrier} className="flex items-center gap-3 bg-bg/80 font-mono text-[11px] text-muted">
          <span className="w-24 shrink-0 text-fg">{carrier}</span>
          <span className="relative h-px flex-1 bg-line-strong">
            <span className="module-route absolute inset-0" style={{ animationDelay: `${i * 0.6}s` }}>
              <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 bg-accent" />
            </span>
          </span>
        </div>
      ))}
    </div>
  ),
  "data-bi": (
    <div className="flex h-full min-h-[9rem] items-end gap-1.5 px-5 pb-5" aria-hidden="true">
      {[38, 52, 44, 61, 57, 72, 66, 84].map((h, i) => (
        <span
          key={i}
          className={`module-bar flex-1 ${i === 7 ? "bg-accent" : "bg-line-strong"}`}
          style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }}
        />
      ))}
    </div>
  ),
  "motion-ai": (
    <div className="flex h-full min-h-[9rem] items-center justify-center gap-2 px-5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="module-frame aspect-[9/16] w-8 border border-accent/70 bg-accent/10"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </div>
  ),
  "design-packaging": (
    <div
      className="h-full min-h-[9rem] bg-[repeating-linear-gradient(135deg,var(--line)_0_1px,transparent_1px_12px)]"
      aria-hidden="true"
    />
  ),
};

/** Asymmetric 3-column bento: wide + narrow, then narrow + wide. Exactly four cells. */
const spans: Record<ModuleId, string> = {
  logistics: "md:col-span-2 md:border-r",
  "data-bi": "md:col-span-1",
  "motion-ai": "md:col-span-1 md:border-r bg-surface",
  "design-packaging": "md:col-span-2",
};

export function ModularEcosystemSection() {
  return (
    <section id="ecosistema" aria-labelledby="ecosistema-title" className="border-b border-line">
      <SectionHeading
        id="ecosistema-title"
        index="03"
        title="Módulos de escalamiento plug & play"
        intro={`Empiezas con el Core de ${formatClp(CORE_PRICE_NET)} + IVA y conectas potencia según las necesidades de tu operación.`}
      />

      <ul className="grid grid-cols-1 md:grid-cols-3">
        {modules.map((mod, i) => (
          <li
            key={mod.id}
            className={`flex flex-col border-line ${i < 2 ? "border-b" : i === 2 ? "border-b md:border-b-0" : ""} ${spans[mod.id]}`}
          >
            <div className="border-b border-line">{visuals[mod.id]}</div>
            <div className="flex flex-1 flex-col gap-4 px-4 py-6 md:px-8 md:py-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="font-display text-xl font-semibold tracking-tight md:text-2xl">{mod.title}</h3>
                <span className="tag text-accent">{mod.credit}</span>
              </div>
              <p className="font-mono text-[12px] text-fg">{mod.detail}</p>
              <p className="max-w-[52ch] text-sm leading-relaxed text-muted">{mod.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
