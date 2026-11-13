import { useId, useState } from "react";
import { formatClp, industries, quoterItems, type QuoterItemId } from "../config/site";
import {
  buildQuoteMessage,
  mailtoHref,
  quoteTotals,
  validateQuote,
  whatsappHref,
  type QuoteErrors,
  type QuoteRequest,
} from "../lib/quote";

type Channel = "whatsapp" | "email";

export function InteractiveQuoter() {
  const uid = useId();
  const [brand, setBrand] = useState("");
  const [industry, setIndustry] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [modules, setModules] = useState<QuoterItemId[]>([]);
  const [errors, setErrors] = useState<QuoteErrors>({});
  const [sent, setSent] = useState<Channel | null>(null);

  const totals = quoteTotals();
  const request: QuoteRequest = { brand, industry, currentUrl, modules };
  const selected = quoterItems.filter((item) => modules.includes(item.id));

  const toggle = (id: QuoterItemId) => {
    setSent(null);
    setModules((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const submit = (channel: Channel) => {
    const found = validateQuote(request);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const firstInvalid = Object.keys(found)[0];
      document.getElementById(`${uid}-${firstInvalid}`)?.focus();
      return;
    }
    const message = buildQuoteMessage(request);
    if (channel === "whatsapp") window.open(whatsappHref(message), "_blank", "noopener,noreferrer");
    else window.location.href = mailtoHref(request, message);
    setSent(channel);
  };

  const fieldId = (name: keyof QuoteErrors) => `${uid}-${name}`;
  const errorProps = (name: keyof QuoteErrors) =>
    errors[name] ? { "aria-invalid": true as const, "aria-describedby": `${fieldId(name)}-error` } : {};

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit("whatsapp");
      }} className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
      {/* Stack builder */}
      <div className="flex flex-col lg:border-r lg:border-line">
        <fieldset className="border-b border-line px-4 py-8 md:px-8">
          <legend className="sr-only">Stack del proyecto</legend>
          <p className="tag mb-4">Item base</p>
          <div className="flex items-start justify-between gap-4 border border-accent bg-surface p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 font-mono text-[13px] text-accent" aria-hidden="true">
                [x]
              </span>
              <span className="text-sm leading-relaxed text-fg">
                BxY Commerce Core (Storefront de por vida + Admin + API + DB dedicada)
              </span>
            </div>
            <span className="shrink-0 font-mono text-[13px] font-semibold text-fg">
              {formatClp(totals.net)} + IVA
            </span>
          </div>

          <p className="tag mb-4 mt-8">Módulos adicionales</p>
          <ul className="flex flex-col gap-2">
            {quoterItems.map((item) => {
              const checked = modules.includes(item.id);
              return (
                <li key={item.id}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors ${
                      checked ? "border-fg bg-surface-2" : "border-line hover:border-line-strong"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={checked}
                      onChange={() => toggle(item.id)}
                    />
                    <span
                      className="mt-0.5 font-mono text-[13px] text-fg peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-accent"
                      aria-hidden="true"
                    >
                      {checked ? "[x]" : "[ ]"}
                    </span>
                    <span className="text-sm leading-relaxed text-fg">{item.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-6 px-4 py-8 md:grid-cols-2 md:px-8">
          <legend className="sr-only">Datos de contacto</legend>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label htmlFor={fieldId("brand")} className="tag text-fg">
              Nombre / Marca
            </label>
            <input
              id={fieldId("brand")}
              className="field"
              autoComplete="organization"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Ej: Huerto Austral"
              {...errorProps("brand")}
            />
            {errors.brand && (
              <p id={`${fieldId("brand")}-error`} className="font-mono text-[12px] text-danger">
                {errors.brand}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={fieldId("industry")} className="tag text-fg">
              Rubro
            </label>
            <select
              id={fieldId("industry")}
              className="field appearance-none"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              {...errorProps("industry")}
            >
              <option value="">Selecciona un rubro</option>
              {industries.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {errors.industry && (
              <p id={`${fieldId("industry")}-error`} className="font-mono text-[12px] text-danger">
                {errors.industry}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={fieldId("currentUrl")} className="tag text-fg">
              URL actual (opcional)
            </label>
            <input
              id={fieldId("currentUrl")}
              className="field"
              inputMode="url"
              autoComplete="url"
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
              placeholder="mitienda.cl"
              {...errorProps("currentUrl")}
            />
            {errors.currentUrl ? (
              <p id={`${fieldId("currentUrl")}-error`} className="font-mono text-[12px] text-danger">
                {errors.currentUrl}
              </p>
            ) : (
              <p className="font-mono text-[11px] text-muted">Si vienes de Shopify o WooCommerce, pégala aquí.</p>
            )}
          </div>
        </fieldset>
      </div>

      {/* Live summary */}
      <aside
        aria-label="Resumen de cotización"
        className="flex flex-col gap-6 border-t border-line bg-surface px-4 py-8 md:px-8 lg:border-t-0"
      >
        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          <p className="tag">Resumen</p>

          <dl className="flex flex-col gap-2 font-mono text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-fg">Commerce Core</dt>
              <dd className="text-fg">{formatClp(totals.net)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-muted">
              <dt>IVA 19%</dt>
              <dd>{formatClp(totals.iva)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-line pt-3">
              <dt className="font-semibold text-fg">Total base, pago único</dt>
              <dd className="font-semibold text-accent">{formatClp(totals.gross)}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2" aria-live="polite">
            <p className="tag">Módulos ({selected.length})</p>
            {selected.length ? (
              <ul className="flex flex-col gap-1.5">
                {selected.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 font-mono text-[12px]">
                    <span className="text-fg">{item.label}</span>
                    <span className="shrink-0 text-muted">A cotizar</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-mono text-[12px] leading-relaxed text-muted">
                Sin módulos por ahora. Puedes conectarlos cuando tu operación lo pida.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button type="submit" className="btn btn-primary w-full">
              [ SOLICITAR DESPLIEGUE VÍA WHATSAPP ]
            </button>
            <button type="button" onClick={() => submit("email")} className="btn btn-ghost w-full">
              [ ENVIAR POR CORREO ]
            </button>
            <p className="font-mono text-[11px] leading-relaxed text-muted" aria-live="polite">
              {sent === "whatsapp"
                ? "Abrimos WhatsApp con tu solicitud. Si no se abrió, revisa el bloqueo de ventanas emergentes."
                : sent === "email"
                  ? "Abrimos tu cliente de correo con la solicitud lista."
                  : "Se abre un mensaje con tu stack detallado. Tú decides cuándo enviarlo."}
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}
