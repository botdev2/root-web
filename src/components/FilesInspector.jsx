import { useEffect, useState } from "react";
import { Tabs, Ghost, Field } from "./ui.jsx";
import { useAppState } from "../AppState.jsx";

const STATUS = {
  added: "text-[var(--green)]",
  modified: "text-[var(--amber)]",
  deleted: "text-[var(--rose)]",
};

function editedInstant(value, now) {
  if (!value || value === "just now") return null;
  const text = String(value);
  if (text.length === 10) {
    const day = Date.parse(`${text}T00:00:00`);
    return Number.isNaN(day) ? null : day;
  }
  const time = Date.parse(text);
  if (Number.isNaN(time)) return null;
  if (time > now + 2000) {
    const day = Date.parse(`${text.slice(0, 10)}T00:00:00`);
    if (!Number.isNaN(day) && day <= now) return day;
  }
  return time;
}

function formatElapsed(elapsed) {
  const seconds = Math.max(0, Math.floor(elapsed / 1000));
  if (seconds < 60) return `${seconds}s`;
  if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)}m`;
  if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)}h`;
  if (elapsed < 14 * 86400000) return `${Math.floor(elapsed / 86400000)}d`;
  return "";
}

function editedAge(value, now) {
  if (!value) return "";
  const time = editedInstant(value, now);
  if (time == null) return value === "just now" ? "0s" : String(value);
  const label = formatElapsed(now - time);
  if (label) return label;
  return new Date(time).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function editedTitle(value) {
  if (!value) return "";
  const text = String(value);
  const time = Date.parse(text.length === 10 ? `${text}T12:00:00` : text);
  if (Number.isNaN(time)) return text;
  return new Date(time).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function FilesInspector({ onClose, onOpenFile, project }) {
  const { files, fileInfo, commits, charts, upsertChart, deleteChart, notice } = useAppState();
  const [tab, setTab] = useState("files");
  const [query, setQuery] = useState("");
  const [chartId, setChartId] = useState(null);
  const [node, setNode] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const tree = project ? files[project.id] || {} : {};
  const meta = project ? fileInfo?.[project.id] || {} : {};
  const names = Array.from(new Set([...Object.keys(tree), ...Object.keys(meta)]))
    .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
    .sort((left, right) => {
      const leftAt = Date.parse(meta[left]?.edited || "") || 0;
      const rightAt = Date.parse(meta[right]?.edited || "") || 0;
      if (rightAt !== leftAt) return rightAt - leftAt;
      return left.localeCompare(right);
    });
  const history = project ? commits[project.id] || [] : [];
  const projectCharts = project ? charts.filter((item) => item.project === project.id) : [];
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
            <div className="mb-2 text-[12px] text-[var(--muted)]">{project ? project.label : "No repository"}</div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search files"
              className="mb-3 h-10 rounded-[10px] border border-[var(--stroke)] bg-[var(--input)] px-3 text-[12px] outline-none"
            />
            <ul className="space-y-0.5 text-[12.5px]">
              {names.map((name) => {
                const info = meta[name] || {};
                const tone = STATUS[info.status] || "";
                const slash = name.lastIndexOf("/");
                const dir = slash >= 0 ? name.slice(0, slash + 1) : "";
                const base = slash >= 0 ? name.slice(slash + 1) : name;
                const removed = info.status === "deleted";
                const when = editedAge(info.edited, now);
                const title = [info.message, editedTitle(info.edited)].filter(Boolean).join(" · ");
                return (
                  <li key={name}>
                    <button
                      type="button"
                      title={title}
                      disabled={removed}
                      onClick={() => {
                        if (!removed) onOpenFile?.(name);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-[var(--hover)] disabled:hover:bg-transparent"
                    >
                      <span className={`min-w-0 flex-1 truncate ${removed ? "line-through" : ""}`}>
                        {dir && <span className="text-[var(--faint)]">{dir}</span>}
                        <span className={tone ? `${tone} font-medium` : ""}>{base}</span>
                      </span>
                      {when && <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-[var(--faint)]">{when}</span>}
                    </button>
                  </li>
                );
              })}
              {names.length === 0 && (
                <li className="px-2 py-2 text-[12px] text-[var(--faint)]">
                  {project ? "No files in this repository yet." : "Open a repository to list its files."}
                </li>
              )}
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
                  {commit.hash} · {editedAge(commit.when, now) || commit.when}
                  {commit.files?.length ? ` · ${commit.files.length} file${commit.files.length === 1 ? "" : "s"}` : ""}
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
                    if (!project) return;
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
