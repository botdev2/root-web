import { useEffect, useState } from "react";
import { applyTheme, findTheme, readSavedThemeId, readSavedWallpaper } from "../themes.js";
import { readPalmId } from "../glmChat.js";
import { usd, usePalmUsd, wpalmOf } from "../market.js";
import { parsePublicId } from "../version.js";
import PalmDesk from "./PalmDesk.jsx";
import PalmId from "./PalmId.jsx";
import PalmSeal from "./PalmSeal.jsx";
import PalmTxList from "./PalmTx.jsx";

const TIER_AT = [0, 1000, 2500, 10000, 25000, 50000, 100000, 250000];
const TIER_NAME = ["Guest", "Member", "Plus", "Silver", "Gold", "Platinum", "Black", "Reserve"];

function palmAmount(text) {
  const value = Number.parseFloat(String(text || "0").replace(/,/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function money(value) {
  const amount = palmAmount(value);
  if (amount >= 1e6) return (amount / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (amount >= 1e5) return (amount / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return amount.toLocaleString("en-US", { maximumFractionDigits: amount < 100 ? 2 : 0 });
}

function tierOf(total) {
  let index = 0;
  TIER_AT.forEach((min, i) => {
    if (total >= min) index = i;
  });
  return index;
}

export default function PalmIdPage() {
  const address = parsePublicId();
  const [credit, setCredit] = useState(null);
  const [txs, setTxs] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const price = usePalmUsd();

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
        if (!cancelled) setError(failure.message || "Could not read this ID.");
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  const held = palmAmount(credit?.held);
  const staked = palmAmount(credit?.staked);
  const total = held + staked;
  const tier = tierOf(total);
  const next = tier < TIER_AT.length - 1 ? tier + 1 : null;
  const wpalm = wpalmOf(credit);
  const passportCredit = credit ? { ...credit, remaining: wpalm } : null;

  const copy = async (text, done) => {
    try {
      await navigator.clipboard.writeText(text);
      setNote(done);
      window.setTimeout(() => setNote(""), 2200);
    } catch {
      setNote("Copy is blocked in this browser");
    }
  };

  return (
    <div className="pid-lux relative isolate min-h-[100dvh] overflow-auto">
      <div className="wallpaper-layer" />
      <div className="pid-lux-veil" />
      <div className="relative z-[1] mx-auto flex min-h-[100dvh] w-full max-w-[1360px] flex-col px-4 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] md:px-8 lg:px-10">
        <header className="pid-lux-bar">
          <a href="/" className="flex items-center gap-2.5 no-underline">
            <img src="/palm.png" alt="" className="h-6 w-6 object-contain" />
            <span>
              <span className="block text-[10px] tracking-[0.28em] text-[var(--faint)]">PALM</span>
              <span className="block text-[13px] tracking-[0.08em]">ID</span>
            </span>
          </a>
          <div className="flex items-center gap-5 text-[12px] text-[var(--muted)]">
            <a href="#authenticator" className="hidden no-underline hover:text-[var(--ink)] sm:inline">Authenticator</a>
            <a href="#marketplace" className="hidden no-underline hover:text-[var(--ink)] sm:inline">Marketplace</a>
            <a href="/" className="no-underline hover:text-[var(--ink)]">Open /root</a>
          </div>
        </header>

        {!address ? (
          <p className="mt-24 text-[13px] text-[var(--muted)]">This link is not a wallet address.</p>
        ) : error ? (
          <p className="mt-24 text-[13px] text-[var(--muted)]">{error}</p>
        ) : (
          <>
            <div className="pid-lux-hero">
              <div>
                <div className="text-[11px] tracking-[0.22em] text-[var(--faint)]">{TIER_NAME[tier]}</div>
                <h1 className="mt-1 text-[26px] font-semibold tracking-[0.04em]">PALM ID</h1>
                <div className="pid-lux-addr mt-2">{address}</div>
                {next && (
                  <div className="mt-2 text-[12px] text-[var(--muted)]">
                    {money(Math.max(0, TIER_AT[next] - total))} $PALM to {TIER_NAME[next]}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="pid-lux-btn" onClick={() => copy(address, "Address copied")}>
                  Copy address
                </button>
                <button type="button" className="pid-lux-btn" onClick={() => copy(window.location.href.split("?")[0], "Link copied")}>
                  Copy link
                </button>
                {note && <span className="self-center text-[12px] text-[var(--muted)]">{note}</span>}
              </div>
            </div>

            <div className="pid-lux-split">
              <div className="pid-lux-passport">
                <PalmId address={address} credit={passportCredit} publicPage />
              </div>
              <aside className="pid-lux-side">
                <PalmSeal address={address} compact />
                <div className="pid-lux-balances">
                  <Balance label="Held" value={credit ? money(held) : "—"} />
                  <Balance label="Staked" value={credit ? money(staked) : "—"} />
                  <Balance label="wPALM" value={credit ? money(wpalm) : "—"} hint="Wallet + staked" lead />
                  <Balance label="USD" value={credit ? usd(wpalm, price) : "—"} hint="Same as PALM" />
                </div>
                <PalmDesk credit={credit} compact />
              </aside>
            </div>

            <PalmTxList txs={txs} loading={txs === null} edition />
          </>
        )}

        <footer className="pid-lux-foot">
          Public $PALM holdings, six-month transfers including swaps, and the wPALM desk.
          <span className="mx-2 text-[var(--faint)]">·</span>
          <a href="/" className="text-[var(--muted)] no-underline hover:text-[var(--ink)]">
            /root
          </a>
        </footer>
      </div>
    </div>
  );
}

function Balance({ label, value, hint, lead }) {
  return (
    <div className={lead ? "pid-lux-tile pid-lux-tile--lead" : "pid-lux-tile"}>
      <div className="text-[10px] tracking-[0.14em] text-[var(--faint)]">{label}</div>
      <div className="mt-1 text-[18px] tabular-nums tracking-[0.02em]">{value}</div>
      {hint && <div className="mt-0.5 text-[10px] text-[var(--muted)]">{hint}</div>}
    </div>
  );
}
