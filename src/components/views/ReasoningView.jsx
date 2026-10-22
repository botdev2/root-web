import { useState } from "react";
import { REASONING_NODES } from "../../mock.js";
import { useAppState } from "../../AppState.jsx";
import { Page, Card, Ghost } from "../ui.jsx";

export default function ReasoningView() {
  const { notice } = useAppState();
  const [selected, setSelected] = useState("intake");
  const node = REASONING_NODES.find((item) => item.id === selected);

  return (
    <Page wide>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Ghost onClick={() => notice("Brain saved.")}>Save brain</Ghost>
        <Ghost
          onClick={() => {
            setSelected("intake");
            notice("Defaults restored.");
          }}
        >
          Reset defaults
        </Ghost>
        <span className="text-[11px] text-[var(--muted)]">Changes apply to agent flow (auto-prompt, pipeline, approvals).</span>
      </div>
      <Card className="relative min-h-[420px] overflow-hidden p-4">
        <svg className="absolute inset-6 h-[calc(100%-48px)] w-[calc(100%-48px)] text-[var(--stroke)]" viewBox="0 0 100 60">
          <path d="M16 42 C 22 42, 24 24, 32 24" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <path d="M36 24 C 42 24, 44 42, 52 42" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <path d="M56 42 C 62 42, 64 24, 72 24" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <path d="M76 24 C 80 24, 82 42, 88 42" fill="none" stroke="currentColor" strokeWidth="0.4" />
        </svg>
        {REASONING_NODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item.id)}
            style={{ left: item.x + "%", top: item.y + "%" }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2 text-left ${
              selected === item.id
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--stroke)] bg-[var(--panel)]"
            }`}
          >
            <div className="text-[13px]">{item.label}</div>
            <div className="hidden text-[10px] text-[var(--muted)] sm:block">{item.hint}</div>
          </button>
        ))}
      </Card>
      <Card className="mt-4 px-4 py-3">
        <div className="text-[13px]">{node.label}</div>
        <div className="mt-1 text-[12px] text-[var(--muted)]">{node.hint}. Click a node to inspect it.</div>
      </Card>
    </Page>
  );
}
