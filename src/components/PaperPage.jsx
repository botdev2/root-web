import { useEffect, useMemo, useState } from "react";
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
import { Icon } from "./Icons.jsx";
import "../paper.css";

const LINKS = [
  { href: "/", label: "harness" },
  { href: "https://ops.palmaierc.com", label: "ops" },
  { href: "https://useroot.sh", label: "useroot.sh" },
];

const LOOP = [
  { icon: "edit", title: "goal" },
  { icon: "spark", title: "model" },
  { icon: "list", title: "tools" },
  { icon: "branch", title: "commit" },
  { icon: "check", title: "result" },
];

const RECORDS = [
  { icon: "folder", title: "Content", body: "Prompts, files, commits" },
  { icon: "id", title: "Identity", body: "How the model, git, and bill are obtained" },
  { icon: "globe", title: "Network", body: "Address, time, browser" },
];

export default function PaperPage() {
  const [active, setActive] = useState(PAPER[0].id);
  const [navOpen, setNavOpen] = useState(false);
  const activeChapter = PAPER.find((chapter) => chapter.id === active) || PAPER.find((chapter) => chapter.parts?.some((part) => part.id === active)) || PAPER[0];

  const headings = useMemo(() => {
    const list = [];
    PAPER.forEach((chapter) => {
      list.push(chapter.id);
      chapter.parts?.forEach((part) => list.push(part.id));
    });
    return list;
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-paper", "1");
    document.title = PAPER_TITLE;
    const nodes = headings.map((id) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: "-18% 0px -70% 0px", threshold: [0.12, 0.35] },
    );
    nodes.forEach((node) => io.observe(node));
    return () => {
      io.disconnect();
      document.documentElement.removeAttribute("data-paper");
    };
  }, [headings]);

  const chapterIndex = PAPER.findIndex((chapter) => chapter.id === activeChapter.id);
  const prev = chapterIndex > 0 ? PAPER[chapterIndex - 1] : null;
  const next = chapterIndex < PAPER.length - 1 ? PAPER[chapterIndex + 1] : null;
  const philosophy = PAPER.find((chapter) => chapter.id === "linkability");

  return (
    <div className="gb">
      {navOpen && <button type="button" className="gb-scrim" aria-label="Close contents" onClick={() => setNavOpen(false)} />}
      <aside className={`gb-side${navOpen ? " is-open" : ""}`}>
        <a href="/" className="gb-brand">
          <img src="/palm.png" alt="" />
          <span>
            <strong>/root</strong>
            <small>Paper</small>
          </span>
        </a>
        <div className="gb-book">
          <Icon name="book" size={14} />
          Remaining private
        </div>
        <nav className="gb-nav" aria-label="Contents">
          {PAPER.map((chapter) => (
            <div key={chapter.id} className="gb-nav-group">
              <a
                href={`#${chapter.id}`}
                className={active === chapter.id || chapter.parts?.some((part) => part.id === active) ? "is-active" : ""}
                onClick={() => setNavOpen(false)}
              >
                <Icon name={chapter.icon || "book"} size={14} />
                {chapter.title}
              </a>
              {chapter.parts && (
                <div className="gb-nav-sub">
                  {chapter.parts.map((part) => (
                    <a key={part.id} href={`#${part.id}`} className={active === part.id ? "is-active" : ""} onClick={() => setNavOpen(false)}>
                      {part.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="gb-side-foot">
          {PAPER_SERIES} · {APP_VERSION}
        </div>
      </aside>

      <div className="gb-main">
        <header className="gb-top">
          <button type="button" className="gb-menu" aria-label="Contents" onClick={() => setNavOpen(true)}>
            <Icon name="menu" size={16} />
          </button>
          <div className="gb-crumb">
            <a href="/">/root</a>
            <Icon name="chevron-right" size={12} />
            <span>Paper</span>
            <Icon name="chevron-right" size={12} />
            <span>{activeChapter.title}</span>
          </div>
          <nav className="gb-links">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
            <button type="button" onClick={() => window.print()}>
              Print
            </button>
          </nav>
        </header>

        <article className="gb-article">
          <p className="gb-kicker">
            {PAPER_SERIES} · {PAPER_AUTHOR} · {PAPER_DATE}
          </p>
          <h1>{PAPER_TITLE}</h1>
          <div className="gb-tags">
            {PAPER_KEYWORDS.split("; ").map((word) => (
              <span key={word}>{word}</span>
            ))}
          </div>

          <Callout kind="info" title="Abstract">
            {PAPER_ABSTRACT}
          </Callout>

          <div className="gb-cards">
            {RECORDS.map((item) => (
              <div key={item.title} className="gb-card">
                <span className="gb-ico">
                  <Icon name={item.icon} size={16} />
                </span>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            ))}
          </div>

          {PAPER.map((chapter) => (
            <section key={chapter.id} id={chapter.id} className="gb-section">
              <h2>
                <span className="gb-ico">
                  <Icon name={chapter.icon || "book"} size={16} />
                </span>
                {chapter.num}. {chapter.title}
              </h2>
              {chapter.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {chapter.id === "linkability" && philosophy?.parts && (
                <div className="gb-cards gb-cards-6">
                  {philosophy.parts.map((part) => (
                    <a key={part.id} href={`#${part.id}`} className="gb-card gb-card-link">
                      <span className="gb-ico">
                        <Icon name={part.icon || "shield"} size={16} />
                      </span>
                      <strong>
                        {part.num} {part.title}
                      </strong>
                    </a>
                  ))}
                </div>
              )}
              {chapter.parts?.map((part) => (
                <div key={part.id} id={part.id} className="gb-part">
                  <h3>
                    <span className="gb-ico">
                      <Icon name={part.icon || "book"} size={15} />
                    </span>
                    {part.num} {part.title}
                  </h3>
                  {part.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {part.note && <Callout kind={part.note.kind} title={part.note.title}>{part.note.body}</Callout>}
                </div>
              ))}
              {chapter.figure === "loop" && (
                <figure className="gb-fig">
                  <div className="gb-flow">
                    {LOOP.map((step, i) => (
                      <div key={step.title} className="gb-flow-item">
                        <FlowNode icon={step.icon} title={step.title} />
                        {i < LOOP.length - 1 && <span className="gb-arrow" />}
                      </div>
                    ))}
                  </div>
                  <figcaption>Figure 2. Control loop of a single turn.</figcaption>
                </figure>
              )}
              {chapter.figure === "stack" && (
                <figure className="gb-fig">
                  <div className="gb-stack">
                    <FlowNode icon="wallet" title="Wallet" sub="signed message" />
                    <span className="gb-arrow" />
                    <div className="gb-stack-col">
                      <FlowNode icon="monitor" title="/root Windows" sub="Ollama" />
                      <FlowNode icon="cloud" title="/root web" sub="Hamrin 1.0" />
                    </div>
                    <span className="gb-arrow" />
                    <FlowNode icon="branch" title="Hub" sub="git" />
                    <span className="gb-arrow" />
                    <div className="gb-stack-col">
                      <FlowNode icon="server" title="Site" sub="container" />
                      <FlowNode icon="globe" title="Name" sub="DNS" />
                    </div>
                  </div>
                  <figcaption>Figure 1. Path from wallet signature to hosted site and name.</figcaption>
                </figure>
              )}
              {chapter.table && (
                <figure className="gb-table">
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
              {chapter.note && <Callout kind={chapter.note.kind} title={chapter.note.title}>{chapter.note.body}</Callout>}
            </section>
          ))}

          <nav className="gb-pager">
            {prev ? (
              <a href={`#${prev.id}`}>
                <small>Previous</small>
                {prev.title}
              </a>
            ) : (
              <span />
            )}
            {next ? (
              <a href={`#${next.id}`} className="is-next">
                <small>Next</small>
                {next.title}
              </a>
            ) : (
              <span />
            )}
          </nav>

          <footer className="gb-foot">
            Product rules as of {PAPER_DATE}. chat.useroot.sh/{APP_VERSION}.
            <a href="/">Open the harness</a>
          </footer>
        </article>
      </div>
    </div>
  );
}

function Callout({ kind, title, children }) {
  const icon = kind === "warn" ? "warn" : kind === "hint" ? "check" : "info";
  return (
    <aside className={`gb-callout is-${kind}`}>
      <span className="gb-ico">
        <Icon name={icon} size={16} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </aside>
  );
}

function FlowNode({ icon, title, sub }) {
  return (
    <div className="gb-node">
      <span className="gb-ico">
        <Icon name={icon} size={15} />
      </span>
      <div>
        <div className="gb-node-title">{title}</div>
        {sub && <div className="gb-node-sub">{sub}</div>}
      </div>
    </div>
  );
}
