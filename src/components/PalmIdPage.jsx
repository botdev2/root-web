import { useEffect, useState } from "react";
import { applyTheme, findTheme, readSavedThemeId, readSavedWallpaper } from "../themes.js";
import { readPalmId } from "../glmChat.js";
import { parsePublicId } from "../version.js";
import PalmId from "./PalmId.jsx";
import PalmTxList from "./PalmTx.jsx";

export default function PalmIdPage() {
  const address = parsePublicId();
  const [credit, setCredit] = useState(null);
  const [txs, setTxs] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    applyTheme(findTheme(readSavedThemeId()), readSavedWallpaper());
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
        setTxs(Array.isArray(data.txs) ? data.txs : []);
      })
      .catch((failure) => {
        if (!cancelled) setError(failure.message || "Could not read this PALM ID.");
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";

  return (
    <div className="pid-stage relative isolate min-h-[100dvh] overflow-auto text-[var(--ink)]">
      <div className="wallpaper-layer" />
      <div className="pid-stage-veil" />
      <div className="relative z-[1] mx-auto flex min-h-[100dvh] max-w-[1180px] flex-col px-4 pb-[max(36px,env(safe-area-inset-bottom))] pt-[max(28px,env(safe-area-inset-top))] md:px-10">
        <header className="mb-10 flex items-center justify-between gap-4 border-b border-[color-mix(in_srgb,var(--amber)_35%,var(--stroke))] pb-5">
          <a href="/" className="flex items-center gap-3 no-underline">
            <img src="/palm.png" alt="" className="h-7 w-7 object-contain" />
            <span className="text-[11px] font-semibold tracking-[0.38em] text-[var(--ink)]">PALM</span>
          </a>
          <div className="text-[11px] tracking-[0.32em] text-[var(--muted)]">IDENTITY</div>
        </header>

        {!address ? (
          <p className="mt-24 text-center text-[13px] tracking-[0.08em] text-[var(--muted)]">This PALM ID link is not a wallet address.</p>
        ) : error ? (
          <p className="mt-24 text-center text-[13px] tracking-[0.08em] text-[var(--muted)]">{error}</p>
        ) : (
          <>
            <div className="mb-8 text-center">
              <div className="text-[11px] tracking-[0.36em] text-[var(--faint)]">PUBLIC RECORD</div>
              <h1 className="mt-2 text-[22px] font-semibold tracking-[0.18em] md:text-[26px]">{short || "PALM ID"}</h1>
            </div>
            <div className="pid-stage-book">
              <PalmId address={address} credit={credit} publicPage />
            </div>
            <PalmTxList txs={txs} loading={txs === null} edition />
          </>
        )}

        <p className="mt-auto pt-12 text-center text-[10px] tracking-[0.28em] text-[var(--faint)]">
          <a href="/" className="no-underline text-[var(--faint)] hover:text-[var(--muted)]">
            OPEN /ROOT
          </a>
        </p>
      </div>
    </div>
  );
}
