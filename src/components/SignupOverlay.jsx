import { useEffect, useState } from "react";
import { useAppState } from "../AppState.jsx";
import { Primary } from "./ui.jsx";

const ACCOUNT = "https://useroot.sh/account";

export default function SignupOverlay() {
  const { signIn } = useAppState();
  const [opened, setOpened] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!opened) return;
    const onFocus = () => setReady(true);
    window.addEventListener("focus", onFocus);
    const timer = window.setTimeout(() => setReady(true), 1200);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearTimeout(timer);
    };
  }, [opened]);

  const openAccount = () => {
    window.open(ACCOUNT, "_blank", "noopener,noreferrer");
    setOpened(true);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,#000_52%,transparent)] px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="frost-panel w-[min(560px,96vw)] max-h-[min(92dvh,760px)] overflow-y-auto rounded-2xl border border-[var(--stroke)] p-6 shadow-2xl md:p-8">
        <div className="flex items-center gap-2.5">
          <img src="/palm.png" alt="" className="h-8 w-8 object-contain" />
          <div>
            <div className="text-[15px]">/root</div>
            <div className="text-[11px] text-[var(--faint)]">useroot.sh</div>
          </div>
        </div>

        <h1 className="home-title mt-5 text-[26px] leading-8">Unlock the harness</h1>
        <p className="mt-3 text-[14px] leading-6 text-[var(--muted)]">
          /root is an agentic coding workspace. Chat against your GitHub projects, run tools, keep notes,
          schedule automations, and ship — Farm for cloud Android phones, Ops for anonymous hosting, Crawler
          for recorded browser flows.
        </p>
        <p className="mt-3 text-[14px] leading-6 text-[var(--muted)]">
          A Root Account is required. Create or unlock one at useroot.sh/account. Lifetime unlock, wallet
          optional, card or crypto. That account is the only way into this session.
        </p>

        <ul className="mt-5 space-y-2 text-[13px] text-[var(--ink)]">
          <li>Agent / Ask / Plan composer with Auto-Prompt</li>
          <li>PALM Farm · cloud phones, no local emulator pack</li>
          <li>PALM Ops · wallet signature, live domains</li>
          <li>Crawler, Reasoning, Automations, Plugins, Notes</li>
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Primary onClick={openAccount}>Create account on useroot.sh</Primary>
          {opened && (
            <button
              type="button"
              disabled={!ready}
              onClick={() => signIn({ name: "you", source: "useroot.sh/account" })}
              className={`h-9 rounded-lg border px-3.5 text-[12.5px] ${
                ready
                  ? "border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--hover)]"
                  : "border-[var(--stroke)] text-[var(--faint)]"
              }`}
            >
              {ready ? "Continue into /root" : "Waiting for useroot.sh/account…"}
            </button>
          )}
        </div>
        <div className="mt-3 text-[11px] text-[var(--faint)]">
          Opens {ACCOUNT.replace("https://", "")}. Come back here after you unlock.
        </div>
      </div>
    </div>
  );
}
