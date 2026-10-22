import { useState } from "react";
import { useAppState } from "../AppState.jsx";

const THREADS = {
  farm: [
    {
      role: "user",
      text: "This Expo app should be testable without installing emulator packs.",
    },
    {
      role: "assistant",
      text: "Workspace looks like Expo. Use the Farm widget on this canvas: sign in with the Root wallet, start a cloud phone, then push an APK. Skip Android Studio and Xcode.",
      tools: [{ name: "palm_farm_status", detail: "farm-api.palmaierc.com ok · Expo workspace" }],
    },
  ],
  ops: [
    { role: "user", text: "Publish the landing page." },
    {
      role: "assistant",
      text: "PALM setup will build dist and upload it. Sign one Ops message — nothing is spent. The live domain lands on the card.",
      tools: [{ name: "ops.probe", detail: "landing.palmaierc.com ready" }],
    },
  ],
  wiki: [
    { role: "user", text: "Port the help wiki to useroot.sh." },
    {
      role: "assistant",
      text: "The /wiki route on useroot.sh already carries the help pages. Same PALM face as the rest of /root.",
    },
  ],
};

export default function ChatView({ sessionId, extras = [] }) {
  const showFarm = sessionId === "farm";
  const showOps = sessionId === "ops";
  const messages = [...(THREADS[sessionId] || []), ...extras];

  return (
    <div className="relative min-h-0 flex-1">
      <div className={`scroll-thin h-full overflow-y-auto px-4 py-5 md:px-8 md:py-6 ${showFarm || showOps ? "pt-4 md:pt-24" : ""}`}>
        <div className="mx-auto flex max-w-[820px] flex-col gap-3">
          {messages.map((message, index) => (
            <Bubble key={`${sessionId}-${index}`} message={message} />
          ))}
        </div>
      </div>
      {showFarm && <FarmWidget />}
      {showOps && <OpsWidget />}
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
      <div>{message.text}</div>
      {message.files?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {message.files.map((name) => (
            <span key={name} className="rounded-md border border-[var(--stroke)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
              {name}
            </span>
          ))}
        </div>
      )}
      {message.tools?.length > 0 && (
        <div className="mt-2 space-y-1">
          {message.tools.map((tool) => (
            <div key={tool.name} className="rounded-lg bg-[color-mix(in_srgb,var(--code)_70%,transparent)] px-2.5 py-1.5 text-[12px] text-[var(--muted)]">
              {tool.name} · {tool.detail}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function FarmWidget() {
  const { notice } = useAppState();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("Expo · cloud Android phone, no local emulator pack");

  return (
    <aside className="relative z-10 mx-4 mt-3 w-auto max-w-none fade-up md:absolute md:left-7 md:top-4 md:mx-0 md:mt-0 md:w-[320px] md:max-w-[calc(100%-2rem)]">
      <div className="frost-panel rounded-[16px] border border-[var(--stroke)] p-3.5">
        <div className="flex gap-2.5">
          <img src="/palm.png" alt="" className="mt-0.5 h-4 w-5 object-contain" />
          <div>
            <div className="text-[13px]">Expo · Farm</div>
            <div className="mt-0.5 text-[11px] leading-4 text-[var(--muted)]">{status}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip
            onClick={() => {
              setOpen(true);
              setStatus("Signed in. Start a phone to stream it here.");
              notice("Farm signed in.");
            }}
          >
            Sign in
          </Chip>
          {open && (
            <>
              <Chip
                onClick={() => {
                  setStatus("Starting phone1 — no local emulator pack.");
                  notice("Farm phone starting.");
                }}
              >
                Start phone
              </Chip>
              <Chip
                onClick={() => {
                  setStatus("Push an APK when you have a build.");
                  notice("APK push queued.");
                }}
              >
                Push APK
              </Chip>
              <Chip onClick={() => setOpen(false)}>Collapse</Chip>
            </>
          )}
        </div>
        {open && (
          <div className="mt-3 flex h-[220px] items-center justify-center rounded-[10px] border border-[var(--stroke)] bg-[var(--code)] text-[11px] text-[var(--faint)]">
            farm.palmaierc.com · noVNC
          </div>
        )}
      </div>
    </aside>
  );
}

function OpsWidget() {
  const { notice } = useAppState();
  const [status, setStatus] = useState("landing → live domain");
  return (
    <aside className="relative z-10 mx-4 mt-3 w-auto fade-up md:absolute md:left-7 md:top-4 md:mx-0 md:mt-0 md:w-[320px]">
      <div className="frost-panel rounded-[16px] border border-[var(--stroke)] p-3.5">
        <div className="flex gap-2.5">
          <img src="/palm.png" alt="" className="mt-0.5 h-4 w-5 object-contain" />
          <div>
            <div className="text-[13px]">PALM setup</div>
            <div className="mt-0.5 text-[11px] text-[var(--muted)]">{status}</div>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-[var(--faint)]">Frontend · wallet · upload dist · probe</div>
        <div className="mt-3">
          <Chip
            onClick={() => {
              setStatus("Signed · building dist · upload queued");
              notice("Ops start queued.");
            }}
          >
            Start
          </Chip>
        </div>
      </div>
    </aside>
  );
}

function Chip({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-[var(--stroke)] px-2.5 py-1 text-[12px] hover:bg-[var(--hover)]"
    >
      {children}
    </button>
  );
}
