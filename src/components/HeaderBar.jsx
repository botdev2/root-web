import { useState } from "react";
import { Icon } from "./Icons.jsx";
import { useAppState } from "../AppState.jsx";
import { creditTitle, formatCredits, PALM_PER_CREDIT } from "../glmChat.js";
import WalletButton from "./WalletButton.jsx";
import { PanelGrip, useLayout, Zone } from "../layout.jsx";
import { APP_VERSION, publicIdUrl } from "../version.js";

const HEADERS = {
  home: { title: "New Agent" },
  chat: { title: "New Agent" },
  automations: { title: "Automations", subtitle: "Scheduled helpers for this project" },
  reasoning: { title: "Reasoning", subtitle: "Intake to Output — click a node" },
  ops: { title: "PALM Ops", subtitle: "Hosting, domains, and Ops Hub" },
  marketplace: { title: "Marketplace", subtitle: "WIP · wPALM mockups, same USD as PALM" },
  notes: { title: "Notes", subtitle: "Daily goals and markdown" },
  quests: { title: "Achievements", subtitle: "Daily challenges and achievements that earn Hamrin credits" },
  billing: { title: "Billing", subtitle: "Credits, $PALM, and when they reset" },
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
  onBilling,
  address = "",
}) {
  const { signedIn } = useAppState();
  const [more, setMore] = useState(false);
  const idHref = publicIdUrl(address);
  const header = HEADERS[view] || HEADERS.home;
  const title =
    view === "chat" && sessionTitle ? sessionTitle : view === "editor" && sessionTitle ? sessionTitle : header.title;
  const subtitle = header.subtitle || (liveProject ? liveProject.label : "Create a repository on the Ops Hub");
  const rate = Number(credit?.palmPerCredit) || PALM_PER_CREDIT;
  const { layout } = useLayout();
  const bottom = layout.header === "bottom";

  const pool = [
    ...(credit && Number.isFinite(credit.allowance)
      ? [
          {
            id: "credits",
            label: "Credits",
            home: "header",
            className: "shrink-0",
            node: (
              <button
                type="button"
                data-tour="credits"
                onClick={onBilling}
                title={creditTitle(credit) + " Click for billing."}
                className="flex shrink-0 flex-col items-end rounded-lg border border-[var(--stroke)] bg-[var(--panel)] px-2.5 py-1 text-right leading-tight hover:bg-[var(--hover)]"
              >
                <div className="tabular-nums text-[13px] text-[var(--ink)]">
                  {formatCredits(credit.remaining)}
                  <span className="ml-1 text-[11px] text-[var(--faint)]">credits</span>
                </div>
                <div className="text-[10px] text-[var(--faint)]">{rate.toLocaleString()} $PALM = 1 credit</div>
              </button>
            ),
          },
        ]
      : []),
    {
      id: "wallet",
      label: "Wallet",
      home: "header",
      locked: true,
      className: "shrink-0",
      node: (
        <span data-tour="wallet" className="inline-flex shrink-0">
          <WalletButton className="shrink-0" />
        </span>
      ),
    },
    ...(!signedIn ? [{ id: "unlock", label: "Unlock", home: "header", className: "shrink-0", node: <Ghost onClick={onUnlock}>Unlock</Ghost> }] : []),
    { id: "avatar", label: "Avatar", home: "header", className: "hidden shrink-0 sm:block", node: <Ghost onClick={onAvatar} active={avatarOn}>Avatar</Ghost> },
    { id: "help", label: "Help", home: "header", className: "hidden shrink-0 sm:block", node: <Ghost onClick={onHelp}>Help</Ghost> },
    { id: "files", label: "Files", home: "header", className: "hidden shrink-0 sm:block", node: <Ghost onClick={onFiles} active={filesOpen}>Files</Ghost> },
    { id: "clear", label: "Clear", home: "header", className: "hidden shrink-0 sm:block", node: <Ghost onClick={onClear}>Clear</Ghost> },
  ];

  return (
    <header
      data-tour="header"
      className={`frost-header relative flex min-h-[52px] shrink-0 items-center gap-2 border-[var(--stroke-soft)] px-3 md:px-7 ${
        bottom ? "order-last border-t pb-[env(safe-area-inset-bottom)]" : "border-b pt-[env(safe-area-inset-top)]"
      }`}
    >
      <PanelGrip panel="header" className={`absolute left-1/2 -translate-x-1/2 ${bottom ? "top-[-11px]" : "bottom-[-11px]"}`} />
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
      <Zone zone="header" group="header" dir="h" pool={pool} className="flex shrink-0 items-center gap-1.5" />
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
      <div className="relative sm:hidden">
        <button
          type="button"
          onClick={() => setMore((value) => !value)}
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${more ? "bg-[var(--sidebar-sel)]" : "hover:bg-[var(--hover)]"}`}
          aria-label="More"
          aria-expanded={more}
        >
          <Icon name="dots" size={16} />
        </button>
        {more && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-40 w-[220px] rounded-[14px] border border-[var(--stroke)] bg-[var(--panel)] p-1.5 shadow-[0_18px_40px_rgb(0_0_0_/_0.35)]">
            <MoreItem
              onClick={() => {
                setMore(false);
                onAvatar();
              }}
            >
              Avatar {avatarOn ? "· on" : ""}
            </MoreItem>
            <MoreItem
              onClick={() => {
                setMore(false);
                onHelp();
              }}
            >
              Help
            </MoreItem>
            <MoreItem
              onClick={() => {
                setMore(false);
                onClear();
              }}
            >
              Clear chat
            </MoreItem>
            {idHref && (
              <MoreItem
                onClick={() => {
                  setMore(false);
                  window.location.href = idHref;
                }}
              >
                Public PALM ID
              </MoreItem>
            )}
            <div className="px-3 py-2 text-[11px] text-[var(--faint)]">Web {APP_VERSION} · mobile</div>
          </div>
        )}
      </div>
    </header>
  );
}

function MoreItem({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex h-11 w-full items-center rounded-[10px] px-3 text-left text-[13.5px] hover:bg-[var(--hover)]">
      {children}
    </button>
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
