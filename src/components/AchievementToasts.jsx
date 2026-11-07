import { useEffect, useRef, useState } from "react";
import { claimQuest, formatCredits, readQuests } from "../glmChat.js";
import { Glyph, iconFor, TITLE } from "./views/QuestsView.jsx";

const POLL_MS = 30_000;
const SHOW_MS = 12_000;

function keyOf(day, kind, item) {
  return kind === "achievement" ? `a:${item.id}` : `d:${day}:${item.id}`;
}

function readSeen(storeKey) {
  try {
    const raw = localStorage.getItem(storeKey);
    return raw ? new Set(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeSeen(storeKey, seen) {
  try {
    localStorage.setItem(storeKey, JSON.stringify([...seen].slice(-400)));
  } catch {
    /* storage can be full or blocked */
  }
}

/** Bottom-right pop-ups for anything that just became complete: daily challenges, the all-done bonus, and achievements. */
export default function AchievementToasts({ address, token, refreshKey, onOpen, onClaimed }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState("");
  const seenRef = useRef(null);
  const timers = useRef(new Map());

  const drop = (id) => {
    setItems((list) => list.filter((entry) => entry.id !== id));
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  };

  useEffect(() => {
    if (!address || !token) return undefined;
    const storeKey = "root-web-ach-seen:" + address.toLowerCase();
    let cancelled = false;

    const check = async () => {
      let data;
      try {
        data = (await readQuests(address))?.quests;
      } catch {
        return;
      }
      if (cancelled || !data) return;
      const everything = [
        ...data.daily.map((item) => ({ kind: "daily", item })),
        { kind: "daily", item: { ...data.bonus, tier: "bonus" } },
        ...data.achievements.map((item) => ({ kind: "achievement", item })),
      ];
      const done = everything.filter(({ item }) => item.done);
      const stored = seenRef.current || readSeen(storeKey);
      // First visit on this device: what is already complete is not news.
      const first = !stored;
      const seen = stored || new Set();
      seenRef.current = seen;
      const fresh = [];
      for (const entry of done) {
        const key = keyOf(data.day, entry.kind, entry.item);
        if (seen.has(key)) continue;
        seen.add(key);
        if (!first) fresh.push({ ...entry, id: key, perCredit: data.pointsPerCredit || 2000 });
      }
      writeSeen(storeKey, seen);
      if (!fresh.length) return;
      setItems((list) => [...list, ...fresh.filter((entry) => !entry.item.claimed)].slice(-4));
      fresh.forEach((entry) => {
        timers.current.set(entry.id, window.setTimeout(() => drop(entry.id), SHOW_MS));
      });
    };

    seenRef.current = null;
    check();
    const timer = window.setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [address, token, refreshKey]);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    },
    [],
  );

  const claim = async (entry) => {
    setBusy(entry.id);
    try {
      await claimQuest(address, entry.kind, entry.item.id);
      onClaimed?.(entry.item);
      drop(entry.id);
    } catch {
      onOpen?.();
      drop(entry.id);
    } finally {
      setBusy("");
    }
  };

  if (!items.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-50 flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-2 md:bottom-5 md:right-5" aria-live="polite">
      {items.map((entry) => {
        const { item } = entry;
        const achievement = entry.kind === "achievement";
        return (
          <div
            key={entry.id}
            role="status"
            className="frost-panel fade-up pointer-events-auto flex cursor-pointer gap-3 rounded-2xl border border-[var(--accent)] p-3.5 shadow-lg"
            onClick={() => {
              onOpen?.();
              drop(entry.id);
            }}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--bg)]">
              <Glyph name={achievement ? iconFor(item) : "check"} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] uppercase tracking-[0.12em] text-[var(--faint)]">{achievement ? "Achievement unlocked" : "Challenge complete"}</div>
              <div className="mt-0.5 truncate text-[13.5px]">{TITLE[item.id] || item.title}</div>
              <div className="mt-0.5 text-[11.5px] text-[var(--muted)]">
                +{item.points} points · {formatCredits(item.points / entry.perCredit)} credits
              </div>
              <button
                type="button"
                disabled={busy === entry.id}
                onClick={(event) => {
                  event.stopPropagation();
                  claim(entry);
                }}
                className="mt-2 h-7 rounded-md bg-[var(--accent)] px-3 text-[12px] text-[var(--bg)] disabled:opacity-60"
              >
                {busy === entry.id ? "…" : "Claim"}
              </button>
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={(event) => {
                event.stopPropagation();
                drop(entry.id);
              }}
              className="h-6 w-6 shrink-0 rounded-md text-[var(--faint)] hover:bg-[var(--hover)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mx-auto">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
