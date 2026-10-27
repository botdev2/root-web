import { useMemo, useState } from "react";

const HITS = [
  { id: "home", label: "New Agent", hint: "Start a draft chat" },
  { id: "templates", label: "Create from Template", hint: "Scaffold a project" },
  { id: "automations", label: "Automations", hint: "Schedules, editor, history" },
  { id: "reasoning", label: "Reasoning", hint: "Agent brain graph" },
  { id: "ops", label: "Ops", hint: "PALM Ops console" },
  { id: "plugins", label: "Plugins", hint: "Hosting, domains, and Ops Hub" },
  { id: "notes", label: "Notes", hint: "Daily goals" },
  { id: "settings", label: "Settings · Appearance", hint: "Themes, PALM, wallpaper" },
  { id: "account", label: "Account", hint: "Wallet and profile" },
  { id: "telemetry", label: "Telemetry", hint: "Session privacy" },
  { id: "updates", label: "Updates", hint: "Channel and version" },
  { id: "help", label: "Help", hint: "How /root works" },
];

export default function CommandPalette({ onClose, onPick }) {
  const [query, setQuery] = useState("");
  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HITS;
    return HITS.filter((hit) => (hit.label + hit.hint).toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="absolute inset-0 z-30 flex items-start justify-center bg-[color-mix(in_srgb,#000_28%,transparent)] pt-[10vh] md:pt-[14vh]" onClick={onClose}>
      <div
        className="frost-panel w-[min(560px,94vw)] overflow-hidden rounded-2xl border border-[var(--stroke)] fade-up"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && hits[0]) onPick(hits[0].id);
          }}
          placeholder="Search /root"
          className="h-12 w-full border-b border-[var(--stroke-soft)] bg-transparent px-4 text-[14px] outline-none placeholder:text-[var(--faint)]"
        />
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {hits.map((hit, index) => (
            <button
              key={hit.id}
              type="button"
              onClick={() => onPick(hit.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-[var(--hover)] ${
                index === 0 ? "bg-[var(--hover)]" : ""
              }`}
            >
              <span className="text-[13px]">{hit.label}</span>
              <span className="ml-3 text-[11px] text-[var(--faint)]">{hit.hint}</span>
            </button>
          ))}
          {hits.length === 0 && <div className="px-3 py-4 text-[12px] text-[var(--faint)]">No matches</div>}
        </div>
      </div>
    </div>
  );
}
