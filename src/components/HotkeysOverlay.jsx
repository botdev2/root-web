import { useEffect, useMemo } from "react";
import { HOTKEYS, hotkeyLabel } from "../hotkeys.js";

export default function HotkeysOverlay({ onClose, onPick }) {
  const mac = useMemo(() => {
    try {
      return /Mac|iPhone|iPad/.test(navigator.platform || "") || /Mac OS/.test(navigator.userAgent || "");
    } catch {
      return false;
    }
  }, []);

  const groups = useMemo(() => {
    const map = new Map();
    for (const item of HOTKEYS) {
      const list = map.get(item.group) || [];
      list.push(item);
      map.set(item.group, list);
    }
    return [...map.entries()];
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-40 flex items-start justify-center bg-[color-mix(in_srgb,#000_34%,transparent)] pt-[8vh] md:pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="frost-panel max-h-[min(78vh,720px)] w-[min(560px,94vw)] overflow-auto rounded-2xl border border-[var(--stroke)] fade-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-[var(--stroke-soft)] bg-[color-mix(in_srgb,var(--panel)_92%,transparent)] px-4 py-3 backdrop-blur">
          <div>
            <div className="text-[14px]">Hotkeys</div>
            <div className="text-[11px] text-[var(--muted)]">Chrome shortcuts. Miles can run most of these for you.</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-[12px] text-[var(--muted)] hover:bg-[var(--hover)]">
            Esc
          </button>
        </div>
        <div className="space-y-5 p-4">
          {groups.map(([group, rows]) => (
            <section key={group}>
              <div className="mb-2 text-[11px] tracking-[0.14em] text-[var(--faint)] uppercase">{group}</div>
              <div className="space-y-1">
                {rows.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onPick?.(item.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-left hover:border-[var(--stroke)] hover:bg-[var(--hover)]"
                  >
                    <span className="text-[13px]">{item.label}</span>
                    <kbd className="rounded-md border border-[var(--stroke)] bg-[var(--panel-soft)] px-2 py-0.5 font-[inherit] text-[11px] text-[var(--muted)] tabular-nums">
                      {hotkeyLabel(item, mac)}
                    </kbd>
                  </button>
                ))}
              </div>
            </section>
          ))}
          <p className="text-[12px] leading-5 text-[var(--faint)]">
            Ask Miles: “open markets”, “ship an app”, “switch to agent”, “nvidia theme”, “write a prompt that…” — he clicks and fills for you.
          </p>
        </div>
      </div>
    </div>
  );
}
