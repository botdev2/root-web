import { useState } from "react";
import { Icon } from "./Icons.jsx";
import { useAppState } from "../AppState.jsx";
import AddProjectMenu from "./AddProjectMenu.jsx";

const NAV = [
  { id: "home", label: "New Agent" },
  { id: "automations", label: "Automations" },
  { id: "reasoning", label: "Reasoning" },
  { id: "ops", label: "Ops" },
  { id: "plugins", label: "Plugins" },
  { id: "notes", label: "Notes" },
];

function shortWhen(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const FOOTER = [
  { id: "updates", label: "Updates" },
  { id: "account", label: "Account" },
  { id: "settings", label: "Settings" },
  { id: "telemetry", label: "Telemetry" },
];

export default function Sidebar({
  view,
  sessionId,
  onView,
  onSession,
  onSearch,
  onNewChat,
  onNavigate,
  onConnect,
  onAddProject,
  cloudSessions = [],
  convoMax = 10,
  walletReady = false,
  listedProjects,
  listedProjectId,
  onPickProject,
  opsToken = "",
  onOpsToken,
  onCreateProject,
}) {
  const state = useAppState();
  const { onboarding, doneCount, dismissOnboarding } = state;
  const projects = listedProjects ?? [];
  const projectId = listedProjectId || "";
  const [addOpen, setAddOpen] = useState(false);
  const pickProject = (id) => {
    if (onPickProject) onPickProject(id);
  };
  const [expanded, setExpanded] = useState({ [projectId]: true });

  const go = (fn) => {
    fn();
    onNavigate?.();
  };

  const nextLabel = !onboarding.skills ? "Bridge Skills" : !onboarding.repos ? "Connect a project" : "Connect GitHub";

  return (
    <aside className="frost flex h-full w-[min(248px,86vw)] shrink-0 flex-col border-r border-[var(--stroke)]">
      <div className="flex items-center justify-between px-3.5 pb-1 pt-3.5">
        <button
          type="button"
          onClick={() => go(onSearch)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--hover)]"
          title="Search"
        >
          <Icon name="search" size={16} />
        </button>
        <span className="pr-1 text-[12px] text-[var(--faint)] md:hidden">/root</span>
      </div>

      <div className="px-3.5">
        {NAV.map((item) => (
          <NavButton
            key={item.id}
            active={item.id === "home" ? view === "home" : view === item.id}
            onClick={() => go(() => (item.id === "home" ? onNewChat() : onView(item.id)))}
          >
            {item.label}
          </NavButton>
        ))}

        <button
          type="button"
          onClick={() => {
            if (!projects.length) return;
            const next = projects[(projects.findIndex((item) => item.id === projectId) + 1) % projects.length];
            if (!next) return;
            pickProject(next.id);
            setExpanded((prev) => ({ ...prev, [next.id]: true }));
          }}
          className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-[var(--stroke)] bg-[var(--panel)] px-3 py-2 text-left"
        >
          <Icon name="folder" size={16} className="text-[var(--accent)]" />
          <span className="min-w-0">
            <div className="text-[10.5px] text-[var(--faint)]">Project</div>
            <div className="truncate text-[12.5px]">{projects.find((item) => item.id === projectId)?.label || "No repositories yet"}</div>
          </span>
        </button>
      </div>

      <div className="scroll-thin mt-1 min-h-0 flex-1 overflow-y-auto px-3.5">
        <div className="relative mb-1 flex items-center justify-between px-2 pt-3">
          <span className="flex items-center gap-2 text-[12px] text-[var(--faint)]">
            Projects
            {walletReady && <span className="text-[11px]">{Math.min(cloudSessions.length, convoMax)}/{convoMax} chats</span>}
          </span>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex h-7 w-7 items-center justify-center text-[16px] text-[var(--muted)] hover:text-[var(--ink)]"
          >
            +
          </button>
          <AddProjectMenu
            open={addOpen}
            token={opsToken}
            onToken={onOpsToken}
            onCreate={onCreateProject}
            onTemplates={() => onAddProject?.()}
            onClose={() => setAddOpen(false)}
          />
        </div>
        {projects.length === 0 && (
          <div className="px-2 py-2 text-[12.5px] text-[var(--muted)]">No repositories yet.</div>
        )}
        {projects.map((project) => {
          const open = expanded[project.id];
          const active = project.id === projectId;
          const sessions = walletReady ? cloudSessions.filter((item) => item.projectId === project.id) : [];
          return (
            <div key={project.id} className="mb-0.5">
              <div className={`flex h-10 w-full items-center rounded-[10px] pr-1 ${active ? "bg-[var(--sidebar-sel)]" : ""}`}>
                <button
                  type="button"
                  onClick={() => {
                    pickProject(project.id);
                    setExpanded((prev) => ({ ...prev, [project.id]: !prev[project.id] }));
                  }}
                  className="flex h-10 min-w-0 flex-1 items-center rounded-[10px] px-2 text-left hover:bg-[var(--hover)]"
                >
                  <span className="mr-1.5 text-[11px] text-[var(--faint)]">{open ? "▾" : "▸"}</span>
                  <Icon name="folder" size={15} className="text-[var(--muted)]" />
                  <span className="title-fade ml-2 min-w-0 flex-1 truncate text-[12.5px]">{project.label}</span>
                  <span className="ml-2 text-[11px] text-[var(--faint)]">{sessions.length}</span>
                </button>
                {project.href && (
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 px-1.5 text-[11px] text-[var(--muted)] underline"
                  >
                    Hub
                  </a>
                )}
              </div>
              {open &&
                sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() =>
                      go(() => {
                        pickProject(project.id);
                        onSession(session.id, session.title, project.id);
                      })
                    }
                    className={`ml-[18px] mb-0.5 flex h-10 w-[calc(100%-18px)] items-center rounded-[10px] px-2.5 text-left ${
                      view === "chat" && sessionId === session.id ? "bg-[var(--sidebar-sel)]" : "hover:bg-[var(--hover)]"
                    }`}
                  >
                    <Icon name="chat" size={13} className="text-[var(--muted)]" />
                    <span className="title-fade ml-2 min-w-0 flex-1 truncate text-[12.5px]">{session.title}</span>
                    <span className="ml-2 text-[10px] text-[var(--faint)]">{shortWhen(session.updatedAt)}</span>
                  </button>
                ))}
            </div>
          );
        })}
        {walletReady &&
          cloudSessions
            .filter((session) => session.projectId !== "__avatar__" && !projects.some((item) => item.id === session.projectId))
            .map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => go(() => onSession(session.id, session.title))}
                className={`mb-0.5 flex h-10 w-full items-center rounded-[10px] px-2.5 text-left ${
                  view === "chat" && sessionId === session.id ? "bg-[var(--sidebar-sel)]" : "hover:bg-[var(--hover)]"
                }`}
              >
                <Icon name="chat" size={13} className="text-[var(--muted)]" />
                <span className="title-fade ml-2 min-w-0 flex-1 truncate text-[12.5px]">{session.title}</span>
                <span className="ml-2 text-[10px] text-[var(--faint)]">{shortWhen(session.updatedAt)}</span>
              </button>
            ))}
      </div>

      <div className="px-3.5 pb-[max(14px,env(safe-area-inset-bottom))] pt-1.5">
        <div className="mx-1 mb-2 h-px bg-[var(--stroke-soft)]" />
        {onboarding.visible && doneCount < 3 && (
          <div className="mb-2.5 border border-[var(--stroke)] bg-[var(--panel)] px-3 py-3">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[12px] text-[var(--muted)]">Getting Started</span>
              <span className="flex items-center gap-1.5 text-[11px] text-[var(--faint)]">
                {doneCount}/3
                <span className="relative h-4 w-4">
                  <span className="absolute inset-0 rounded-full border border-[var(--stroke)]" />
                  <span
                    className="absolute inset-[3px] rounded-full border-2 border-[var(--accent)]"
                    style={{ borderLeftColor: doneCount ? "var(--accent)" : "transparent" }}
                  />
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => go(() => onConnect?.())}
              className="flex h-10 w-full items-center justify-center gap-2 border border-[var(--stroke)] bg-[var(--input)] text-[13px]"
            >
              <Icon name="folder" size={15} />
              {nextLabel}
            </button>
            <div className="mt-2 flex items-center justify-between">
              <button type="button" onClick={() => go(() => onView("help"))} className="text-[11px] text-[var(--faint)] underline">
                Need help?
              </button>
              <button type="button" onClick={dismissOnboarding} className="flex h-8 w-8 items-center justify-center text-[var(--faint)]">
                <Icon name="x" size={11} />
              </button>
            </div>
          </div>
        )}
        {FOOTER.map((item) => (
          <NavButton key={item.id} active={view === item.id} onClick={() => go(() => onView(item.id))}>
            {item.label}
          </NavButton>
        ))}
      </div>
    </aside>
  );
}

function NavButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-1 flex h-10 w-full items-center rounded-[14px] px-2 text-left text-[13px] ${
        active ? "bg-[var(--sidebar-sel)]" : "hover:bg-[var(--hover)]"
      }`}
    >
      {children}
    </button>
  );
}
