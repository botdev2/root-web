import { useEffect, useState } from "react";
import {
  PAPER,
  PAPER_ABSTRACT,
  PAPER_CLAIM,
  PAPER_DATE,
  PAPER_KICKER,
  PAPER_NO,
  PAPER_READ,
  PAPER_TITLE,
} from "../paper.js";
import { APP_VERSION } from "../version.js";
import "../paper.css";

const LINKS = [
  { href: "/", label: "harness" },
  { href: "https://ops.palmaierc.com", label: "ops" },
  { href: "https://useroot.sh", label: "useroot.sh" },
];

export default function PaperPage() {
  const [active, setActive] = useState(PAPER[0].id);

  useEffect(() => {
    document.documentElement.setAttribute("data-paper", "1");
    document.title = `${PAPER_TITLE} — ${PAPER_KICKER}`;
    const nodes = PAPER.map((chapter) => document.getElementById(chapter.id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.15, 0.4, 0.7] },
    );
    nodes.forEach((node) => io.observe(node));
    return () => {
      io.disconnect();
      document.documentElement.removeAttribute("data-paper");
    };
  }, []);

  return (
    <div className="paper-doc min-h-screen">
      <header className="paper-top">
        <a href="/" className="flex items-center gap-2 text-[13px] text-[var(--paper-ink)] no-underline">
          <img src="/palm.png" alt="" className="h-5 w-5 object-contain" />
          /root
        </a>
        <div className="hidden text-[11px] tracking-[0.2em] text-[var(--paper-faint)] sm:block">
          {PAPER_NO}
        </div>
        <nav className="flex items-center gap-4 text-[12px] text-[var(--paper-faint)]">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="no-underline hover:text-[var(--paper-ink)]">
              {link.label}
            </a>
          ))}
          <button type="button" className="paper-print" onClick={() => window.print()}>
            Print
          </button>
        </nav>
      </header>

      <div className="paper-shell">
        <nav className="paper-toc" aria-label="Contents">
          <div className="paper-toc-label">Contents</div>
          {PAPER.map((chapter) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              className={active === chapter.id ? "is-active" : ""}
            >
              <span>{chapter.n}</span>
              {chapter.title}
            </a>
          ))}
        </nav>

        <article className="paper-article">
          <p className="paper-kicker">
            {PAPER_KICKER} · {PAPER_DATE} · {PAPER_READ}
          </p>
          <h1 className="paper-title">{PAPER_TITLE}</h1>
          <p className="paper-claim">{PAPER_CLAIM}</p>

          <div className="paper-abstract">
            <div className="paper-abstract-label">Abstract</div>
            <p>{PAPER_ABSTRACT}</p>
          </div>

          <nav className="paper-toc-mobile" aria-label="Chapters">
            {PAPER.map((chapter) => (
              <a key={chapter.id} href={`#${chapter.id}`}>
                {chapter.n} {chapter.title}
              </a>
            ))}
          </nav>

          {PAPER.map((chapter) => (
            <section key={chapter.id} id={chapter.id} className="paper-section">
              <h2>
                <span>{chapter.n}</span>
                {chapter.title}
              </h2>
              {chapter.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {chapter.quote && <blockquote>{chapter.quote}</blockquote>}
              {chapter.figure === "stack" && <StackFigure />}
              {chapter.figure === "loop" && <LoopFigure />}
              {chapter.figure === "credit" && <CreditFigure />}
              {chapter.figure === "ship" && <ShipFigure />}
              {chapter.modes && (
                <div className="paper-modes">
                  {chapter.modes.map((mode) => (
                    <div key={mode.name} className="paper-mode">
                      <div className="paper-mode-name" style={{ color: mode.color }}>
                        {mode.name}
                      </div>
                      <div>{mode.line}</div>
                    </div>
                  ))}
                </div>
              )}
              {chapter.table && (
                <figure className="paper-table">
                  <figcaption>{chapter.table.caption}</figcaption>
                  <table>
                    <thead>
                      <tr>
                        {chapter.table.cols.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chapter.table.rows.map((row) => (
                        <tr key={row.join("-")}>
                          {row.map((cell, i) => (
                            <td key={`${row[0]}-${i}`}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </figure>
              )}
              {chapter.nots && (
                <ul className="paper-nots">
                  {chapter.nots.map((item) => (
                    <li key={item}>
                      <span>not</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <footer className="paper-foot">
            <div>
              PALM paper 01 · rules as of {PAPER_DATE} · chat.useroot.sh/{APP_VERSION}
            </div>
            <a href="/">Open the harness</a>
          </footer>
        </article>
      </div>
    </div>
  );
}

function StackFigure() {
  return (
    <figure className="paper-fig">
      <div className="paper-eq-label">Figure 1 · One key, four layers</div>
      <div className="paper-flow" aria-label="Wallet to harness to Hub to Ops">
        <FlowBox title="Wallet" sub="sign once" />
        <FlowArrow />
        <div className="paper-flow-col">
          <FlowBox title="/root Windows" sub="localhost:11434" />
          <FlowBox title="/root web" sub="Hamrin 1.0" />
        </div>
        <FlowArrow />
        <FlowBox title="Hub" sub="git" />
        <FlowArrow />
        <div className="paper-flow-col">
          <FlowBox title="Site" sub="box" />
          <FlowBox title="Name" sub="DNS" />
        </div>
      </div>
    </figure>
  );
}

function LoopFigure() {
  const steps = ["goal", "model", "tools", "commit", "result"];
  return (
    <figure className="paper-fig">
      <div className="paper-eq-label">Figure 2 · A turn</div>
      <div className="paper-flow" aria-label="A turn: goal, model, tools, commit, result">
        {steps.map((step, i) => (
          <div key={step} className="paper-flow-item">
            <FlowBox title={step} />
            {i < steps.length - 1 && <FlowArrow />}
          </div>
        ))}
      </div>
    </figure>
  );
}

function CreditFigure() {
  return (
    <figure className="paper-fig paper-fig-eq">
      <div className="paper-eq-label">Figure 3 · Hamrin window</div>
      <div className="paper-eq">
        <span>credits</span>
        <span className="paper-eq-op">=</span>
        <span>
          ⌊ (held + staked) / 1,000 ⌋
          <small>per 14 days</small>
        </span>
        <span className="paper-eq-op">+</span>
        <span>
          0.5
          <small>welcome, once</small>
        </span>
        <span className="paper-eq-op">+</span>
        <span>
          extras
          <small>achievements</small>
        </span>
      </div>
    </figure>
  );
}

function ShipFigure() {
  const steps = [
    { n: "1", t: "Scaffold", d: "Vite + React, port 3000" },
    { n: "2", t: "Hub repo", d: "git on this wallet" },
    { n: "3", t: "Live URL", d: "Ops builds from Hub" },
  ];
  return (
    <figure className="paper-fig">
      <div className="paper-eq-label">Figure 4 · Ship</div>
      <div className="paper-ship">
        {steps.map((step, i) => (
          <div key={step.n} className="paper-ship-step">
            <div className="paper-ship-n">{step.n}</div>
            <div>
              <div className="paper-ship-t">{step.t}</div>
              <div className="paper-ship-d">{step.d}</div>
            </div>
            {i < steps.length - 1 && <div className="paper-ship-arrow" aria-hidden="true" />}
          </div>
        ))}
      </div>
    </figure>
  );
}

function FlowBox({ title, sub }) {
  return (
    <div className="paper-flow-box">
      <div className="paper-flow-title">{title}</div>
      {sub && <div className="paper-flow-sub">{sub}</div>}
    </div>
  );
}

function FlowArrow() {
  return <div className="paper-flow-arrow" aria-hidden="true" />;
}
