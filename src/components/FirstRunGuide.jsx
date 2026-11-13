import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export const GUIDE_SEEN_KEY = "root-web-hamrin-1-seen";

export function guideSeen() {
  try {
    return localStorage.getItem(GUIDE_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export default function FirstRunGuide({ open, onClose, onTour, onShip }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setShown(true), 400);
    return () => window.clearTimeout(timer);
  }, [open]);

  const close = (then) => {
    try {
      localStorage.setItem(GUIDE_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    onClose?.();
    if (then === "tour") onTour?.();
    if (then === "ship") onShip?.();
  };

  useEffect(() => {
    if (!open || !shown) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, shown]);

  if (!open || !shown) return null;

  return createPortal(
    <div className="guide-backdrop" role="dialog" aria-modal="true" aria-label="Ship a live app" onClick={() => close()}>
      <div className="guide-card" onClick={(event) => event.stopPropagation()}>
        <div className="text-[10.5px] uppercase tracking-[0.22em] text-[var(--faint)]">First time here</div>
        <h2 className="mt-2 text-[clamp(24px,4vw,32px)] leading-[1.12] tracking-[-0.02em] text-[var(--ink)]">Ship a live app.</h2>
        <p className="mt-3 text-[14px] leading-[1.65] text-[var(--muted)]">
          Make an app that compiles, connect it to Ops through the Hub repo, and push it live. Wallet only. Stay on this page.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => close("ship")}
            className="h-10 rounded-xl bg-[var(--accent)] px-5 text-[13.5px] text-[var(--bg)]"
          >
            Ship an app
          </button>
          <button
            type="button"
            onClick={() => close("tour")}
            className="h-10 rounded-xl border border-[var(--stroke)] px-4 text-[13.5px] text-[var(--ink)] hover:bg-[var(--hover)]"
          >
            Tutorial
          </button>
          <button
            type="button"
            onClick={() => close()}
            className="h-10 px-3 text-[13.5px] text-[var(--muted)]"
          >
            Skip
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
