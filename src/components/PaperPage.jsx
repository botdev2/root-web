import { useEffect } from "react";
import { PAPER, PAPER_DATE, PAPER_TITLE } from "../paper.js";
import { APP_VERSION } from "../version.js";
import { applyTheme, findTheme, readSavedThemeId, readSavedWallpaper } from "../themes.js";

const LINKS = [
  { href: "/", label: "harness" },
  { href: "https://ops.palmaierc.com", label: "ops" },
  { href: "https://useroot.sh", label: "useroot.sh" },
];

export default function PaperPage() {
  useEffect(() => {
    applyTheme(findTheme(readSavedThemeId()), readSavedWallpaper());
    document.title = PAPER_TITLE;
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <header className="mx-auto flex max-w-[720px] items-center justify-between gap-4 px-5 py-5 md:px-0 md:pt-10">
        <a href="/" className="flex items-center gap-2 text-[13px] text-[var(--ink)]">
          <img src="/palm.png" alt="" className="h-6 w-6 object-contain" />
          /root
        </a>
        <nav className="flex gap-4 text-[12px] text-[var(--faint)]">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-[var(--ink)]">
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      <article className="mx-auto max-w-[720px] px-5 pb-24 pt-4 md:px-0">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--faint)]">Paper · {PAPER_DATE}</p>
        <h1 className="mt-2 text-[32px] leading-tight tracking-[-0.03em]">{PAPER_TITLE}</h1>

        {PAPER.map((section, index) => (
          <section key={section.id} id={section.id} className="mt-12">
            <h2 className="text-[13px] uppercase tracking-[0.16em] text-[var(--faint)]">
              {String(index + 1).padStart(2, "0")} · {section.title}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {section.points.map((point) => (
                <li key={point} className="flex gap-3 text-[16px] leading-[1.55] text-[var(--ink)]">
                  <span className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-[var(--faint)]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <footer className="mt-16 border-t border-[var(--stroke-soft)] pt-6 text-[12px] text-[var(--faint)]">
          $PALM · chat.useroot.sh/{APP_VERSION} ·{" "}
          <a href="/" className="underline hover:text-[var(--ink)]">
            Open the harness
          </a>
        </footer>
      </article>
    </div>
  );
}
