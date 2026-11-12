import { useEffect, useRef, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { Icon } from "./Icons.jsx";
import { useAppState } from "../AppState.jsx";
import { PanelGrip, useLayout, Zone } from "../layout.jsx";
import { creditTitle, formatCredits } from "../glmChat.js";
const MODES = [
  { id: "agent", label: "Agent", icon: "bot" },
  { id: "ask", label: "Ask", icon: "chat" },
  { id: "plan", label: "Plan", icon: "list" },
];

export default function Composer({
  draft,
  setDraft,
  onSend,
  autoPrompt,
  onAutoPrompt,
  web = true,
  onWeb,
  attachments = [],
  onAttach,
  onRemoveAttach,
  onFiles,
  sending,
  usagePercent = 0,
  credit = null,
  turns = [],
  sessionTitle = "New Agent",
  projectLabel = "",
  archived = false,
  onNewChat,
  marketOn = false,
}) {
  const { mode, setMode } = useAppState();
  const { isConnected } = useAccount();
  const { open } = useAppKit();
  const { editing } = useLayout();
  const fileRef = useRef(null);
  const boxRef = useRef(null);
  const [more, setMore] = useState(false);

  const pool = [
    {
      id: "modes",
      label: "Mode switch",
      home: "composer",
      className: "shrink-0",
      node: (
        <div data-tour="modes" className="flex shrink-0 overflow-hidden rounded-[9px] border border-[var(--stroke)]">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => setMode(item.id)}
              className={`flex h-8 items-center gap-1 px-2 text-[12px] md:h-[30px] md:px-2.5 ${
                mode === item.id
                  ? item.id === "ask"
                    ? "bg-[color-mix(in_srgb,#7ea4d9_22%,transparent)] text-[#9ec0ea]"
                    : item.id === "plan"
                      ? "bg-[color-mix(in_srgb,var(--amber)_18%,transparent)] text-[var(--amber)]"
                      : "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-[var(--ink)] hover:bg-[var(--hover)]"
              }`}
            >
              <Icon name={item.icon} size={14} />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "autoprompt",
      label: "Auto-Prompt",
      home: "composer",
      className: "shrink-0",
      node: (
        <Pill tour="autoprompt" onClick={onAutoPrompt} active={autoPrompt} title="Auto-Prompt">
          <Icon name="spark" size={14} />
          <span className="hidden sm:inline">Auto-Prompt{autoPrompt ? " · on" : ""}</span>
        </Pill>
      ),
    },
    {
      id: "web",
      label: "Web",
      home: "composer",
      className: "shrink-0",
      node: (
        <Pill tour="web" onClick={onWeb} active={web} title={web ? "Web access is on: Hamrin can search and read pages" : "Web access is off"}>
          <Icon name="globe" size={14} />
          <span className="hidden sm:inline">Web{web ? " · on" : ""}</span>
        </Pill>
      ),
    },
    ...(isConnected
      ? [
          {
            id: "model",
            label: "Model",
            home: "composer",
            className: "shrink-0",
            node: (
              <Pill tour="model" title="Hamrin 1.0">
                <Icon name="cloud" size={14} />
                <span className="hidden sm:inline">Hamrin 1.0</span>
              </Pill>
            ),
          },
        ]
      : []),
    {
      id: "attach",
      label: "Attach",
      home: "composer",
      className: "shrink-0",
      node: (
        <Pill tour="attach" title="Attach" onClick={() => fileRef.current?.click()}>
          <Icon name="paperclip" size={14} />
          <span className="hidden sm:inline">Attach</span>
        </Pill>
      ),
    },
    {
      id: "space",
      label: "Flexible space",
      home: "composer",
      locked: false,
      className: `min-w-[4px] flex-1 ${editing ? "min-w-[84px]" : ""}`,
      node: editing ? <span className="flex h-[30px] items-center px-2 text-[11px] text-[var(--faint)]">↔ space</span> : <span />,
    },
    {
      id: "meters",
      label: "Meters",
      home: "composer",
      className: "shrink-0",
      node: (
        <span data-tour="meters" className="flex items-center gap-2">
          <ContextMeter percent={usagePercent} />
          <CreditMeter credit={credit} />
        </span>
      ),
    },
    {
      id: "json",
      label: "JSON export",
      home: "composer",
      className: "hidden shrink-0 md:block",
      node: (
        <button
          type="button"
          data-tour="json"
          title="Download this chat as JSON"
          onClick={() => downloadChatJson({ turns, sessionTitle, projectLabel, mode, usagePercent, credit })}
          className="flex h-8 items-center gap-1 rounded-[9px] border border-[var(--stroke)] px-2 text-[11px] text-[var(--ink)] hover:bg-[var(--hover)] md:h-[30px]"
        >
          <Icon name="download" size={13} />
          JSON
        </button>
      ),
    },
  ];
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${Math.min(box.scrollHeight, 180)}px`;
  }, [draft]);
  const submit = () => {
    if (!isConnected) {
      open({ view: "Connect" });
      return;
    }
    if (!sending) onSend();
  };

  if (archived) {
    return (
      <div className="px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-1.5 md:px-8 md:pb-3">
      <PanelGrip panel="composer" className="absolute right-6 top-[-4px]" />
        <div
          data-tour="composer"
          className="frost-input composer-shadow mx-auto flex max-w-[820px] flex-col gap-3 rounded-[16px] border border-[var(--stroke)] px-4 py-3.5 sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[13.5px] text-[var(--ink)]">
              <span className="rounded border border-[var(--stroke)] px-1.5 py-px text-[10px] uppercase tracking-wide text-[var(--muted)]">Archived</span>
              This chat is full.
            </div>
            <p className="mt-1 text-[12px] leading-5 text-[var(--muted)]">
              Its context window is used up, so it no longer accepts messages. You can still read it and download it. Start a new chat to keep going.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => downloadChatJson({ turns, sessionTitle, projectLabel, mode, usagePercent, credit })}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--stroke)] px-3 text-[12.5px] text-[var(--ink)] hover:bg-[var(--hover)]"
            >
              <Icon name="download" size={13} />
              JSON
            </button>
            <button
              type="button"
              onClick={onNewChat}
              className="h-9 rounded-lg bg-[var(--accent)] px-4 text-[13px] text-[var(--bg)]"
            >
              Start a new chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-1.5 md:px-8 md:pb-3">
      <PanelGrip panel="composer" className="absolute right-6 top-[-4px]" />
      <div data-tour="composer" className="frost-input composer-shadow mx-auto max-w-[820px] rounded-[16px] border border-[var(--stroke)] px-3 pb-2 pt-3 md:px-4 md:pb-2.5 md:pt-3.5">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {attachments.map((file) => (
              <button
                key={file.name}
                type="button"
                onClick={() => onRemoveAttach?.(file.name)}
                className="rounded-md border border-[var(--stroke)] px-2 py-1 text-[11px] text-[var(--muted)] hover:text-[var(--ink)]"
              >
                {file.name} ×
              </button>
            ))}
          </div>
        )}
        <textarea
          ref={boxRef}
          data-tour="prompt"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && window.innerWidth >= 768) {
              event.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={
            isConnected
              ? marketOn
                ? "Ask about a pair, a print, or PALM…"
                : mode === "ask"
                  ? "Ask about this project…"
                  : mode === "plan"
                    ? "Describe what to plan…"
                    : "Type a message here..."
              : "Connect a wallet to use Hamrin 1.0"
          }
          className="min-h-[26px] w-full resize-none bg-transparent text-[16px] outline-none placeholder:text-[var(--faint)] md:text-[14px]"
        />
        <div className="mt-2 flex items-center gap-2">
          <Zone
            zone="composer"
            group="composer"
            dir="h"
            pool={pool}
            className={`flex min-w-0 flex-1 items-center gap-1.5 md:gap-2 ${editing ? "flex-wrap py-1" : "scroll-thin overflow-x-auto"}`}
          />
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              onAttach?.(Array.from(event.target.files || []).map((file) => ({ name: file.name, size: file.size })));
              event.target.value = "";
            }}
          />
          <div className="relative flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--stroke)] text-[var(--ink)] md:hidden"
              aria-label="Composer controls"
              onClick={() => setMore((value) => !value)}
            >
              <Icon name="dots" size={16} />
            </button>
            {more && (
              <div className="absolute bottom-[calc(100%+8px)] right-0 z-30 w-[220px] rounded-[14px] border border-[var(--stroke)] bg-[var(--panel)] p-1.5 md:hidden">
                <button type="button" className="flex h-11 w-full items-center rounded-[10px] px-3 text-left text-[13.5px] hover:bg-[var(--hover)]" onClick={() => { onAutoPrompt?.(); setMore(false); }}>
                  Auto-Prompt {autoPrompt ? "· on" : "· off"}
                </button>
                <button type="button" className="flex h-11 w-full items-center rounded-[10px] px-3 text-left text-[13.5px] hover:bg-[var(--hover)]" onClick={() => { onWeb?.(); setMore(false); }}>
                  Web {web ? "· on" : "· off"}
                </button>
                <button
                  type="button"
                  className="flex h-11 w-full items-center rounded-[10px] px-3 text-left text-[13.5px] hover:bg-[var(--hover)]"
                  onClick={() => {
                    downloadChatJson({ turns, sessionTitle, projectLabel, mode, usagePercent, credit });
                    setMore(false);
                  }}
                >
                  Download JSON
                </button>
              </div>
            )}
            <button
              type="button"
              data-tour="send"
              onClick={submit}
              disabled={sending}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg)] disabled:opacity-50 md:h-[34px] md:w-[34px]"
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ children, onClick, active, className = "", tone, title, tour }) {
  const toneClass =
    active && tone === "ask"
      ? "border-[#7ea4d9] bg-[color-mix(in_srgb,#7ea4d9_18%,transparent)] text-[#9ec0ea]"
      : active && tone === "plan"
        ? "border-[var(--amber)] bg-[color-mix(in_srgb,var(--amber)_16%,transparent)] text-[var(--amber)]"
        : "";
  return (
    <button
      type="button"
      title={title}
      data-tour={tour}
      onClick={onClick}
      className={`flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] border px-2 text-[12px] md:h-[30px] md:px-2.5 ${
        active
          ? toneClass || "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
          : "border-[var(--stroke)] text-[var(--ink)] hover:bg-[var(--hover)]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

const CONTEXT_WINDOW = 8192;

function Ring({ percent, title, label }) {
  const used = Math.min(100, Math.max(0, Math.round(percent) || 0));
  return (
    <span title={title} className="flex items-center gap-1.5 text-[11px] text-[var(--faint)]">
      <span
        className="h-[18px] w-[18px] rounded-full border border-[var(--stroke)]"
        style={{ background: `conic-gradient(var(--accent) ${used}%, transparent 0)` }}
      />
      <span className="tabular-nums">{label}</span>
    </span>
  );
}

function ContextMeter({ percent }) {
  const used = Math.min(100, Math.max(0, Math.round(percent) || 0));
  const tokens = Math.round((used / 100) * CONTEXT_WINDOW);
  return (
    <Ring
      percent={used}
      label={used + "%"}
      title={`Context window · about ${tokens.toLocaleString()} of ${CONTEXT_WINDOW.toLocaleString()} tokens`}
    />
  );
}

function CreditMeter({ credit }) {
  const metered = credit && Number.isFinite(credit.allowance);
  if (!metered) return null;
  const percent = credit.allowance > 0 ? Math.min(100, Math.round((credit.used / credit.allowance) * 100)) : 100;
  return <Ring percent={percent} label={formatCredits(credit.remaining) + " cr"} title={creditTitle(credit)} />;
}

function downloadChatJson({ turns, sessionTitle, projectLabel, mode, usagePercent, credit }) {
  const messages = (turns || [])
    .filter((turn) => turn && (turn.text || turn.think || turn.pending))
    .map((turn) => ({
      role: turn.role || "assistant",
      text: turn.text || "",
      think: turn.think || "",
      pending: !!turn.pending,
      files: turn.files || [],
    }));
  const used = Math.min(100, Math.max(0, Math.round(usagePercent) || 0));
  const payload = {
    title: sessionTitle || "New Agent",
    project: projectLabel || "",
    model: "hamrin-1.0",
    mode: mode || "agent",
    exportedAt: new Date().toISOString(),
    context: {
      window: CONTEXT_WINDOW,
      percent: used,
      tokens: Math.round((used / 100) * CONTEXT_WINDOW),
    },
    credit: credit
      ? {
          remaining: credit.remaining,
          allowance: credit.allowance,
          used: credit.used,
          held: credit.held,
          staked: credit.staked,
          palmPerCredit: credit.palmPerCredit,
          resetsAt: credit.resetsAt,
        }
      : null,
    messages,
  };
  const slug = String(payload.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "chat";
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = slug + ".json";
  link.click();
  URL.revokeObjectURL(url);
}
