import { useEffect, useRef } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { Icon } from "./Icons.jsx";
import { useAppState } from "../AppState.jsx";
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
}) {
  const { mode, setMode } = useAppState();
  const { isConnected } = useAccount();
  const { open } = useAppKit();
  const fileRef = useRef(null);
  const boxRef = useRef(null);
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

  return (
    <div className="px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-1.5 md:px-8 md:pb-3">
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
          placeholder={isConnected ? (mode === "ask" ? "Ask about this project…" : mode === "plan" ? "Describe what to plan…" : "Type a message here...") : "Connect a wallet to use GLM 5.2 cloud"}
          className="min-h-[26px] w-full resize-none bg-transparent text-[16px] outline-none placeholder:text-[var(--faint)] md:text-[14px]"
        />
        <div className="mt-2 flex items-center gap-2">
          <div className="scroll-thin flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto md:gap-2">
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
            <Pill tour="autoprompt" onClick={onAutoPrompt} active={autoPrompt} title="Auto-Prompt">
              <Icon name="spark" size={14} />
              <span className="hidden sm:inline">Auto-Prompt{autoPrompt ? " · on" : ""}</span>
            </Pill>
            {isConnected && (
              <Pill tour="model" title="GLM 5.2 cloud">
                <Icon name="cloud" size={14} />
                <span className="hidden sm:inline">GLM 5.2 cloud</span>
              </Pill>
            )}
            <Pill tour="attach" title="Attach" onClick={() => fileRef.current?.click()}>
              <Icon name="paperclip" size={14} />
              <span className="hidden sm:inline">Attach</span>
            </Pill>
            <Pill tour="files" onClick={onFiles} title="Files">
              <Icon name="folder" size={14} />
              <span className="hidden md:inline">Files</span>
            </Pill>
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
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span data-tour="meters" className="flex items-center gap-2">
              <ContextMeter percent={usagePercent} />
              <CreditMeter credit={credit} />
            </span>
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
            <button
              type="button"
              data-tour="send"
              onClick={submit}
              disabled={sending}
              aria-label="Send"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg)] disabled:opacity-50 md:h-[34px] md:w-[34px]"
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
    model: "glm-5.2",
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
