import { Icon } from "./Icons.jsx";
import { useAppState } from "../AppState.jsx";
import { creditTitle, formatCredits, PALM_PER_CREDIT } from "../glmChat.js";
import WalletButton from "./WalletButton.jsx";

const HEADERS = {
  home: { title: "New Agent" },
  chat: { title: "New Agent" },
  automations: { title: "Automations", subtitle: "Scheduled helpers for this project" },
  reasoning: { title: "Reasoning", subtitle: "Intake to Output — click a node" },
  ops: { title: "PALM Ops", subtitle: "Hosting, domains, and Ops Hub" },
  plugins: { title: "Plugins", subtitle: "Hosting, domains, and Ops Hub" },
  notes: { title: "Notes", subtitle: "Daily goals and markdown" },
  settings: { title: "Settings", subtitle: "Appearance, models, privacy" },
  templates: { title: "Create from Template", subtitle: "Scaffold a project, then refine with Auto-Prompt" },
  account: { title: "Account", subtitle: "Access, skills, profile" },
  updates: { title: "Updates", subtitle: "App version and channel" },
  telemetry: { title: "Telemetry", subtitle: "Tracker and network security" },
  help: { title: "Help", subtitle: "How /root works on the web" },
  editor: { title: "Editor", subtitle: "Project text editor" },
  history: { title: "Run history", subtitle: "Automation runs for this project" },
};

export default function HeaderBar({
  view,
  sessionTitle,
  onHelp,
  onFiles,
  onClear,
  filesOpen,
  avatarOn,
  onAvatar,
  onMenu,
  onUnlock,
  project: liveProject,
  credit = null,
}) {
  const { signedIn } = useAppState();
  const header = HEADERS[view] || HEADERS.home;
  const title =
    view === "chat" && sessionTitle ? sessionTitle : view === "editor" && sessionTitle ? sessionTitle : header.title;
  const subtitle = header.subtitle || (liveProject ? liveProject.label : "Create a repository on the Ops Hub");
  const rate = Number(credit?.palmPerCredit) || PALM_PER_CREDIT;

  return (
    <header data-tour="header" className="frost-header flex min-h-[52px] shrink-0 items-center gap-2 border-b border-[var(--stroke-soft)] px-3 pt-[env(safe-area-inset-top)] md:px-7">
      <button
        type="button"
        onClick={onMenu}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--ink)] hover:bg-[var(--hover)] md:hidden"
        aria-label="Open menu"
      >
        <Icon name="menu" size={18} />
      </button>
      <img src="/palm.png" alt="" className="h-6 w-6 shrink-0 object-contain md:hidden" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] text-[var(--ink)]">{title}</div>
        <div className="truncate text-[11.5px] text-[var(--faint)]">
          {header.subtitle ? (
            subtitle
          ) : liveProject?.href ? (
            <a href={liveProject.href} target="_blank" rel="noreferrer" className="underline">
              {liveProject.label} on Ops Hub
            </a>
          ) : (
            subtitle
          )}
        </div>
      </div>
      {credit && Number.isFinite(credit.allowance) ? (
        <div
          data-tour="credits"
          title={creditTitle(credit)}
          className="flex shrink-0 flex-col items-end leading-tight rounded-lg border border-[var(--stroke)] bg-[var(--panel)] px-2.5 py-1"
        >
          <div className="tabular-nums text-[13px] text-[var(--ink)]">
            {formatCredits(credit.remaining)}
            <span className="ml-1 text-[11px] text-[var(--faint)]">credits</span>
          </div>
          <div className="text-[10px] text-[var(--faint)]">
            {rate.toLocaleString()} $PALM = 1 credit
          </div>
        </div>
      ) : null}
      <span data-tour="wallet" className="inline-flex shrink-0">
        <WalletButton className="shrink-0" />
      </span>
      {!signedIn && (
        <Ghost onClick={onUnlock}>Unlock</Ghost>
      )}
      <div className="hidden shrink-0 items-center gap-0.5 sm:flex">
        <Ghost onClick={onAvatar} active={avatarOn}>
          Avatar
        </Ghost>
        <Ghost onClick={onHelp}>Help</Ghost>
        <Ghost onClick={onFiles} active={filesOpen}>
          Files
        </Ghost>
        <Ghost onClick={onClear}>Clear</Ghost>
      </div>
      <button
        type="button"
        onClick={onFiles}
        className={`flex h-10 w-10 items-center justify-center rounded-lg sm:hidden ${
          filesOpen ? "bg-[var(--sidebar-sel)]" : "hover:bg-[var(--hover)]"
        }`}
        aria-label="Files"
      >
        <Icon name="folder" size={16} />
      </button>
    </header>
  );
}

function Ghost({ children, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[30px] rounded-lg px-2.5 text-[12.5px] ${
        active ? "bg-[var(--sidebar-sel)] text-[var(--ink)]" : "text-[var(--ink)] hover:bg-[var(--hover)]"
      }`}
    >
      {children}
    </button>
  );
}
