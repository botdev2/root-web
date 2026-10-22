import { useEffect, useState } from "react";
import { useAppState } from "../AppState.jsx";
import { Icon } from "./Icons.jsx";

const ACCOUNT = "https://useroot.sh/account";

const FEATURES = [
  { icon: "spark", title: "Agent", body: "Ask, Plan, or Agent — Auto-Prompt writes the brief." },
  { icon: "globe", title: "Farm", body: "Cloud Android phones. No local emulator pack." },
  { icon: "folder", title: "Ops", body: "Anonymous hosting. One wallet signature." },
  { icon: "play", title: "Crawler", body: "Record, replay, OTP, scrape — then ship." },
];

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
    <div className="gate-veil absolute inset-0 z-50 flex items-center justify-center px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="gate-card fade-up w-[min(920px,96vw)] max-h-[min(94dvh,820px)] overflow-y-auto scroll-thin">
        <div className="gate-hero" />
        <div className="gate-sheen" />
        <div className="relative grid gap-8 p-6 pt-5 md:grid-cols-[1.15fr_0.85fr] md:gap-10 md:p-10 md:pt-7">
          <div>
            <div className="flex items-center gap-3">
              <div className="gate-orb">
                <img src="/palm.png" alt="" className="h-8 w-8 object-contain" />
              </div>
              <div>
                <div className="text-[15px] tracking-wide">/root</div>
                <div className="text-[11px] text-[var(--faint)]">useroot.sh · web</div>
              </div>
            </div>

            <h1 className="gate-title mt-7 text-[34px] leading-none md:text-[44px]">Unlock the harness</h1>
            <p className="mt-4 max-w-[34ch] text-[15px] leading-6 text-[var(--muted)]">
              Agentic coding on your GitHub projects. Farm for phones, Ops for domains, Crawler for the
              browser — one Root Account opens the session.
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <button type="button" onClick={openAccount} className="gate-cta">
                Create account on useroot.sh
              </button>
              {opened && (
                <button
                  type="button"
                  disabled={!ready}
                  onClick={() => signIn({ name: "you", source: "useroot.sh/account" })}
                  className={`h-11 rounded-full border px-5 text-[13px] transition ${
                    ready
                      ? "border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--hover)]"
                      : "border-[var(--stroke)] text-[var(--faint)]"
                  }`}
                >
                  {ready ? "Continue into /root" : "Waiting for account…"}
                </button>
              )}
            </div>
            <div className="mt-3 text-[11.5px] text-[var(--faint)]">
              Lifetime unlock · wallet optional · card or crypto
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 content-start">
            {FEATURES.map((item) => (
              <div key={item.title} className="gate-tile">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--stroke)] bg-[color-mix(in_srgb,var(--panel)_50%,transparent)] text-[var(--accent)]">
                  <Icon name={item.icon} size={15} />
                </div>
                <div className="text-[13.5px]">{item.title}</div>
                <div className="mt-1 text-[11.5px] leading-4 text-[var(--muted)]">{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
