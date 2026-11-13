interface SectionHeadingProps {
  index?: string;
  title: string;
  intro?: string;
  id?: string;
}

/** Section title: mono index + display headline, stacked intro below (never a split header). */
export function SectionHeading({ index, title, intro, id }: SectionHeadingProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-line px-4 py-10 md:px-8 md:py-14">
      <h2
        id={id}
        className="flex max-w-[28ch] flex-col gap-3 font-display text-3xl font-semibold leading-[1.05] tracking-tight md:text-5xl"
      >
        {index && <span className="font-mono text-[13px] font-medium tracking-normal text-accent">[{index}]</span>}
        <span>{title}</span>
      </h2>
      {intro && <p className="max-w-[60ch] text-base leading-relaxed text-muted">{intro}</p>}
    </header>
  );
}
