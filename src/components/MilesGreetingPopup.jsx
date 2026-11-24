import { useEffect } from "react";
import portrait from "../assets/avatar.png";
import { viewLabel } from "../milesGreeting.js";

export default function MilesGreetingPopup({ payload, onContinue, onTalk, onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!payload) return null;

  const { greeting, firstVisit, awayLabel, leftOff, activities } = payload;
  const hasActivity = activities?.length > 0;
  const hasLeft = !!leftOff;

  return (
    <div
      className="absolute inset-0 z-[80] flex items-start justify-center bg-[color-mix(in_srgb,#000_42%,transparent)] px-3 pt-[6vh] md:pt-[10vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Miles greeting"
    >
      <div
        className="frost-panel fade-up w-[min(520px,96vw)] overflow-hidden rounded-[28px] border border-[var(--stroke)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative overflow-hidden border-b border-[var(--stroke-soft)] px-5 pb-5 pt-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(ellipse at 20% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 55%), radial-gradient(ellipse at 90% 30%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 50%)",
            }}
          />
          <div className="relative flex items-start gap-4">
            <div className="shrink-0 overflow-hidden rounded-[22px] shadow-lg" style={{ width: 88, height: Math.round((88 * 993) / 871) }}>
              <img src={portrait} alt="" width={871} height={993} className="h-full w-full object-cover" draggable={false} />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <div className="text-[11px] tracking-[0.28em] text-[var(--faint)]">MILES</div>
              <div className="mt-1 font-[family-name:var(--font-display,inherit)] text-[28px] leading-tight tracking-[-0.02em] text-[var(--ink)]">
                {greeting}
              </div>
              <p className="mt-2 text-[13.5px] leading-5 text-[var(--muted)]">
                {firstVisit
                  ? "Welcome to the desk. I’ll keep track of where you leave things."
                  : awayLabel
                    ? `You’re back. Last time you were here ${awayLabel}.`
                    : "You’re back. Here’s where we left things."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="relative -mr-1 -mt-1 h-8 w-8 rounded-lg text-[18px] text-[var(--muted)] hover:bg-[var(--hover)]"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="max-h-[min(52vh,440px)] space-y-4 overflow-y-auto px-5 py-4">
          {hasLeft && (
            <section>
              <div className="mb-2 text-[11px] tracking-[0.2em] text-[var(--faint)]">WHERE YOU LEFT OFF</div>
              <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--hover)] px-4 py-3">
                <div className="text-[15px] text-[var(--ink)]">{leftOff.viewName || viewLabel(leftOff.view)}</div>
                <div className="mt-1 text-[12.5px] leading-5 text-[var(--muted)]">
                  {[leftOff.projectLabel, leftOff.sessionTitle && leftOff.sessionTitle !== "New Agent" ? leftOff.sessionTitle : "", leftOff.mode ? leftOff.mode + " mode" : ""]
                    .filter(Boolean)
                    .join(" · ") || "Open desk"}
                  {leftOff.when ? ` · ${leftOff.when}` : ""}
                </div>
              </div>
            </section>
          )}

          <section>
            <div className="mb-2 text-[11px] tracking-[0.2em] text-[var(--faint)]">
              {firstVisit ? "GETTING STARTED" : "SINCE LAST TIME"}
            </div>
            {firstVisit ? (
              <ul className="space-y-2 text-[13px] leading-5 text-[var(--muted)]">
                <li className="rounded-xl border border-[var(--stroke-soft)] px-3 py-2">Open a Hub project or start a New Agent chat.</li>
                <li className="rounded-xl border border-[var(--stroke-soft)] px-3 py-2">Ask me to open screens, ship, or prompt Hamrin.</li>
                <li className="rounded-xl border border-[var(--stroke-soft)] px-3 py-2">I’ll greet you next login with what moved.</li>
              </ul>
            ) : hasActivity ? (
              <ul className="space-y-2">
                {activities.slice(0, 10).map((item, index) => (
                  <li key={(item.at || "") + index} className="flex gap-3 rounded-xl border border-[var(--stroke-soft)] px-3 py-2.5">
                    <span className="mt-0.5 shrink-0 text-[10px] tracking-[0.14em] text-[var(--faint)]">{kindLabel(item.type)}</span>
                    <div className="min-w-0">
                      <div className="text-[13px] text-[var(--ink)]">{item.label}</div>
                      {item.detail && <div className="mt-0.5 text-[11.5px] text-[var(--muted)]">{item.detail}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-[var(--stroke-soft)] px-3 py-2.5 text-[13px] text-[var(--muted)]">
                Quiet stretch — no ships, chats, or screen hops logged since you left.
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--stroke-soft)] px-5 py-4">
          {hasLeft && (
            <button
              type="button"
              onClick={onContinue}
              className="h-10 rounded-xl bg-[var(--accent)] px-4 text-[13px] text-[var(--bg)]"
            >
              Continue where I left off
            </button>
          )}
          <button
            type="button"
            onClick={onTalk}
            className="h-10 rounded-xl border border-[var(--stroke)] px-4 text-[13px] text-[var(--ink)] hover:bg-[var(--hover)]"
          >
            Talk to Miles
          </button>
          <button type="button" onClick={onClose} className="ml-auto h-10 px-2 text-[12.5px] text-[var(--muted)] hover:text-[var(--ink)]">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function kindLabel(type) {
  switch (type) {
    case "ship":
      return "SHIP";
    case "chat":
      return "CHAT";
    case "view":
      return "VIEW";
    case "market":
      return "MARKET";
    default:
      return "NOTE";
  }
}
