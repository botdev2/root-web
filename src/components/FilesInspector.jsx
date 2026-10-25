import { useState } from "react";
import { Tabs, Ghost, Field } from "./ui.jsx";
import { useAppState } from "../AppState.jsx";

export default function FilesInspector({ onClose, onOpenFile }) {
  const { project, files, commits, charts, upsertChart, deleteChart, notice } = useAppState();
  const [tab, setTab] = useState("files");
  const [query, setQuery] = useState("");
  const [chartId, setChartId] = useState(null);
  const [node, setNode] = useState("");
  const tree = files[project.id] || {};
  const names = Object.keys(tree)
    .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
    .sort();
  const history = commits[project.id] || [];
  const projectCharts = charts.filter((item) => item.project === project.id);
  const chart = charts.find((item) => item.id === chartId);

  return (
    <aside className="absolute inset-0 z-20 flex flex-col bg-[color-mix(in_srgb,var(--bg)_40%,transparent)] md:static md:inset-auto md:z-auto md:mb-3 md:mr-3 md:mt-2 md:w-[320px] md:shrink-0 md:bg-transparent">
      <div className="frost-panel ml-auto flex h-full w-[min(100%,360px)] flex-col overflow-y-auto border-l border-[var(--stroke)] p-3.5 md:ml-0 md:w-full md:rounded-2xl md:border">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[13px]">Inspector</div>
          <button type="button" onClick={onClose} className="h-10 px-2 text-[12px] text-[var(--faint)] hover:text-[var(--ink)]">
            Hide
          </button>
        </div>
        <Tabs
          tabs={[
            { id: "files", label: "Files" },
            { id: "git", label: "Git" },
            { id: "flow", label: "Flowcharts" },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === "files" && (
          <>
            <div className="mb-2 text-[12px] text-[var(--muted)]">{project.label}</div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search files"
              className="mb-3 h-10 rounded-[10px] border border-[var(--stroke)] bg-[var(--input)] px-3 text-[12px] outline-none"
            />
            <ul className="space-y-0.5 text-[12.5px]">
              {names.map((name) => (
                <li key={name}>
                  <button type="button" onClick={() => onOpenFile?.(name)} className="w-full rounded-lg px-2 py-2.5 text-left hover:bg-[var(--hover)]">
                    {name}
                  </button>
                </li>
              ))}
              {names.length === 0 && <li className="px-2 py-2 text-[12px] text-[var(--faint)]">No files yet.</li>}
            </ul>
          </>
        )}
        {tab === "git" && (
          <ul className="space-y-2 text-[12.5px]">
            {history.length === 0 && <li className="text-[12px] text-[var(--faint)]">No commits yet.</li>}
            {history.map((commit) => (
              <li key={commit.hash + commit.msg} className="rounded-lg border border-[var(--stroke-soft)] px-3 py-2">
                <div>{commit.msg}</div>
                <div className="mt-0.5 text-[11px] text-[var(--faint)]">
                  {commit.hash} · {commit.when}
                </div>
              </li>
            ))}
          </ul>
        )}
        {tab === "flow" && (
          <div className="space-y-2">
            {chart ? (
              <>
                <div className="text-[13px]">{chart.name}</div>
                <ul className="space-y-1 text-[12.5px]">
                  {chart.nodes.map((label, index) => (
                    <li key={label + index} className="flex items-center justify-between rounded-lg border border-[var(--stroke-soft)] px-2 py-1.5">
                      <span>{label}</span>
                      <button
                        type="button"
                        className="text-[11px] text-[var(--faint)]"
                        onClick={() => upsertChart({ ...chart, nodes: chart.nodes.filter((_, i) => i !== index) })}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                <Field value={node} onChange={setNode} placeholder="Step" />
                <div className="flex flex-wrap gap-2">
                  <Ghost
                    onClick={() => {
                      const label = node.trim();
                      if (!label) return;
                      upsertChart({ ...chart, nodes: [...chart.nodes, label] });
                      setNode("");
                    }}
                  >
                    Add step
                  </Ghost>
                  <Ghost onClick={() => setChartId(null)}>Back</Ghost>
                  <Ghost
                    onClick={() => {
                      deleteChart(chart.id);
                      setChartId(null);
                      notice("Flowchart removed.");
                    }}
                  >
                    Delete
                  </Ghost>
                </div>
              </>
            ) : (
              <>
                {projectCharts.map((item) => (
                  <Ghost key={item.id} onClick={() => setChartId(item.id)}>
                    {item.name}
                  </Ghost>
                ))}
                <Ghost
                  onClick={() => {
                    const id = "chart-" + Date.now();
                    upsertChart({ id, name: "New flowchart", project: project.id, nodes: ["Start"] });
                    setChartId(id);
                  }}
                >
                  New flowchart
                </Ghost>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
