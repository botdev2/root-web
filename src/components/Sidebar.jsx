import { useEffect, useRef, useState } from "react";
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
  const delta = Date.now() - date.getTime();
  if (delta < 60_000) return "now";
  if (delta < 3_600_000) return Math.floor(delta / 60_000) + "m";
  if (delta < 86_400_000) return Math.floor(delta / 3_600_000) + "h";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function stamp(value) {
  if (!value) return 0;
  const text = String(value);
  const parsed = Date.parse(text.length === 10 ? `${text}T00:00:00` : text);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function byRecent(left, right) {
  return stamp(right.updatedAt) - stamp(left.updatedAt);
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
  avatarOn = false,
  onAvatar,
  busy = null,
}) {
  const state = useAppState();
  const { onboarding, doneCount, dismissOnboarding } = state;
  const source = listedProjects ?? [];
  const sessionsFor = (id) => (walletReady ? cloudSessions.filter((item) => item.projectId === id).sort(byRecent) : []);
  const projects = [...source].sort((left, right) => {
    const leftAt = Math.max(stamp(left.activityAt), ...sessionsFor(left.id).map((item) => stamp(item.updatedAt)), 0);
    const rightAt = Math.max(stamp(right.activityAt), ...sessionsFor(right.id).map((item) => stamp(item.updatedAt)), 0);
    if (rightAt !== leftAt) return rightAt - leftAt;
    return String(left.label || "").localeCompare(String(right.label || ""));
  });
  const projectId = listedProjectId || "";
  const [addOpen, setAddOpen] = useState(false);
  const listRef = useRef(null);
  const pickProject = (id) => {
    if (onPickProject) onPickProject(id);
  };
  const chats = walletReady
    ? cloudSessions.filter((item) => item.projectId !== "__avatar__").sort(byRecent)
    : [];
  const projectName = (id) => projects.find((item) => item.id === id)?.label || "Chat";

  useEffect(() => {
    const list = listRef.current;
    if (!sessionId || !list) return;
    const row = list.querySelector(`[data-chat="${sessionId}"]`);
    if (!row) return;
    const listBox = list.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    if (rowBox.top < listBox.top) list.scrollTop -= listBox.top - rowBox.top;
    else if (rowBox.bottom > listBox.bottom) list.scrollTop += rowBox.bottom - listBox.bottom;
  }, [sessionId, chats.length]);

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

      <div ref={listRef} className="scroll-thin mt-1 min-h-0 flex-1 overflow-y-auto px-3.5">
        <div className="mb-1 flex items-center justify-between px-2 pt-3">
          <span className="text-[12px] text-[var(--faint)]">Chats</span>
          {walletReady && <span className="text-[11px] text-[var(--faint)]">{Math.min(chats.length, convoMax)}/{convoMax}</span>}
        </div>
        {chats.length === 0 && (
          <div className="px-2 py-1.5 text-[12.5px] text-[var(--muted)]">{walletReady ? "No chats yet." : "Sign in to see chats."}</div>
        )}
        {chats.map((session) => {
          const active = view === "chat" && sessionId === session.id;
          return (
            <button
              key={session.id}
              type="button"
              data-chat={session.id}
              onClick={() =>
                go(() => {
                  if (session.projectId) pickProject(session.projectId);
                  onSession(session.id, session.title, session.projectId);
                })
              }
              className={`mb-0.5 flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left ${
                active ? "bg-[var(--sidebar-sel)]" : "hover:bg-[var(--hover)]"
              }`}
            >
              <Icon name="chat" size={14} className="shrink-0 text-[var(--muted)]" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="title-fade min-w-0 flex-1 truncate text-[13px]">{session.title}</span>
                  {busy?.sessionId === session.id && <LiveDot />}
                  <span className="shrink-0 text-[10px] text-[var(--faint)]">{shortWhen(session.updatedAt)}</span>
                </span>
                <span className="block truncate text-[11px] text-[var(--faint)]">{projectName(session.projectId)}</span>
              </span>
            </button>
          );
        })}
        <div className="relative mb-1 mt-3 flex items-center justify-between px-2 pt-1">
          <span className="text-[12px] text-[var(--faint)]">Projects</span>
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
          const active = project.id === projectId;
          const count = sessionsFor(project.id).length;
          const pending = busy?.projectId === project.id;
          return (
            <div key={project.id} className={`mb-0.5 flex h-10 w-full items-center rounded-[10px] pr-1 ${active ? "bg-[var(--sidebar-sel)]" : ""}`}>
              <button
                type="button"
                onClick={() => pickProject(project.id)}
                className="flex h-10 min-w-0 flex-1 items-center rounded-[10px] px-2 text-left hover:bg-[var(--hover)]"
              >
                <Icon name="folder" size={15} className="text-[var(--muted)]" />
                <span className="title-fade ml-2 min-w-0 flex-1 truncate text-[12.5px]">{project.label}</span>
                {pending && <LiveDot />}
                <span className="ml-2 text-[11px] text-[var(--faint)]">{count}</span>
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
          );
        })}
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
        <div className="sm:hidden">
          <NavButton active={avatarOn} onClick={() => go(() => onAvatar?.())}>
            Avatar
          </NavButton>
        </div>
      </div>
    </aside>
  );
}

function LiveDot() {
  return (
    <span className="relative ml-2 inline-flex h-2 w-2 shrink-0" aria-label="Working">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--amber)] opacity-70" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--amber)]" />
    </span>
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
