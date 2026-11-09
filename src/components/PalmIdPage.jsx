import { useEffect, useState } from "react";
import { applyTheme, findTheme, readSavedThemeId, readSavedWallpaper } from "../themes.js";
import { readPalmId } from "../glmChat.js";
import { parsePublicId } from "../version.js";
import PalmId from "./PalmId.jsx";
import PalmTxList from "./PalmTx.jsx";

function shortAmount(value) {
  const amount = Number.parseFloat(String(value || "0").replace(/,/g, ""));
  if (!Number.isFinite(amount)) return "0";
  if (amount >= 1e6) return (amount / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (amount >= 1e5) return (amount / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return amount.toLocaleString("en-US", { maximumFractionDigits: amount < 100 ? 2 : 0 });
}

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
  const held = shortAmount(credit?.held);
  const staked = shortAmount(credit?.staked);

  return (
    <div className="pid-stage pid-vip relative isolate min-h-[100dvh] overflow-auto text-[var(--ink)]">
      <div className="wallpaper-layer" />
      <div className="pid-stage-veil" />
      <div className="pid-vip-grain" />
      <div className="relative z-[1] mx-auto flex min-h-[100dvh] max-w-[1120px] flex-col px-4 pb-[max(40px,env(safe-area-inset-bottom))] pt-[max(28px,env(safe-area-inset-top))] md:px-12">
        <header className="pid-vip-head">
          <a href="/" className="flex items-center gap-3 no-underline">
            <img src="/palm.png" alt="" className="h-6 w-6 object-contain" />
            <span className="text-[10px] font-semibold tracking-[0.42em] text-[var(--ink)]">PALM PRIVATE</span>
          </a>
          <div className="text-[10px] tracking-[0.36em] text-[var(--muted)]">CLIENT</div>
        </header>

        {!address ? (
          <p className="mt-24 text-center text-[13px] tracking-[0.08em] text-[var(--muted)]">This PALM ID link is not a wallet address.</p>
        ) : error ? (
          <p className="mt-24 text-center text-[13px] tracking-[0.08em] text-[var(--muted)]">{error}</p>
        ) : (
          <>
            <div className="mb-10 text-center">
              <div className="text-[10px] tracking-[0.42em] text-[var(--faint)]">PRIVATE ACCOUNT</div>
              <h1 className="pid-vip-account mt-3">{short || "PALM ID"}</h1>
              <div className="pid-vip-rule" />
              {credit && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[11px] tracking-[0.18em] text-[var(--muted)]">
                  <span>HELD {held}</span>
                  <span>STAKED {staked}</span>
                  <span>WINDOW {shortAmount(credit.remaining)} CR</span>
                </div>
              )}
            </div>
            <div className="pid-vitrine">
              <div className="pid-vitrine-glass" />
              <div className="pid-stage-book">
                <PalmId address={address} credit={credit} publicPage />
              </div>
            </div>
            <PalmTxList txs={txs} loading={txs === null} edition />
          </>
        )}

        <p className="mt-auto pt-14 text-center text-[10px] tracking-[0.32em] text-[var(--faint)]">
          CONFIDENTIAL ·{" "}
          <a href="/" className="no-underline text-[var(--faint)] hover:text-[var(--muted)]">
            OPEN /ROOT
          </a>
        </p>
      </div>
    </div>
  );
}
