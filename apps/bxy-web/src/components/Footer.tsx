import { contact } from "../config/site";

const links = [
  { href: "https://bolderprocess.com/", label: "Bolder Process" },
  { href: "https://yhans.cl", label: "Yhans.cl" },
] as const;

export function Footer() {
  return (
    <footer className="grid grid-cols-1 gap-6 px-4 py-10 md:grid-cols-[1fr_auto] md:items-end md:px-8">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[13px] font-semibold text-fg">BxY // BOLDER x YEY</span>
        <a href={`mailto:${contact.email}`} className="font-mono text-[12px] text-muted hover:text-fg">
          {contact.email}
        </a>
      </div>
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[12px] text-muted transition-colors hover:text-fg"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
