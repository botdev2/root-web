import { useEffect, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { applyTheme, findTheme, readSavedThemeId, readSavedWallpaper } from "../themes.js";
import { opsBearer } from "../glmChat.js";
import { authenticatorUrl, parseAuthenticatorId, publicIdUrl } from "../version.js";
import PalmSeal from "./PalmSeal.jsx";

export default function PalmSealPage() {
  const address = parseAuthenticatorId();
  const { open } = useAppKit();
  const { address: connected, isConnected } = useAccount();
  const [token, setToken] = useState(() => opsBearer(address));
  const mine = Boolean(isConnected && connected && address && connected.toLowerCase() === address);
  const signedIn = Boolean(mine && token);
  const idHref = publicIdUrl(address);
  const setupHref = authenticatorUrl(address);

  useEffect(() => {
    const read = () => setToken(opsBearer(address));
    read();
    window.addEventListener("focus", read);
    return () => window.removeEventListener("focus", read);
  }, [address, connected]);

  useEffect(() => {
    applyTheme(findTheme(readSavedThemeId()), readSavedWallpaper());
    document.title = address ? `Authenticator · ${address.slice(0, 6)}…${address.slice(-4)}` : "PALM Authenticator";
  }, [address]);

  return (
    <div className="pid-lux relative isolate min-h-[100dvh] overflow-auto">
      <div className="wallpaper-layer" />
      <div className="pid-lux-veil" />
      <div className="relative z-[1] mx-auto flex min-h-[100dvh] w-full max-w-[640px] flex-col px-4 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] md:px-8">
        <header className="pid-lux-bar">
          <a href={idHref || "/"} className="flex items-center gap-2.5 no-underline">
            <img src="/palm.png" alt="" className="h-6 w-6 object-contain" />
            <span>
              <span className="block text-[10px] tracking-[0.28em] text-[var(--faint)]">PALM</span>
              <span className="block text-[13px] tracking-[0.08em]">Authenticator</span>
            </span>
          </a>
          <a href={idHref || "/"} className="text-[12px] text-[var(--muted)] no-underline hover:text-[var(--ink)]">
            Back to account
          </a>
        </header>

        {!address ? (
          <p className="mt-24 text-[13px] text-[var(--muted)]">This link is not a wallet address.</p>
        ) : (
          <>
            <div className="pid-lux-hero">
              <div>
                <div className="text-[11px] tracking-[0.22em] text-[var(--faint)]">OWNER ONLY</div>
                <h1 className="mt-1 text-[26px] font-semibold tracking-[0.04em]">Add PALM ID</h1>
                <p className="mt-2 max-w-[420px] text-[13px] leading-5 text-[var(--muted)]">
                  The setup QR is never shown on the public account. Connect this wallet, signed in on /root, then scan it in an authenticator.
                </p>
                <div className="pid-lux-iban mt-4">{address}</div>
              </div>
            </div>

            {!isConnected ? (
              <div className="pid-seal">
                <div className="text-[11px] tracking-[0.2em] text-[var(--faint)]">WALLET</div>
                <div className="mt-2 text-[15px]">Connect the owner of this ID.</div>
                <button type="button" className="pid-lux-btn pid-lux-btn--fill mt-4" onClick={() => open({ view: "Connect" })}>
                  Connect wallet
                </button>
              </div>
            ) : !mine ? (
              <div className="pid-seal">
                <div className="text-[11px] tracking-[0.2em] text-[var(--faint)]">WRONG WALLET</div>
                <div className="mt-2 text-[15px]">This page is for {address.slice(0, 6)}…{address.slice(-4)}. Disconnect and connect that account.</div>
              </div>
            ) : !signedIn ? (
              <div className="pid-seal">
                <div className="text-[11px] tracking-[0.2em] text-[var(--faint)]">SIGN IN</div>
                <div className="mt-2 text-[15px] leading-6">
                  Sign in on /root with this wallet first. Then return here to scan the QR.
                </div>
                <a href="/" className="pid-lux-btn pid-lux-btn--fill mt-4 inline-flex items-center no-underline">
                  Open /root
                </a>
              </div>
            ) : (
              <PalmSeal address={address} />
            )}
          </>
        )}

        <footer className="pid-lux-foot">
          {setupHref ? "Keep this URL private. Anyone who scans the QR can mint codes for this ID." : null}
        </footer>
      </div>
    </div>
  );
}
