import { tripseeds } from "../config/site";

export function CaseStudySection() {
  return (
    <section id="casos" aria-labelledby="casos-title" className="border-b border-line">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-8 px-4 py-12 md:px-8 md:py-16 lg:border-r lg:border-line">
          <h2 id="casos-title" className="flex flex-col gap-3 font-display text-3xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
            <span className="font-mono text-[13px] font-medium tracking-normal text-accent">[04]</span>
            <span>Blueprint 01 // TripSeeds en producción</span>
          </h2>

          <div className="flex max-w-[56ch] flex-col gap-4 text-base leading-relaxed text-muted">
            <p>
              TripSeeds opera en el ecosistema cannábico chileno, un rubro donde las plataformas extranjeras pueden
              congelar una cuenta por políticas ajenas al negocio.
            </p>
            <p>
              Lo resolvimos con su propia instancia: storefront a medida, API y Admin unificados, base de datos D1 y
              media en R2, todo servido desde el edge de Cloudflare. Sin comisiones por venta y sin un tercero que
              pueda apagar la tienda.
            </p>
          </div>

          {tripseeds.url && (
            <a href={tripseeds.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost self-start">
              [ VISITAR TRIPSEEDS ]
            </a>
          )}
        </div>

        <dl className="grid grid-cols-1 bg-surface">
          {tripseeds.metrics.map((metric, i) => (
            <div
              key={metric.label}
              className={`flex flex-col justify-between gap-6 px-4 py-8 md:px-8 md:py-10 ${
                i > 0 ? "border-t border-line" : "border-t border-line lg:border-t-0"
              }`}
            >
              <dt className="tag">{metric.label}</dt>
              <dd className="font-mono text-3xl font-semibold tracking-tight text-fg md:text-4xl">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
