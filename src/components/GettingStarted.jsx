import { useState } from "react";
import { useAppState } from "../AppState.jsx";
import { Field, Ghost, Primary, Tabs } from "./ui.jsx";

const TABS = [
  { id: "skills", label: "1 · Skills" },
  { id: "repos", label: "2 · Projects" },
  { id: "github", label: "3 · GitHub" },
];

export default function GettingStarted({ onClose }) {
  const { completeOnboarding, addProject, notice, onboarding } = useAppState();
  const [tab, setTab] = useState(onboarding.github ? "github" : onboarding.repos ? "github" : onboarding.skills ? "repos" : "skills");
  const [token, setToken] = useState("");
  const [repo, setRepo] = useState("github.com/you/my-mobile-app");

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[color-mix(in_srgb,#000_40%,transparent)] px-4" onClick={onClose}>
      <div className="frost-panel w-[min(520px,94vw)] rounded-2xl border border-[var(--stroke)] p-5" onClick={(event) => event.stopPropagation()}>
        <div className="text-[11px] text-[var(--faint)]">Getting Started</div>
        <h2 className="mt-1 text-[20px]">Set up this workspace</h2>
        <Tabs tabs={TABS} value={tab} onChange={setTab} />

        {tab === "skills" && (
          <div>
            <p className="text-[13px] text-[var(--muted)]">
              Bridge skills you already use — Farm, Ops, and chat tools — into this session.
            </p>
            <div className="mt-4 flex gap-2">
              <Primary
                onClick={() => {
                  completeOnboarding("skills");
                  notice("Skills bridged.");
                  setTab("repos");
                }}
              >
                Bridge skills
              </Primary>
              <Ghost onClick={onClose}>Later</Ghost>
            </div>
          </div>
        )}

        {tab === "repos" && (
          <div>
            <p className="mb-3 text-[13px] text-[var(--muted)]">Import a GitHub project as the active workspace.</p>
            <Field label="Repository" value={repo} onChange={setRepo} />
            <div className="mt-4 flex gap-2">
              <Primary
                onClick={() => {
                  const label = repo.split("/").pop() || "project";
                  addProject({ id: label, label, title: label });
                  completeOnboarding("repos");
                  notice("Project connected.");
                  setTab("github");
                }}
              >
                Import
              </Primary>
              <Ghost onClick={onClose}>Later</Ghost>
            </div>
          </div>
        )}

        {tab === "github" && (
          <div>
            <p className="mb-3 text-[13px] text-[var(--muted)]">
              A fine-grained token unlocks private repositories for this account.
            </p>
            <Field label="Fine-grained token" type="password" value={token} onChange={setToken} placeholder="ghp_…" />
            <div className="mt-4 flex gap-2">
              <Primary
                onClick={() => {
                  completeOnboarding("github");
                  notice(token.trim() ? "GitHub connected." : "Public projects only.");
                  onClose();
                }}
              >
                Connect
              </Primary>
              <Ghost onClick={onClose}>Cancel</Ghost>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
