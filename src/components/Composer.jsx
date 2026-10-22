import { useRef, useState } from "react";
import { Icon } from "./Icons.jsx";
import { useAppState } from "../AppState.jsx";

const MODELS = ["qwen2.5:14b", "qwen2.5:7b", "llama3.1:8b"];
const MODES = [
  { id: "agent", label: "Agent", short: "Ag" },
  { id: "ask", label: "Ask", short: "Ask" },
  { id: "plan", label: "Plan", short: "Pl" },
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
  onOpenSettings,
}) {
  const { model, setModel, mode, setMode } = useAppState();
  const [open, setOpen] = useState(false);
  const fileRef = useRef(null);

  return (
    <div className="px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-1.5 md:px-8 md:pb-3">
      <div className="frost-input composer-shadow mx-auto max-w-[820px] rounded-[16px] border border-[var(--stroke)] px-3 pb-2 pt-3 md:px-4 md:pb-2.5 md:pt-3.5">
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
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && window.innerWidth >= 768) {
              event.preventDefault();
              onSend();
            }
          }}
          rows={1}
          placeholder={mode === "ask" ? "Ask about this project…" : mode === "plan" ? "Describe what to plan…" : "Type a message here..."}
          className="min-h-[26px] w-full resize-none bg-transparent text-[16px] outline-none placeholder:text-[var(--faint)] md:text-[14px]"
        />
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 md:gap-2">
            <div className="flex overflow-hidden rounded-[9px] border border-[var(--stroke)]">
              {MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`h-8 px-2 text-[12px] md:h-[30px] md:px-2.5 ${
                    mode === item.id
                      ? item.id === "ask"
                        ? "bg-[color-mix(in_srgb,#7ea4d9_22%,transparent)] text-[#9ec0ea]"
                        : item.id === "plan"
                          ? "bg-[color-mix(in_srgb,var(--amber)_18%,transparent)] text-[var(--amber)]"
                          : "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--ink)] hover:bg-[var(--hover)]"
                  }`}
                >
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.short}</span>
                </button>
              ))}
            </div>
            <Pill onClick={onAutoPrompt} active={autoPrompt}>
              <span className="hidden sm:inline">Auto-Prompt{autoPrompt ? " · on" : ""}</span>
              <span className="sm:hidden">{autoPrompt ? "AP · on" : "AP"}</span>
            </Pill>
            <div className="relative">
              <Pill onClick={() => setOpen((value) => !value)}>
                {model.split(":")[0]}
                <Icon name="chevron" size={12} className="hidden opacity-70 sm:block" />
              </Pill>
              {open && (
                <div className="frost-panel absolute bottom-10 left-0 z-20 w-44 overflow-hidden rounded-xl border border-[var(--stroke)]">
                  {MODELS.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setModel(name);
                        setOpen(false);
                      }}
                      className="flex h-9 w-full items-center px-3 text-left text-[12px] hover:bg-[var(--hover)]"
                    >
                      {name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onOpenSettings();
                    }}
                    className="flex h-9 w-full items-center border-t border-[var(--stroke-soft)] px-3 text-left text-[12px] text-[var(--muted)] hover:bg-[var(--hover)]"
                  >
                    All models…
                  </button>
                </div>
              )}
            </div>
            <Pill className="hidden sm:flex" onClick={() => fileRef.current?.click()}>
              <Icon name="paperclip" size={14} />
              Attach
            </Pill>
            <Pill onClick={onFiles} className="hidden md:flex">
              <Icon name="folder" size={14} />
              Files
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
          <div className="flex shrink-0 items-center justify-end gap-2">
            <span className="hidden items-center gap-1.5 text-[11px] text-[var(--faint)] sm:flex">
              <span className="h-[18px] w-[18px] rounded-full border border-[var(--stroke)]" />
              0%
            </span>
            <button
              type="button"
              onClick={onSend}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg)] shadow-md md:h-[34px] md:w-[34px]"
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ children, onClick, active, className = "", tone }) {
  const toneClass =
    active && tone === "ask"
      ? "border-[#7ea4d9] bg-[color-mix(in_srgb,#7ea4d9_18%,transparent)] text-[#9ec0ea]"
      : active && tone === "plan"
        ? "border-[var(--amber)] bg-[color-mix(in_srgb,var(--amber)_16%,transparent)] text-[var(--amber)]"
        : "";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 items-center gap-1.5 rounded-[9px] border px-2 text-[12px] md:h-[30px] md:px-2.5 ${
        active
          ? toneClass || "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
          : "border-[var(--stroke)] text-[var(--ink)] hover:bg-[var(--hover)]"
      } ${className}`}
    >
      {children}
    </button>
  );
}
