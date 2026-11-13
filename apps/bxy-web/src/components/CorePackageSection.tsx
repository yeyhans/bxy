import { CORE_PRICE_NET, corePackage, formatClp } from "../config/site";

export function CorePackageSection() {
  return (
    <section id="commerce-core" aria-labelledby="core-title" className="border-b border-line">
      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.6fr]">
        {/* Price column stays pinned while the four deliverables scroll past on desktop. */}
        <div className="border-b border-line px-4 py-10 md:px-8 md:py-14 lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-6 lg:sticky lg:top-24">
            <h2 id="core-title" className="flex flex-col gap-3 font-display text-3xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              <span className="font-mono text-[13px] font-medium tracking-normal text-accent">[02]</span>
              <span>
                Qué incluye el chasis de <span className="whitespace-nowrap">{formatClp(CORE_PRICE_NET)} + IVA</span>
              </span>
            </h2>
            <p className="max-w-[44ch] text-base leading-relaxed text-muted">
              Todo lo necesario para vender desde el primer día, entregado llave en mano y a tu nombre.
            </p>
            <div className="flex flex-col gap-1 border border-line bg-surface p-5">
              <span className="tag">Pago único</span>
              <span className="font-mono text-3xl font-semibold tracking-tight text-fg">
                {formatClp(CORE_PRICE_NET)}
                <span className="ml-2 text-base font-medium text-muted">CLP + IVA</span>
              </span>
              <span className="font-mono text-[12px] text-muted">0% comisión por venta. Sin mensualidad en dólares.</span>
            </div>
          </div>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-2">
          {corePackage.map((item, i) => (
            <li
              key={item.title}
              className={`flex min-h-[15rem] flex-col justify-between gap-8 border-line px-4 py-8 md:px-8 md:py-10 ${
                i % 2 === 0 ? "md:border-r" : ""
              } ${i < 2 ? "border-b" : i === 2 ? "border-b md:border-b-0" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-[13px] text-muted">[0{i + 1}]</span>
                <span className="tag border border-line px-2 py-0.5 text-fg">{item.term}</span>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="font-display text-xl font-semibold tracking-tight md:text-2xl">{item.title}</h3>
                <p className="max-w-[42ch] text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
