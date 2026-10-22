import { useState } from "react";
import { Tabs, Ghost } from "./ui.jsx";
import { useAppState } from "../AppState.jsx";

const TREES = {
  "my-mobile-app": [
    { name: "app.json", kind: "file" },
    { name: "package.json", kind: "file" },
    { name: "app", kind: "dir" },
    { name: "assets", kind: "dir" },
    { name: "src/App.tsx", kind: "file" },
  ],
  landing: [
    { name: "astro.config.mjs", kind: "file" },
    { name: "package.json", kind: "file" },
    { name: "src/pages/index.astro", kind: "file" },
    { name: "public", kind: "dir" },
  ],
  wiki: [
    { name: "README.md", kind: "file" },
    { name: "docs/welcome.md", kind: "file" },
    { name: "docs/keyboard.md", kind: "file" },
  ],
};

const COMMITS = {
  "my-mobile-app": [
    { hash: "a1c3e2", msg: "Fix expo-asset crash", when: "now" },
    { hash: "9bb014", msg: "Scaffold Expo template", when: "2h" },
  ],
  landing: [
    { hash: "c4d812", msg: "Hero copy", when: "2h" },
    { hash: "11ab90", msg: "Initial Astro scaffold", when: "1d" },
  ],
  wiki: [
    { hash: "ee9012", msg: "Port welcome page", when: "yesterday" },
  ],
};

const FLOWS = ["onboarding", "farm-push", "ops-deploy"];

export default function FilesInspector({ onClose, onOpenFile }) {
  const { project } = useAppState();
  const [tab, setTab] = useState("files");
  const [query, setQuery] = useState("");
  const tree = TREES[project.id] || [{ name: "README.md", kind: "file" }];
  const files = tree.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
  const commits = COMMITS[project.id] || [];

  return (
    <aside className="absolute inset-0 z-20 flex flex-col bg-[color-mix(in_srgb,var(--bg)_40%,transparent)] md:static md:inset-auto md:z-auto md:mb-3 md:mr-3 md:mt-2 md:w-[320px] md:shrink-0 md:bg-transparent">
      <div className="frost-panel ml-auto flex h-full w-[min(100%,360px)] flex-col border-l border-[var(--stroke)] p-3.5 md:ml-0 md:w-full md:rounded-2xl md:border">
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
              {files.map((item) => (
                <li key={item.name}>
                  <button
                    type="button"
                    onClick={() => onOpenFile?.(item.name)}
                    className="w-full rounded-lg px-2 py-2.5 text-left hover:bg-[var(--hover)]"
                  >
                    {item.kind === "dir" ? "▸ " : ""}
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        {tab === "git" && (
          <ul className="space-y-2 text-[12.5px]">
            {commits.map((commit) => (
              <li key={commit.hash} className="rounded-lg border border-[var(--stroke-soft)] px-3 py-2">
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
            {FLOWS.map((flow) => (
              <Ghost key={flow}>{flow}</Ghost>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
