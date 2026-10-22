import { useMemo, useState } from "react";
import { HELP } from "../../mock.js";
import { Page, Card } from "../ui.jsx";

export default function HelpView({ onOpen }) {
  const [id, setId] = useState("welcome");
  const [query, setQuery] = useState("");
  const page = HELP.find((item) => item.id === id) || HELP[0];
  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HELP;
    return HELP.filter((item) => (item.title + item.summary + item.body + item.section).toLowerCase().includes(q));
  }, [query]);
  const sections = [...new Set(hits.map((item) => item.section))];

  return (
    <Page wide>
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Card className="h-fit p-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search help"
            className="mb-2 h-10 w-full rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 text-[13px] outline-none"
          />
          {sections.map((section) => (
            <div key={section} className="mb-2">
              <div className="px-2 py-1 text-[11px] text-[var(--faint)]">{section}</div>
              {hits
                .filter((item) => item.section === section)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setId(item.id)}
                    className={`flex h-10 w-full items-center rounded-lg px-2 text-left text-[13px] ${
                      id === item.id ? "bg-[var(--sidebar-sel)]" : "hover:bg-[var(--hover)]"
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
            </div>
          ))}
          {hits.length === 0 && <div className="px-2 py-3 text-[12px] text-[var(--faint)]">No matches</div>}
        </Card>
        <Card className="p-5">
          <div className="text-[11px] text-[var(--faint)]">{page.section}</div>
          <h2 className="mt-1 text-[22px]">{page.title}</h2>
          <p className="mt-2 text-[13px] text-[var(--muted)]">{page.summary}</p>
          <p className="mt-4 text-[14px] leading-6">{page.body}</p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-[13px] text-[var(--muted)]">
            {page.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          {page.id === "control" && (
            <button type="button" onClick={() => onOpen?.("settings")} className="mt-5 text-[13px] text-[var(--accent)]">
              Open Settings →
            </button>
          )}
          {page.id === "account" && (
            <button type="button" onClick={() => onOpen?.("account")} className="mt-5 text-[13px] text-[var(--accent)]">
              Open Account →
            </button>
          )}
          {page.id === "automations" && (
            <button type="button" onClick={() => onOpen?.("automations")} className="mt-5 text-[13px] text-[var(--accent)]">
              Open Automations →
            </button>
          )}
          {page.id === "plugins" && (
            <button type="button" onClick={() => onOpen?.("plugins")} className="mt-5 text-[13px] text-[var(--accent)]">
              Open Plugins →
            </button>
          )}
        </Card>
      </div>
    </Page>
  );
}
