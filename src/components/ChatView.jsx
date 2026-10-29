import { markdownHtml } from "../markdown.js";
import { presentTurn } from "../agentRun.js";
import { useAppState } from "../AppState.jsx";
import { PlanCard, ReasonTrail, planSteps } from "./ReasonTrail.jsx";

export default function ChatView({ sessionId, extras = [] }) {
  const messages = extras.map(presentTurn).filter(Boolean);

  return (
    <div className="relative min-h-0 flex-1">
      <div className="scroll-thin h-full overflow-y-auto px-4 py-5 md:px-8 md:py-6">
        <div className="mx-auto flex max-w-[820px] flex-col gap-3">
          {messages.map((message, index) => (
            <Bubble key={`${sessionId}-${index}`} message={message} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Bubble({ message }) {
  const { notice } = useAppState();
  const isUser = message.role === "user";
  return (
    <article
      className={`fade-up max-w-[88%] rounded-[14px] border px-4 py-3 text-[14px] leading-6 ${
        isUser
          ? "ml-auto border-[var(--stroke-soft)] bg-[color-mix(in_srgb,var(--bubble)_70%,transparent)]"
          : "border-[var(--stroke-soft)] bg-[color-mix(in_srgb,var(--panel)_74%,transparent)]"
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-3 text-[10.5px] uppercase tracking-wide text-[var(--faint)]">
        <span>{isUser ? "You" : "Agent"}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(message.text || "");
            notice("Copied.");
          }}
          className="normal-case tracking-normal hover:text-[var(--ink)]"
        >
          Copy
        </button>
      </div>
      <div>
        {message.trace?.length > 0 && (
          <ReasonTrail steps={message.trace} startedAt={message.startedAt} elapsedMs={message.elapsedMs} pending={!!message.pending} />
        )}
        {!message.trace?.length && message.think && (
          <details className="mb-2 text-[12px] text-[var(--muted)]">
            <summary className="cursor-pointer">Thinking</summary>
            <div className="mt-1 whitespace-pre-wrap">{message.think}</div>
          </details>
        )}
        {!message.pending && message.text && <div className="chat-md" dangerouslySetInnerHTML={{ __html: markdownHtml(message.text) }} />}
        {!message.pending && message.mode === "plan" && <PlanCard steps={planSteps(message.text)} />}
      </div>
      {message.files?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {message.files.map((name) => (
            <span key={name} className="rounded-md border border-[var(--stroke)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
              {name}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
