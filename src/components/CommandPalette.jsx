import { useEffect, useMemo, useState } from "react";
import { THEMES, WALLPAPERS } from "../themes.js";
import Pager, { usePaged } from "./Pager.jsx";

const PAGE_SIZE = 8;

const HITS = [
  { id: "home", label: "New Agent", hint: "Start a draft chat" },
  { id: "templates", label: "Create from Template", hint: "Scaffold a project" },
  { id: "quests", label: "Achievements", hint: "Daily challenges, achievements, and credits you can earn" },
  { id: "reasoning", label: "Reasoning", hint: "Agent brain graph" },
  { id: "ops", label: "Ops", hint: "PALM Ops console" },
  { id: "marketplace", label: "Marketplace", hint: "wPALM, credits, and PALM services" },
  { id: "notes", label: "Notes", hint: "Daily goals" },
  { id: "billing", label: "Billing", hint: "Credits and when they reset" },
  { id: "settings", label: "Settings · Appearance", hint: "Themes, PALM, wallpaper" },
  { id: "browse:theme", label: "Browse themes", hint: `${THEMES.length} looks, light and dark` },
  { id: "browse:wallpaper", label: "Browse wallpapers", hint: `${WALLPAPERS.length - 1} photos, many in 4K` },
  { id: "account", label: "Account", hint: "Wallet and profile" },
  { id: "telemetry", label: "Telemetry", hint: "Session privacy" },
  { id: "updates", label: "Updates", hint: "Channel and version" },
  { id: "hamrin", label: "Meet Hamrin 1.0", hint: "The model behind /root" },
  { id: "layout", label: "Arrange the interface", hint: "Drag items, hide them, dock panels" },
  { id: "tour", label: "Take the tour", hint: "A guided first repository and prompt (resets your layout)" },
  { id: "episode:ops-1", label: "Episode 1 - Introduction to Ops", hint: "Guided tutorial: ops.palmaierc.com and how it connects to the harness" },
  { id: "episode:defi-2", label: "Episode 2 - Building Products in DeFi", hint: "Whiteboard class, about 5 minutes" },
  { id: "episode:workflows-3", label: "Episode 3 - Workflows and Maintenance", hint: "Whiteboard class, about 5 minutes" },
  { id: "episode:privacy-4", label: "Episode 4 - Privacy & Compliance Aspect", hint: "Whiteboard class, about 5 minutes" },
  { id: "episode:revenue-5", label: "Episode 5 - Managing Revenue Streams", hint: "Whiteboard class, about 5 minutes" },
  { id: "help", label: "Help", hint: "How /root works" },
];

const LOOKS = [
  ...THEMES.map((item) => ({
    id: "theme:" + item.id,
    label: "Theme · " + item.name,
    hint: item.description,
    swatch: item.swatches?.slice(0, 3),
    extra: item.isDark ? "dark" : "light",
  })),
  ...WALLPAPERS.filter((item) => item.id !== "none").map((item) => ({
    id: "wallpaper:" + item.id,
    label: "Wallpaper · " + item.name,
    hint: item.detail || "Wallpaper",
    thumb: item.thumb || item.src,
    extra: item.uhd ? "4k photo" : "",
  })),
  { id: "wallpaper:none", label: "Wallpaper · None", hint: "Turn the wallpaper off", extra: "" },
];

export default function CommandPalette({ onClose, onPick }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HITS;
    const words = q.split(/\s+/);
    return [...HITS, ...LOOKS].filter((hit) => {
      const hay = (hit.label + " " + hit.hint + " " + (hit.extra || "")).toLowerCase();
      return words.every((word) => hay.includes(word));
    });
  }, [query]);

  const paged = usePaged(hits, PAGE_SIZE, { resetKey: query });

  useEffect(() => {
    setActive(0);
  }, [query, paged.page]);

  const choose = (hit) => {
    if (!hit) return;
    if (hit.id.startsWith("browse:")) {
      setQuery(hit.id === "browse:theme" ? "Theme ·" : "Wallpaper ·");
      return;
    }
    onPick(hit.id);
  };

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
            if (event.key === "Enter") choose(paged.slice[active]);
            else if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((value) => Math.min(paged.slice.length - 1, value + 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((value) => Math.max(0, value - 1));
            } else if (event.key === "PageDown" || (event.key === "ArrowRight" && event.altKey)) {
              event.preventDefault();
              paged.setPage(Math.min(paged.pages - 1, paged.page + 1));
            } else if (event.key === "PageUp" || (event.key === "ArrowLeft" && event.altKey)) {
              event.preventDefault();
              paged.setPage(Math.max(0, paged.page - 1));
            }
          }}
          placeholder="Search /root, themes, wallpapers"
          className="h-12 w-full border-b border-[var(--stroke-soft)] bg-transparent px-4 text-[14px] outline-none placeholder:text-[var(--faint)]"
        />
        <div className="p-2">
          {paged.slice.map((hit, index) => (
            <button
              key={hit.id}
              type="button"
              onClick={() => choose(hit)}
              onMouseEnter={() => setActive(index)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[var(--hover)] ${
                index === active ? "bg-[var(--hover)]" : ""
              }`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                {hit.thumb ? (
                  <span
                    className="h-6 w-9 shrink-0 rounded-md border border-[var(--stroke-soft)] bg-cover bg-center"
                    style={{ backgroundImage: `url('${hit.thumb}')` }}
                  />
                ) : hit.swatch ? (
                  <span className="flex h-6 w-9 shrink-0 overflow-hidden rounded-md border border-[var(--stroke-soft)]">
                    {hit.swatch.map((color) => (
                      <span key={color} className="flex-1" style={{ background: color }} />
                    ))}
                  </span>
                ) : null}
                <span className="truncate text-[13px]">{hit.label}</span>
              </span>
              <span className="ml-3 shrink-0 truncate text-[11px] text-[var(--faint)]">{hit.hint}</span>
            </button>
          ))}
          {hits.length === 0 && <div className="px-3 py-4 text-[12px] text-[var(--faint)]">No matches</div>}
          <div className="px-1.5 pb-1">
            <Pager paged={paged} label="results" compact />
          </div>
        </div>
      </div>
    </div>
  );
}
