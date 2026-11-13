const partners = [
  {
    letter: "B",
    name: "Bolder",
    person: "Iván",
    focus: "Diseño, marca, packaging y estética",
    skills: ["Dirección de arte", "Identidad visual", "UI/UX", "Packaging y etiquetas", "Motion design"],
  },
  {
    letter: "Y",
    name: "Yey",
    person: "Yey",
    focus: "Ingeniería edge, APIs, data science e IA",
    skills: ["Arquitectura Cloudflare", "Motor e-commerce", "Integraciones API", "Data science y BI", "IA aplicada"],
  },
] as const;

export function DualStudioSection() {
  return (
    <section id="bxy" aria-labelledby="formula-title" className="border-b border-line">
      <header className="flex flex-col gap-3 border-b border-line px-4 py-8 md:px-8">
        <h2 id="formula-title" className="flex flex-col gap-3 font-display text-2xl font-semibold tracking-tight md:text-3xl">
          <span className="font-mono text-[13px] font-medium tracking-normal text-accent">[04]</span>
          <span>Diseño + ingeniería en un solo equipo</span>
        </h2>
        <p className="font-mono text-[13px] text-fg">B x Y: Bolder diseña, Yey construye.</p>
        <p className="max-w-[60ch] text-base leading-relaxed text-muted">
          Un estudio que cubre marca, UI, packaging y motion, y también arquitectura, APIs, datos e IA. Sin
          intermediarios entre quien diseña y quien programa.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {partners.map((p, i) => (
          <article
            key={p.name}
            className={`grid grid-cols-[auto_1fr] gap-6 px-4 py-10 md:px-8 ${i === 0 ? "border-b border-line md:border-b-0 md:border-r" : ""}`}
          >
            <span className="font-display text-7xl font-bold leading-none tracking-tighter text-fg md:text-8xl" aria-hidden="true">
              {p.letter}
            </span>
            <div className="flex flex-col gap-4">
              <h3 className="font-display text-xl font-semibold tracking-tight">
                {p.name}
                {p.person !== p.name && <span className="text-muted"> ({p.person})</span>}
              </h3>
              <p className="text-sm text-muted">{p.focus}</p>
              <ul className="flex flex-wrap gap-2">
                {p.skills.map((skill) => (
                  <li key={skill} className="border border-line px-2 py-1 font-mono text-[11px] text-fg">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
