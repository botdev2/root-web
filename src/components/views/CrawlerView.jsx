import { useState } from "react";
import { STEP_KINDS } from "../../features.js";
import { useAppState } from "../../AppState.jsx";
import { Page, Card, Field, Ghost, Primary } from "../ui.jsx";

const emptyFlow = () => ({
  id: "flow-" + Date.now(),
  name: "",
  startUrl: "https://",
  mailUrl: "",
  steps: [],
  lastLog: "",
});

export default function CrawlerView() {
  const { flows, upsertFlow, deleteFlow, notice } = useAppState();
  const [flowId, setFlowId] = useState(flows[0]?.id || null);
  const [draft, setDraft] = useState(null);
  const [playing, setPlaying] = useState(false);
  const flow = flows.find((item) => item.id === flowId) || flows[0];

  const play = (item) => {
    if (!item) return;
    const lines = (item.steps || []).map((step, index) => `${index + 1}. ${step.kind} · ${step.label || step.value || "—"}`);
    const next = { ...item, lastLog: lines.length ? lines.join("\n") : "No steps." };
    upsertFlow(next);
    setPlaying(true);
    notice("Played " + (item.name || "flow") + ".");
  };

  if (draft) {
    return (
      <Page wide>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[22px]">{draft.name.trim() || "New flow"}</div>
          <div className="flex gap-2">
            <Ghost onClick={() => setDraft(null)}>Back</Ghost>
            <Primary
              onClick={() => {
                const name = draft.name.trim();
                if (!name) {
                  notice("Name the flow first.");
                  return;
                }
                upsertFlow({ ...draft, name });
                setFlowId(draft.id);
                setDraft(null);
                notice("Saved “" + name + "”.");
              }}
            >
              Save
            </Primary>
          </div>
        </div>
        <Card className="space-y-3 p-4">
          <Field label="Name" value={draft.name} onChange={(value) => setDraft((prev) => ({ ...prev, name: value }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Start URL" value={draft.startUrl} onChange={(value) => setDraft((prev) => ({ ...prev, startUrl: value }))} />
            <Field label="Mail pane" value={draft.mailUrl} onChange={(value) => setDraft((prev) => ({ ...prev, mailUrl: value }))} />
          </div>
          <div className="text-[11px] text-[var(--faint)]">Steps</div>
          <div className="space-y-2">
            {draft.steps.map((step, index) => (
              <div key={step.id} className="grid gap-2 sm:grid-cols-[140px_1fr_1fr_auto]">
                <select
                  value={step.kind}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      steps: prev.steps.map((row) => (row.id === step.id ? { ...row, kind: event.target.value } : row)),
                    }))
                  }
                  className="h-10 rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-2 text-[13px] outline-none"
                >
                  {STEP_KINDS.map((kind) => (
                    <option key={kind}>{kind}</option>
                  ))}
                </select>
                <input
                  value={step.label}
                  placeholder="Label"
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      steps: prev.steps.map((row) => (row.id === step.id ? { ...row, label: event.target.value } : row)),
                    }))
                  }
                  className="h-10 rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 text-[13px] outline-none"
                />
                <input
                  value={step.value}
                  placeholder="Selector or value"
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      steps: prev.steps.map((row) => (row.id === step.id ? { ...row, value: event.target.value } : row)),
                    }))
                  }
                  className="h-10 rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 text-[13px] outline-none"
                />
                <Ghost
                  onClick={() => setDraft((prev) => ({ ...prev, steps: prev.steps.filter((row) => row.id !== step.id) }))}
                >
                  {index + 1}
                </Ghost>
              </div>
            ))}
          </div>
          <Ghost
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                steps: [...prev.steps, { id: "s" + Date.now(), kind: "click", label: "", value: "" }],
              }))
            }
          >
            Add step
          </Ghost>
        </Card>
      </Page>
    );
  }

  return (
    <Page wide>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Ghost onClick={() => setDraft(emptyFlow())}>New flow</Ghost>
        {flow && (
          <>
            <Ghost onClick={() => setDraft({ ...flow, steps: flow.steps.map((step) => ({ ...step })) })}>Edit</Ghost>
            <Ghost active={playing} onClick={() => play(flow)}>
              Play {flow.name}
            </Ghost>
            <Ghost
              onClick={() => {
                deleteFlow(flow.id);
                setFlowId(null);
                notice("Flow deleted.");
              }}
            >
              Delete
            </Ghost>
          </>
        )}
      </div>
      <div className="mb-3 flex flex-wrap gap-1">
        {flows.map((item) => (
          <Ghost key={item.id} active={flow?.id === item.id} onClick={() => { setFlowId(item.id); setPlaying(false); }}>
            {item.name}
          </Ghost>
        ))}
      </div>
      <div className="grid min-h-[320px] gap-3 lg:grid-cols-2">
        <Pane label="Pane A" url={flow?.startUrl || ""} live={playing} />
        <Pane label="Pane B · mail" url={flow?.mailUrl || ""} live={false} />
      </div>
      <Card className="mt-3 p-4">
        <div className="mb-2 text-[12px] text-[var(--faint)]">{flow ? flow.steps.length + " steps" : "No flow"}</div>
        {flow?.steps?.map((step, index) => (
          <div key={step.id} className="border-b border-[var(--stroke-soft)] py-2 text-[13px] last:border-b-0">
            <span className="text-[var(--faint)]">{index + 1}. {step.kind}</span> · {step.label || "—"}
            {step.value ? <span className="text-[var(--muted)]"> · {step.value}</span> : null}
          </div>
        ))}
        {flow?.lastLog && <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--code)] px-3 py-2 text-[12px] text-[var(--muted)]">{flow.lastLog}</pre>}
      </Card>
    </Page>
  );
}

function Pane({ label, url, live }) {
  return (
    <Card className="flex min-h-[180px] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--stroke-soft)] px-3 py-2 text-[11px] text-[var(--faint)]">
        <span>{label}</span>
        <span className="truncate">{url}</span>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 text-center text-[12px] text-[var(--faint)]">
        {live ? "Replaying steps in order. The desktop crawler drives the live panes." : "Flow target"}
      </div>
    </Card>
  );
}
