import { pillars } from "../config/site";
import { SectionHeading } from "./SectionHeading";

/** Value proposition condensed into three pillars: price & sovereignty, turnkey, custom tools. */
export function PillarsSection() {
  return (
    <section id="propuesta" aria-labelledby="propuesta-title" className="border-b border-line">
      <SectionHeading
        id="propuesta-title"
        title="Una tienda que es tuya, lista para vender y que crece contigo."
      />

      <ol className="grid grid-cols-1 md:grid-cols-3">
        {pillars.map((pillar, i) => (
          <li
            key={pillar.id}
            id={pillar.id}
            className={`flex flex-col gap-6 border-line px-4 py-10 md:px-8 md:py-12 ${
              i < pillars.length - 1 ? "border-b md:border-b-0 md:border-r" : ""
            }`}
          >
            <span className="font-mono text-[13px] font-medium text-accent">[0{i + 1}]</span>
            <div className="flex flex-col gap-3">
              <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
                {pillar.title}
              </h3>
              <p className="font-mono text-[13px] text-fg">{pillar.tagline}</p>
            </div>
            <p className="max-w-[46ch] text-sm leading-relaxed text-muted md:text-base">{pillar.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
