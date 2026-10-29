import { useEffect, useState } from "react";

const ICONS = {
  spark: "M8 1.2 9.1 5.4 13.2 6.5 9.1 7.6 8 11.8 6.9 7.6 2.8 6.5 6.9 5.4 8 1.2Z",
  terminal: "M3 3.5h10v9H3v-9Zm2 2.2 1.6 1.3L5 8.3M8 8.4h3",
  eye: "M1.5 8s2.2-3.5 6.5-3.5S14.5 8 14.5 8 12.3 11.5 8 11.5 1.5 8 1.5 8Zm6.5 1.6a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Z",
  pencil: "M9.8 2.4 12.6 5.2 5.4 12.4 2.2 12.8 2.6 9.6 9.8 2.4Z",
  folder: "M1.6 4.2h4l1.2 1.4h7.6v6.8H1.6V4.2Z",
  search: "M7 3.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6Zm3.2 6.4 2.6 2.6",
  check: "M3.2 8.2 6.4 11.2 12.8 4.4",
  pipeline: "M3 4h10M3 8h10M3 12h10",
};

function elapsedLabel(ms) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
}

export function planSteps(text) {
  const steps = [];
  for (const line of String(text || "").split("\n")) {
    const match = line.match(/^\s*(?:\d+[.)]|[-*])\s+(.+)/);
    if (!match) continue;
    const step = match[1].replace(/\*\*/g, "").replace(/`/g, "").trim();
    if (!step || step.length > 180) continue;
    steps.push(step);
    if (steps.length >= 10) break;
  }
  return steps.length >= 2 ? steps : [];
}

export function ReasonTrail({ steps = [], startedAt = 0, elapsedMs = 0, pending = false }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!pending) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [pending]);
  if (!steps.length) return null;
  const elapsed = pending ? Math.max(0, now - startedAt) : elapsedMs;
  const active = steps.find((step) => step.state === "active");
  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center justify-between gap-3 text-[12px]">
        <span className="text-[var(--ink)]">{pending ? active?.title || "Thinking through the request" : `Thought for ${elapsedLabel(elapsed)}`}</span>
        {pending && <span className="tabular-nums text-[var(--faint)]">{elapsedLabel(elapsed)}</span>}
      </div>
      <ol className="space-y-0">
        {steps.map((step, index) => (
          <li key={`${step.title}-${index}`} className="flex gap-2">
            <span className="flex w-4 shrink-0 flex-col items-center">
              <StepMark state={step.state} kind={step.kind} />
              {index < steps.length - 1 && (
                <span
                  className={`my-0.5 w-px flex-1 ${step.state === "done" ? "bg-[var(--green)] opacity-60" : "bg-[var(--amber)] opacity-70"}`}
                  style={{ minHeight: 12 }}
                />
              )}
            </span>
            <span className="min-w-0 pb-2">
              <span className={`block text-[12.5px] leading-5 ${step.state === "pending" ? "text-[var(--faint)]" : step.state === "active" ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}>
                {step.title}
              </span>
              {step.detail && <span className="mt-0.5 block whitespace-pre-wrap text-[12px] leading-5 text-[var(--faint)]">{step.detail}</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepMark({ state, kind }) {
  const tone = state === "done" ? "var(--green)" : state === "pending" ? "var(--faint)" : "var(--amber)";
  return (
    <span className="relative mt-1 flex h-4 w-4 items-center justify-center">
      {state === "active" && <span className="absolute inset-0 animate-ping rounded-full bg-[var(--amber)] opacity-40" />}
      <svg viewBox="0 0 16 16" className="relative h-3.5 w-3.5" aria-hidden="true">
        <path d={ICONS[kind] || ICONS.spark} fill="none" stroke={tone} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function PlanCard({ steps }) {
  if (!steps?.length) return null;
  return (
    <div className="mt-3 rounded-[12px] border border-[var(--stroke-soft)] bg-[color-mix(in_srgb,var(--panel-soft)_80%,transparent)] px-3 py-2.5">
      <div className="mb-2 text-[11px] uppercase tracking-wide text-[var(--faint)]">Plan</div>
      <ol className="space-y-0">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="flex w-5 shrink-0 flex-col items-center">
              <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-[var(--amber)] text-[10px] text-[var(--amber)]">{index + 1}</span>
              {index < steps.length - 1 && <span className="my-0.5 w-px flex-1 bg-[var(--amber)] opacity-50" style={{ minHeight: 10 }} />}
            </span>
            <span className="pb-2 text-[13px] leading-5 text-[var(--ink)]">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
