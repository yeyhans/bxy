import { comparisonRows, computeSavings, formatClp, savingsScenario as s } from "../config/site";
import { SectionHeading } from "./SectionHeading";

export function ComparisonSection() {
  const totals = computeSavings();

  const breakdown = [
    {
      label: `Plan + apps: (US$${s.planUsd} + US$${s.appsUsd}) x ${s.months} meses x $${s.usdToClp}`,
      value: totals.subscriptions,
    },
    {
      label: `Comisión ${s.commissionRate * 100}% sobre ${formatClp(s.monthlySalesClp)}/mes en ventas`,
      value: totals.commissions,
    },
  ];

  return (
    <section id="vs-shopify" aria-labelledby="vs-shopify-title" className="border-b border-line">
      <SectionHeading
        id="vs-shopify-title"
        index="01"
        title="El impuesto invisible: BxY Core vs Shopify"
        intro="Lo que pagas en Shopify no termina en el plan. Se suma cada mes, en dólares, y castiga cada venta."
      />

      <div role="table" aria-label="Comparación BxY Core contra Shopify" className="text-sm">
        <div role="row" className="hidden grid-cols-[1fr_1.1fr_1.1fr] border-b border-line md:grid">
          <span role="columnheader" className="tag px-8 py-3">
            Concepto
          </span>
          <span role="columnheader" className="tag border-l border-line px-6 py-3">
            Shopify
          </span>
          <span role="columnheader" className="tag border-l border-line bg-surface px-6 py-3 text-fg">
            BxY Commerce Core
          </span>
        </div>

        {comparisonRows.map((row) => (
          <div
            role="row"
            key={row.concept}
            className="grid grid-cols-1 border-b border-line md:grid-cols-[1fr_1.1fr_1.1fr]"
          >
            <span role="rowheader" className="px-4 pt-5 font-display text-base font-medium md:px-8 md:py-5">
              {row.concept}
            </span>
            <span role="cell" className="flex flex-col gap-1 px-4 py-3 text-muted md:border-l md:border-line md:px-6 md:py-5">
              <span className="tag md:hidden">Shopify</span>
              <span className="font-mono text-[13px] leading-relaxed">{row.shopify}</span>
            </span>
            <span
              role="cell"
              className="flex flex-col gap-1 bg-surface px-4 py-4 md:border-l md:border-line md:px-6 md:py-5"
            >
              <span className="tag md:hidden">BxY Core</span>
              <span className="font-mono text-[13px] font-medium leading-relaxed text-fg">
                <span className="mr-2 text-accent" aria-hidden="true">
                  &gt;
                </span>
                {row.bxy}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* 24-month cumulative cost: inputs are printed so the visitor can audit the math. */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr]">
        <div className="flex flex-col gap-5 px-4 py-10 md:px-8 lg:border-r lg:border-line">
          <h3 className="font-display text-xl font-semibold tracking-tight md:text-2xl">
            Costo acumulado a {s.months} meses
          </h3>
          <dl className="flex flex-col font-mono text-[13px]">
            {breakdown.map((line) => (
              <div key={line.label} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2">
                <dt className="text-muted">{line.label}</dt>
                <dd className="text-fg">{formatClp(line.value)}</dd>
              </div>
            ))}
            <div className="mt-2 flex items-baseline justify-between gap-6 border-t border-line pt-3">
              <dt className="text-fg">Shopify, total estimado</dt>
              <dd className="font-semibold text-fg">{formatClp(totals.shopifyTotal)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-6 py-2">
              <dt className="text-fg">BxY Core, pago único con IVA</dt>
              <dd className="font-semibold text-fg">{formatClp(totals.bxyTotal)}</dd>
            </div>
          </dl>
          <p className="max-w-[60ch] font-mono text-[11px] leading-relaxed text-muted">
            Escenario de referencia conservador: plan Basic de Shopify, apps mínimas y tipo de cambio de $
            {s.usdToClp} por dólar. Con más ventas o más apps, la diferencia crece.
          </p>
        </div>

        <div className="flex flex-col justify-end gap-3 border-t border-line bg-surface px-4 py-10 md:px-8 lg:border-t-0">
          <span className="tag">Ahorro estimado en {s.months} meses</span>
          <p className="font-mono text-5xl font-semibold leading-none tracking-tight text-accent md:text-6xl">
            {formatClp(totals.savings)}
          </p>
          <p className="max-w-[40ch] text-sm leading-relaxed text-muted">
            Más de $2.000.000 CLP que se quedan en tu operación en lugar de irse en suscripciones y comisiones.
          </p>
        </div>
      </div>
    </section>
  );
}
