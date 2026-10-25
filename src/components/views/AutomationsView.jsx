import { useMemo, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { AUTOMATION_TEMPLATES } from "../../mock.js";
import { useAppState } from "../../AppState.jsx";
import { Page, Card, Section, Ghost, Primary, Field } from "../ui.jsx";

const CATS = ["Popular", "Code Review", "Security", "Incidents & Triage", "Data & Research"];
const SCHEDULES = ["Manual", "Hourly", "Daily", "Weekly"];

export default function AutomationsView() {
  const { automations, runs, upsertAutomation, toggleAutomation, deleteAutomation, runAutomation, project, projects, model, notice } =
    useAppState();
  const { isConnected } = useAccount();
  const { open } = useAppKit();
  const [screen, setScreen] = useState("list");
  const [draft, setDraft] = useState(null);
  const [editorTab, setEditorTab] = useState("settings");
  const [cat, setCat] = useState("Popular");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return automations;
    return automations.filter((item) => (item.title + " " + item.project).toLowerCase().includes(q));
  }, [automations, query]);

  const startNew = (template) => {
    setDraft({
      id: (template?.id || "auto") + "-" + Date.now(),
      title: template?.title || "",
      project: project.id,
      schedule: template?.schedule || "Daily",
      hour: template?.schedule === "Manual" ? "" : "09:00",
      model,
      active: true,
      lastRun: "never",
      instructions: template?.instructions || "",
    });
    setEditorTab("settings");
    setScreen("edit");
  };

  const save = () => {
    const title = draft?.title?.trim();
    if (!title) {
      notice("Name the automation first.");
      return;
    }
    upsertAutomation({ ...draft, title, model: "glm-5.2:cloud", hour: draft.schedule === "Manual" ? "" : draft.hour });
    notice("Saved “" + title + "”.");
    setScreen("list");
  };

  if (screen === "edit" && draft) {
    const ownRuns = runs.filter((run) => run.automationId === draft.id);
    return (
      <Page>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[22px]">{draft.title.trim() || "New automation"}</div>
            <div className="text-[12px] text-[var(--faint)]">Repository, schedule, model, and instructions.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Ghost active={editorTab === "settings"} onClick={() => setEditorTab("settings")}>
              Settings
            </Ghost>
            <Ghost active={editorTab === "runs"} onClick={() => setEditorTab("runs")}>
              Runs
            </Ghost>
            <Ghost onClick={() => setScreen("list")}>Back</Ghost>
          </div>
        </div>
        {editorTab === "runs" ? (
          <div className="space-y-2">
            {ownRuns.length === 0 && <Card className="px-4 py-3 text-[13px] text-[var(--muted)]">No runs yet.</Card>}
            {ownRuns.map((run) => (
              <Card key={run.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[14px]">{run.when}</div>
                    <div className="mt-0.5 text-[12px] text-[var(--muted)]">{run.detail}</div>
                  </div>
                  <span className={run.status === "ok" ? "text-[11px] text-[var(--green)]" : "text-[11px] text-[var(--rose)]"}>{run.status}</span>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--code)] px-3 py-2 text-[12px] text-[var(--muted)]">{run.log}</pre>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="space-y-3 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <Field label="Name" value={draft.title} onChange={(value) => setDraft((prev) => ({ ...prev, title: value }))} />
              </div>
              <Ghost onClick={() => setDraft((prev) => ({ ...prev, active: !prev.active }))}>
                {draft.active ? "Schedule on" : "Halted"}
              </Ghost>
            </div>
            <label className="block">
              <div className="mb-1.5 text-[11px] text-[var(--faint)]">Repository</div>
              <select
                value={draft.project}
                onChange={(event) => setDraft((prev) => ({ ...prev, project: event.target.value }))}
                className="h-10 w-full rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 text-[14px] outline-none"
              >
                {projects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
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
              <Field
                label="Time"
                value={draft.hour}
                onChange={(value) => setDraft((prev) => ({ ...prev, hour: value }))}
                placeholder={draft.schedule === "Manual" ? "—" : "09:00"}
              />
            </div>
            <div>
              <div className="mb-1.5 text-[11px] text-[var(--faint)]">Model</div>
              <div className="text-[14px]">{isConnected ? "GLM 5.2 cloud" : "Connect a wallet"}</div>
            </div>
            <label className="block">
              <div className="mb-1.5 text-[11px] text-[var(--faint)]">Agent instructions</div>
              <textarea
                value={draft.instructions}
                onChange={(event) => setDraft((prev) => ({ ...prev, instructions: event.target.value }))}
                rows={7}
                className="w-full resize-y rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 py-2 text-[14px] outline-none"
              />
            </label>
            <div className="text-[12px] leading-5 text-[var(--faint)]">
              Schedule on runs this on its timer. Halted automations stay in the list and can still be run by hand.
            </div>
            <div className="flex flex-wrap gap-2">
              <Primary onClick={save}>Save</Primary>
              <Ghost
                onClick={() => {
                  if (!isConnected) {
                    notice("Connect a wallet to use GLM 5.2 cloud.");
                    open({ view: "Connect" });
                    return;
                  }
                  runAutomation({ ...draft, title: draft.title.trim() || "Untitled", model: "glm-5.2:cloud" });
                  notice("Run finished.");
                  setEditorTab("runs");
                }}
              >
                Run now
              </Ghost>
              <Ghost
                onClick={() => {
                  deleteAutomation(draft.id);
                  notice("Automation removed.");
                  setScreen("list");
                }}
              >
                Delete
              </Ghost>
            </div>
          </Card>
        )}
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
          {runs.length === 0 && <Card className="px-4 py-3 text-[13px] text-[var(--muted)]">No runs yet.</Card>}
          {runs.map((run) => (
            <Card key={run.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[14px]">{run.title}</div>
                  <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                    {run.when} · {run.detail}
                  </div>
                </div>
                <span className={run.status === "ok" ? "text-[11px] text-[var(--green)]" : "text-[11px] text-[var(--rose)]"}>{run.status}</span>
              </div>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-[var(--code)] px-3 py-2 text-[12px] text-[var(--muted)]">{run.log}</pre>
            </Card>
          ))}
        </div>
      </Page>
    );
  }

  const ok = runs.filter((run) => run.status === "ok").length;
  const failed = runs.filter((run) => run.status !== "ok").length;

  return (
    <Page>
      <div className="mb-1 text-[22px]">Automations</div>
      <div className="text-[12px] text-[var(--faint)]">Scheduled helpers for the projects in this harness.</div>
      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ["Total", String(automations.length), false],
          ["Successful", String(ok), false],
          ["Failed", String(failed), false],
          ["Run history", "→", true],
        ].map(([label, value, history]) => (
          <button key={label} type="button" onClick={() => history && setScreen("history")} className="text-left">
            <Card className="px-4 py-3">
              <div className="text-[11px] text-[var(--faint)]">{label}</div>
              <div className="mt-1 text-[20px]">{value}</div>
            </Card>
          </button>
        ))}
      </div>

      <div className="mt-6 mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[13px]">Your automations · {automations.length}</div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="h-9 w-full rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 text-[13px] outline-none sm:w-44"
          />
          <Primary onClick={() => startNew()}>+ New Automation</Primary>
        </div>
      </div>
      <div className="space-y-2">
        {visible.length === 0 && (
          <Card className="px-4 py-3 text-[13px] text-[var(--muted)]">
            {automations.length === 0 ? "No automations yet. Start from a template below." : "No matches."}
          </Card>
        )}
        {visible.map((item) => (
          <Card key={item.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setDraft(item);
                setEditorTab("settings");
                setScreen("edit");
              }}
              className="text-left"
            >
              <div className="text-[14px]">{item.title}</div>
              <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                {item.project} · {item.schedule}
                {item.hour ? " · " + item.hour : ""} · {isConnected ? "GLM 5.2 cloud" : "No wallet"} · {item.active ? "Schedule on" : "Halted"} · {item.lastRun}
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
                  if (!isConnected) {
                    notice("Connect a wallet to use GLM 5.2 cloud.");
                    open({ view: "Connect" });
                    return;
                  }
                  runAutomation({ ...item, model: "glm-5.2:cloud" });
                  notice("Run finished.");
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
              <div className="mt-1 text-[11px] text-[var(--faint)]">{item.schedule}</div>
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
