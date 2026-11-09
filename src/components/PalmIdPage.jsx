import { useEffect, useState } from "react";
import { applyTheme, findTheme, readSavedThemeId, readSavedWallpaper } from "../themes.js";
import { formatCredits, readPalmId } from "../glmChat.js";
import { parsePublicId } from "../version.js";
import PalmId from "./PalmId.jsx";
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

  useEffect(() => {
    applyTheme(findTheme(readSavedThemeId()), readSavedWallpaper());
    document.title = address ? `PALM Private · ${address.slice(0, 6)}…${address.slice(-4)}` : "PALM Private";
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
        if (!cancelled) setError(failure.message || "Could not read this account.");
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
    <div className="pid-bank relative isolate min-h-[100dvh] overflow-auto">
      <div className="wallpaper-layer" />
      <div className="pid-bank-veil" />
      <div className="relative z-[1] mx-auto flex min-h-[100dvh] w-full max-w-[1180px] flex-col px-4 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] md:px-10">
        <header className="pid-bank-bar">
          <a href="/" className="flex items-center gap-2.5 no-underline">
            <img src="/palm.png" alt="" className="h-6 w-6 object-contain" />
            <span>
              <span className="block text-[10px] tracking-[0.28em] text-[var(--faint)]">PALM</span>
              <span className="block text-[13px] tracking-[0.08em]">Private</span>
            </span>
          </a>
          <nav className="hidden items-center gap-6 text-[12px] text-[var(--muted)] sm:flex">
            <a href="#overview" className="no-underline hover:text-[var(--ink)]">Overview</a>
            <a href="#identity" className="no-underline hover:text-[var(--ink)]">Identity</a>
            <a href="#statement" className="no-underline hover:text-[var(--ink)]">Statement</a>
          </nav>
          <a href="/" className="text-[12px] tracking-[0.04em] text-[var(--muted)] no-underline hover:text-[var(--ink)]">
            Open /root
          </a>
        </header>

        {!address ? (
          <p className="mt-24 text-[13px] text-[var(--muted)]">This link is not a wallet address.</p>
        ) : error ? (
          <p className="mt-24 text-[13px] text-[var(--muted)]">{error}</p>
        ) : (
          <>
            <section id="overview" className="pid-bank-account">
              <div>
                <div className="text-[11px] tracking-[0.2em] text-[var(--faint)]">CURRENT ACCOUNT · PUBLIC RECORD</div>
                <h1 className="mt-2 text-[22px] font-semibold tracking-[0.02em] md:text-[26px]">PALM ID</h1>
                <div className="pid-bank-iban mt-2">{address}</div>
              </div>
              <div className="pid-bank-rel">
                <div className="text-[11px] tracking-[0.16em] text-[var(--faint)]">RELATIONSHIP</div>
                <div className="mt-1 text-[18px]">{TIER_NAME[tier]}</div>
                <div className="mt-1 text-[12px] text-[var(--muted)]">
                  {next ? `${money(Math.max(0, TIER_AT[next] - total))} $PALM to ${TIER_NAME[next]}` : "Reserve · top relationship"}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="pid-bank-btn" onClick={() => copy(address, "Account number copied")}>
                    Copy account
                  </button>
                  <button
                    type="button"
                    className="pid-bank-btn"
                    onClick={() => copy(window.location.href.split("?")[0], "Link copied")}
                  >
                    Copy link
                  </button>
                  {note && <span className="self-center text-[12px] text-[var(--muted)]">{note}</span>}
                </div>
              </div>
            </section>

            <div className="pid-bank-balances">
              <Balance label="Total $PALM" value={credit ? money(total) : "—"} hint="Held and staked" />
              <Balance label="Available" value={credit ? money(held) : "—"} hint="In the wallet" />
              <Balance label="Staked" value={credit ? money(staked) : "—"} hint="In the staking contract" />
              <Balance label="Hamrin window" value={credit ? formatCredits(credit.remaining) : "—"} hint="Credits this period" />
            </div>

            <section id="identity" className="pid-bank-panel pid-bank-id">
              <div className="pid-bank-panel-head">
                <div>
                  <div className="text-[11px] tracking-[0.2em] text-[var(--faint)]">IDENTITY DOCUMENT</div>
                  <div className="mt-1 text-[15px]">PALM ID passport</div>
                </div>
                <div className="text-[12px] text-[var(--muted)]">Click the book to open. Issued to this account.</div>
              </div>
              <PalmId address={address} credit={credit} publicPage />
            </section>

            <PalmTxList txs={txs} loading={txs === null} edition />
          </>
        )}

        <footer className="pid-bank-foot">
          Public record of $PALM holdings and transfers for this address. Not a statement from a licensed bank.
          <span className="mx-2 text-[var(--faint)]">·</span>
          <a href="/" className="text-[var(--muted)] no-underline hover:text-[var(--ink)]">
            /root
          </a>
        </footer>
      </div>
    </div>
  );
}

function Balance({ label, value, hint }) {
  return (
    <div className="pid-bank-tile">
      <div className="text-[11px] tracking-[0.14em] text-[var(--faint)]">{label}</div>
      <div className="mt-2 text-[22px] tabular-nums tracking-[0.02em]">{value}</div>
      <div className="mt-1 text-[11px] text-[var(--muted)]">{hint}</div>
    </div>
  );
}
