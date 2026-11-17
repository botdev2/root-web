import { useEffect, useState } from "react";
import {
  PAPER,
  PAPER_ABSTRACT,
  PAPER_AUTHOR,
  PAPER_DATE,
  PAPER_KEYWORDS,
  PAPER_SERIES,
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
    document.title = PAPER_TITLE;
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
    <div className="paper-doc">
      <header className="paper-top">
        <a href="/" className="paper-brand">
          <img src="/palm.png" alt="" />
          /root
        </a>
        <nav>
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
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
            <a key={chapter.id} href={`#${chapter.id}`} className={active === chapter.id ? "is-active" : ""}>
              {chapter.num}. {chapter.title}
            </a>
          ))}
        </nav>

        <article className="paper-article">
          <p className="paper-meta">
            {PAPER_SERIES} · {PAPER_AUTHOR} · {PAPER_DATE}
          </p>
          <h1>{PAPER_TITLE}</h1>

          <section className="paper-abstract">
            <p>
              <strong>Abstract.</strong> {PAPER_ABSTRACT}
            </p>
            <p className="paper-keywords">
              <strong>Keywords:</strong> {PAPER_KEYWORDS}
            </p>
          </section>

          <nav className="paper-toc-mobile" aria-label="Sections">
            {PAPER.map((chapter) => (
              <a key={chapter.id} href={`#${chapter.id}`}>
                {chapter.num}. {chapter.title}
              </a>
            ))}
          </nav>

          {PAPER.map((chapter) => (
            <section key={chapter.id} id={chapter.id} className="paper-section">
              <h2>
                {chapter.num}. {chapter.title}
              </h2>
              {chapter.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {chapter.figure === "stack" && <StackFigure />}
              {chapter.figure === "loop" && <LoopFigure />}
              {chapter.table && (
                <figure className="paper-table">
                  <figcaption>{chapter.table.caption}</figcaption>
                  <table>
                    <thead>
                      <tr>
                        {chapter.table.cols.map((col) => (
                          <th key={col || "stub"}>{col}</th>
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
            </section>
          ))}

          <footer className="paper-foot">
            Product rules as of {PAPER_DATE}. chat.useroot.sh/{APP_VERSION}.
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
      <div className="paper-flow" aria-label="Wallet to harness to Hub to Ops">
        <FlowBox title="Wallet" sub="signed message" />
        <FlowArrow />
        <div className="paper-flow-col">
          <FlowBox title="/root Windows" sub="Ollama" />
          <FlowBox title="/root web" sub="Hamrin 1.0" />
        </div>
        <FlowArrow />
        <FlowBox title="Hub" sub="git" />
        <FlowArrow />
        <div className="paper-flow-col">
          <FlowBox title="Site" sub="container" />
          <FlowBox title="Name" sub="DNS" />
        </div>
      </div>
      <figcaption>Figure 1. Path from wallet signature to hosted site and name.</figcaption>
    </figure>
  );
}

function LoopFigure() {
  const steps = ["goal", "model", "tools", "commit", "result"];
  return (
    <figure className="paper-fig">
      <div className="paper-flow" aria-label="Turn: goal, model, tools, commit, result">
        {steps.map((step, i) => (
          <div key={step} className="paper-flow-item">
            <FlowBox title={step} />
            {i < steps.length - 1 && <FlowArrow />}
          </div>
        ))}
      </div>
      <figcaption>Figure 2. Control loop of a single turn.</figcaption>
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
