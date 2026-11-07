import { useEffect, useState } from "react";
import { applyTheme, findTheme, readSavedThemeId, readSavedWallpaper } from "../themes.js";
import { readPalmId } from "../glmChat.js";
import { APP_VERSION, parsePublicId } from "../version.js";
import PalmId from "./PalmId.jsx";

export default function PalmIdPage() {
  const address = parsePublicId();
  const [credit, setCredit] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    applyTheme(findTheme(readSavedThemeId()), { wallpaper: readSavedWallpaper() !== "none" });
    document.title = address ? `PALM ID · ${address.slice(0, 6)}…${address.slice(-4)}` : "PALM ID";
  }, [address]);

  useEffect(() => {
    if (!address) return undefined;
    let cancelled = false;
    readPalmId(address)
      .then((data) => {
        if (cancelled) return;
        setCredit({
          remaining: data.windowAllowance,
          held: data.held,
          staked: data.staked,
          points: data.points,
          creditsEarned: data.creditsEarned,
        });
      })
      .catch((failure) => {
        if (!cancelled) setError(failure.message || "Could not read this PALM ID.");
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <div className="relative isolate min-h-[100dvh] overflow-auto text-[var(--ink)]">
      <div className="wallpaper-layer" />
      <div className="relative z-[1] mx-auto flex min-h-[100dvh] max-w-[1100px] flex-col px-3 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] md:px-6">
        <header className="mb-4 flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2 text-[13px] text-[var(--muted)]">
            <img src="/palm.png" alt="" className="h-6 w-6 object-contain" />
            /root
          </a>
          <div className="text-[11px] text-[var(--faint)]">Web {APP_VERSION}</div>
        </header>
        {!address ? (
          <p className="mt-16 text-center text-[14px] text-[var(--muted)]">This PALM ID link is not a wallet address.</p>
        ) : error ? (
          <p className="mt-16 text-center text-[14px] text-[var(--muted)]">{error}</p>
        ) : (
          <PalmId address={address} credit={credit} publicPage />
        )}
        <p className="mt-auto pt-6 text-center text-[12px] text-[var(--faint)]">
          <a href="/" className="underline">
            Open the web harness
          </a>
        </p>
      </div>
    </div>
  );
}
