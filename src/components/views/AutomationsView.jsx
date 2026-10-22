import { useState } from "react";
import { AUTOMATION_TEMPLATES } from "../../mock.js";
import { useAppState } from "../../AppState.jsx";
import { Page, Card, Section, Ghost, Primary, Field } from "../ui.jsx";

const CATS = ["Popular", "Code Review", "Security", "Incidents & Triage", "Data & Research"];
const SCHEDULES = ["Manual", "Hourly", "Daily", "Weekly"];

export default function AutomationsView() {
  const { automations, runs, upsertAutomation, toggleAutomation, runAutomation, project, model, notice } = useAppState();
  const [screen, setScreen] = useState("list");
  const [draft, setDraft] = useState(null);
  const [cat, setCat] = useState("Popular");
  const [openRun, setOpenRun] = useState(null);

  const startNew = (template) => {
    setDraft({
      id: (template?.id || "auto") + "-" + Date.now(),
      title: template?.title || "New automation",
      project: project.id,
      schedule: template?.schedule || "Daily",
      hour: "09:00",
      model,
      active: true,
      lastRun: "never",
      instructions: template?.instructions || "",
    });
    setScreen("edit");
  };

  const save = () => {
    if (!draft?.title?.trim()) {
      notice("Name the automation first.");
      return;
    }
    upsertAutomation({ ...draft, title: draft.title.trim() });
    notice("Saved “" + draft.title.trim() + "”.");
    setScreen("list");
  };

  if (screen === "edit" && draft) {
    return (
      <Page>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[22px]">{draft.id.startsWith("auto") ? "New automation" : "Edit automation"}</div>
            <div className="text-[12px] text-[var(--faint)]">{project.label}</div>
          </div>
          <Ghost onClick={() => setScreen("list")}>Back</Ghost>
        </div>
        <Card className="space-y-3 p-4">
          <Field label="Name" value={draft.title} onChange={(value) => setDraft((prev) => ({ ...prev, title: value }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <div className="mb-1.5 text-[11px] text-[var(--faint)]">Schedule</div>
              <select
                value={draft.schedule}
                onChange={(event) => setDraft((prev) => ({ ...prev, schedule: event.target.value }))}
                className="h-10 w-full rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 text-[14px] outline-none"
              >
                {SCHEDULES.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <Field label="Time" value={draft.hour} onChange={(value) => setDraft((prev) => ({ ...prev, hour: value }))} placeholder="09:00" />
          </div>
          <Field label="Model" value={draft.model} onChange={(value) => setDraft((prev) => ({ ...prev, model: value }))} />
          <label className="block">
            <div className="mb-1.5 text-[11px] text-[var(--faint)]">Instructions</div>
            <textarea
              value={draft.instructions}
              onChange={(event) => setDraft((prev) => ({ ...prev, instructions: event.target.value }))}
              rows={6}
              className="w-full resize-y rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 py-2 text-[14px] outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Primary onClick={save}>Save</Primary>
            <Ghost onClick={() => setDraft((prev) => ({ ...prev, active: !prev.active }))}>
              {draft.active ? "Will run" : "Halted"}
            </Ghost>
          </div>
        </Card>
      </Page>
    );
  }

  if (screen === "history") {
    return (
      <Page>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[22px]">Run history</div>
            <div className="text-[12px] text-[var(--faint)]">{runs.length} runs</div>
          </div>
          <Ghost onClick={() => setScreen("list")}>Back</Ghost>
        </div>
        <div className="space-y-2">
          {runs.map((run) => (
            <Card key={run.id} className="px-4 py-3">
              <button type="button" onClick={() => setOpenRun(openRun === run.id ? null : run.id)} className="flex w-full items-start justify-between gap-3 text-left">
                <div>
                  <div className="text-[14px]">{run.title}</div>
                  <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                    {run.when} · {run.detail}
                  </div>
                </div>
                <span className={run.status === "ok" ? "text-[11px] text-[var(--green)]" : "text-[11px] text-[var(--rose)]"}>
                  {run.status}
                </span>
              </button>
              {openRun === run.id && (
                <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--code)] px-3 py-2 text-[12px] text-[var(--muted)]">{run.log}</pre>
              )}
            </Card>
          ))}
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="mb-1 text-[22px]">Automations</div>
      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ["Total", String(automations.length)],
          ["Successful · 7d", String(runs.filter((run) => run.status === "ok").length)],
          ["Failed · 7d", String(runs.filter((run) => run.status !== "ok").length)],
          ["Run history", "→"],
        ].map(([label, value]) => (
          <button key={label} type="button" onClick={() => label === "Run history" && setScreen("history")} className="text-left">
            <Card className="px-4 py-3">
              <div className="text-[11px] text-[var(--faint)]">{label}</div>
              <div className="mt-1 text-[20px]">{value}</div>
            </Card>
          </button>
        ))}
      </div>

      <div className="mt-6 mb-3 flex items-center justify-between">
        <div className="text-[13px]">Your automations · {automations.length}</div>
        <Primary onClick={() => startNew()}>+ New Automation</Primary>
      </div>
      <div className="space-y-2">
        {automations.map((item) => (
          <Card key={item.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => { setDraft(item); setScreen("edit"); }} className="text-left">
              <div className="text-[14px]">{item.title}</div>
              <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                {item.project} · {item.schedule}
                {item.hour ? " · " + item.hour : ""} · {item.model} · {item.active ? "Schedule on" : "Halted"}
              </div>
            </button>
            <div className="flex flex-wrap gap-2">
              <Ghost
                onClick={() => {
                  toggleAutomation(item.id);
                  notice(item.active ? "Schedule halted." : "Schedule resumed.");
                }}
              >
                {item.active ? "Halt schedule" : "Resume"}
              </Ghost>
              <Ghost
                onClick={() => {
                  runAutomation(item);
                  notice("Run started.");
                }}
              >
                Run now
              </Ghost>
            </div>
          </Card>
        ))}
      </div>

      <Section title="Templates">
        <div className="mb-3 flex flex-wrap gap-1">
          {CATS.map((name) => (
            <Ghost key={name} active={cat === name} onClick={() => setCat(name)}>
              {name}
            </Ghost>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {AUTOMATION_TEMPLATES.filter((item) => item.cat === cat).map((item) => (
            <Card key={item.id} className="p-4">
              <div className="text-[14px]">{item.title}</div>
              <div className="mt-1 text-[12px] text-[var(--muted)]">{item.desc}</div>
              <div className="mt-3">
                <Ghost onClick={() => startNew(item)}>Use template</Ghost>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </Page>
  );
}
