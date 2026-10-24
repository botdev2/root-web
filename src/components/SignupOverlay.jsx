import { useEffect } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";

const ACCOUNT = "https://useroot.sh/account";
const OPS = "https://ops.palmaierc.com";

const STACK = [
  { n: "01", title: "Hosting", body: "Ship a site from git or a zip. The wallet is the account." },
  { n: "02", title: "Domains", body: "Ops takes the name. You stay off the public record." },
  { n: "03", title: "Ops Hub", body: "Git owned by the address. No username to create." },
];

export default function SignupOverlay({ onClose }) {
  const { open } = useAppKit();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) onClose?.();
  }, [isConnected, onClose]);

  return (
    <div
      className="gate-veil absolute inset-0 z-50 flex items-center justify-center px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      onClick={onClose}
    >
      <div
        className="gate-card fade-up w-[min(920px,96vw)] max-h-[min(94dvh,820px)] overflow-y-auto scroll-thin"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="gate-hero" />
        <div className="gate-sheen" />
        <div className="relative grid gap-8 p-6 pt-5 md:grid-cols-[1.15fr_0.85fr] md:gap-10 md:p-10 md:pt-7">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="gate-orb">
                  <img src="/palm.png" alt="" className="h-8 w-8 object-contain" />
                </div>
                <div>
                  <div className="text-[15px] tracking-wide">/root</div>
                  <div className="text-[11px] text-[var(--faint)]">private AI harness</div>
                </div>
              </div>
              <button type="button" onClick={onClose} className="text-[12px] text-[var(--faint)] hover:text-[var(--ink)]">
                Browse
              </button>
            </div>

            <h1 className="gate-title mt-7 text-[34px] leading-none md:text-[44px]">Unlock /root</h1>
            <p className="mt-4 max-w-[42ch] text-[15px] leading-6 text-[var(--muted)]">
              This unlocks the current Web version of the private harness — on the same wallet that opens{" "}
              <a href={OPS} target="_blank" rel="noreferrer" className="text-[var(--ink)] underline decoration-[var(--stroke)] underline-offset-2 hover:decoration-[var(--ink)]">
                ops.palmaierc.com
              </a>
              .
            </p>
            <p className="mt-2 max-w-[44ch] text-[13px] leading-5 text-[var(--faint)]">
              Ops is hosting, domains, and git for an address. No email. No name on the record. No GitHub username. One signature is the user.
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => {
                  open({ view: isConnected ? "Account" : "Connect" });
                }}
                className="gate-cta"
              >
                {isConnected ? "Wallet connected" : "Connect wallet"}
              </button>
              <button
                type="button"
                onClick={() => window.open(ACCOUNT, "_blank", "noopener,noreferrer")}
                className="h-11 rounded-full border border-[var(--stroke)] px-5 text-[13px] hover:bg-[var(--hover)]"
              >
                useroot.sh/account
              </button>
            </div>
            <div className="mt-3 text-[11.5px] text-[var(--faint)]">
              Flash sale · $19.99 + VAT · or 20 USDC / 1,000 $PALM
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div className="text-[11px] tracking-wide text-[var(--faint)]">The stack for a wallet</div>
              <a
                href={OPS}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[var(--muted)] hover:text-[var(--ink)]"
              >
                ops.palmaierc.com ↗
              </a>
            </div>
            <div className="space-y-2.5">
              {STACK.map((item) => (
                <div key={item.title} className="gate-tile !min-h-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-[13.5px]">{item.title}</div>
                    <div className="text-[11px] tabular-nums text-[var(--faint)]">{item.n}</div>
                  </div>
                  <div className="mt-1.5 text-[12px] leading-5 text-[var(--muted)]">{item.body}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[11.5px] leading-4 text-[var(--faint)]">
              No email. No card. No home address. Plan lives onchain — 48h free, then flat.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
