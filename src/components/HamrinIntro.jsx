import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import hamrin from "../assets/hamrin.png";

export const HAMRIN_SEEN_KEY = "root-web-hamrin-1-seen";

export function hamrinSeen() {
  try {
    return localStorage.getItem(HAMRIN_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

const POINTS = [
  {
    title: "Built around /root",
    text: "Reads your repository, writes files, and commits them to the Ops Hub, all from one prompt.",
  },
  {
    title: "Native to PALM Ops",
    text: "Your wallet is your identity. Git, hosting, and domains live in one decentralized system, and Hamrin works across all of it.",
  },
  {
    title: "Zero telemetry retention",
    text: "No analytics and no trackers. Your chats stay tied to your wallet, and you can delete them at any time.",
  },
];

// Shown once on a first visit, and again from the command palette.
export default function HamrinIntro({ open, onClose, onTour }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setShown(true), 650);
    return () => window.clearTimeout(timer);
  }, [open]);

  const close = (then) => {
    try {
      localStorage.setItem(HAMRIN_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    onClose?.();
    if (then === "tour") onTour?.();
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
    <div className="hamrin-backdrop" role="dialog" aria-modal="true" aria-label="Hamrin 1.0 is here" onClick={() => close()}>
      <div className="hamrin-card" onClick={(event) => event.stopPropagation()}>
        <div className="hamrin-halo" aria-hidden="true" />
        <img src={hamrin} alt="Hamrin, the PALM mascot" width={549} height={510} className="hamrin-mascot" draggable={false} />

        <div className="hamrin-body">
          <div className="text-[10.5px] uppercase tracking-[0.22em] text-[var(--accent)]">Meet the model</div>
          <h2 className="mt-2 text-[clamp(28px,5vw,40px)] leading-[1.08] tracking-[-0.02em] text-[var(--ink)]">Hamrin 1.0 is here.</h2>
          <p className="mt-3 text-[14px] leading-[1.65] text-[var(--muted)]">
            An enhanced open-source model by $PALM (palmaierc.com), built around working with /root and the wider PALM Ops
            decentralized system.
          </p>

          <ul className="mt-4 space-y-3">
            {POINTS.map((point, index) => (
              <li key={point.title} className="hamrin-point" style={{ animationDelay: `${0.45 + index * 0.14}s` }}>
                <span className="hamrin-dot" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[13.5px] text-[var(--ink)]">{point.title}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-5 text-[var(--muted)]">{point.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => close("tour")}
              className="h-10 rounded-xl bg-[var(--accent)] px-5 text-[13.5px] text-[var(--bg)] transition-transform hover:-translate-y-px"
            >
              Take the guided tour
            </button>
            <button
              type="button"
              onClick={() => close()}
              className="h-10 rounded-xl border border-[var(--stroke)] px-4 text-[13.5px] text-[var(--ink)] hover:bg-[var(--hover)]"
            >
              Start building
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
