import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import {
  formatPct,
  formatUsd,
  formatVol,
  readWatchlist,
  searchDexQuotes,
  tickClass,
  usd,
  wpalmOf,
  writeWatchlist,
} from "../../market.js";
import { Card, Ghost, Page, Primary } from "../ui.jsx";

export default function MarketsView({ quotes = [], updatedAt = 0, error = "", credit = null, marketOn = false, onToggleMode, onAsk }) {
  const { isConnected } = useAccount();
  const [query, setQuery] = useState("");
  const [watch, setWatch] = useState(readWatchlist);
  const [hits, setHits] = useState([]);
  const palm = quotes.find((item) => item.symbol === "PALM");
  const wpalm = wpalmOf(credit);

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 2) {
      setHits([]);
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      searchDexQuotes(needle)
        .then((rows) => {
          if (!cancelled) setHits(rows);
        })
        .catch(() => {
          if (!cancelled) setHits([]);
        });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const board = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const known = new Set(quotes.map((item) => item.symbol));
    const extra = hits.filter((item) => !known.has(item.symbol));
    const rows = [...quotes, ...extra];
    const filtered = needle
      ? rows.filter((item) => (item.symbol + " " + item.name).toLowerCase().includes(needle))
      : rows;
    const starred = new Set(watch);
    return filtered.slice().sort((a, b) => {
      const aStar = starred.has(a.symbol) ? 1 : 0;
      const bStar = starred.has(b.symbol) ? 1 : 0;
      if (aStar !== bStar) return bStar - aStar;
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return 0;
    });
  }, [quotes, hits, query, watch]);

  const toggleStar = (symbol) => {
    setWatch((prev) => {
      const next = prev.includes(symbol) ? prev.filter((item) => item !== symbol) : [symbol, ...prev];
      writeWatchlist(next);
      return next;
    });
  };

  const stamp = updatedAt
    ? new Date(updatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "";

  return (
    <Page wide>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-[0.28em] text-[var(--faint)]">PALM MARKET</div>
          <div className="mt-1 text-[22px]">Live prices</div>
          <p className="mt-1 max-w-[640px] text-[13px] leading-5 text-[var(--muted)]">
            PALM from DexScreener. Majors from CoinGecko. Prints refresh about every 30 seconds. Not financial advice.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {stamp && <span className="text-[11px] tabular-nums text-[var(--faint)]">{stamp}</span>}
          <Ghost active={marketOn} onClick={onToggleMode}>
            {marketOn ? "Mode on" : "Market Mode"}
          </Ghost>
        </div>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Hero
          label="PALM"
          value={formatUsd(palm?.price)}
          change={palm?.change24h}
          note={palm ? `${formatVol(palm.volume)} 24h vol` : error || "Waiting on DexScreener"}
        />
        <Hero label="wPALM" value={isConnected ? wpalm.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"} note={isConnected ? usd(wpalm, palm?.price) : "Connect a wallet"} />
        <Hero label="BTC" value={formatUsd(quotes.find((item) => item.symbol === "BTC")?.price)} change={quotes.find((item) => item.symbol === "BTC")?.change24h} note="Bitcoin" />
        <Hero label="ETH" value={formatUsd(quotes.find((item) => item.symbol === "ETH")?.price)} change={quotes.find((item) => item.symbol === "ETH")?.change24h} note="Ethereum" />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a ticker or name"
          className="h-10 min-w-[220px] flex-1 rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 text-[14px] outline-none placeholder:text-[var(--faint)]"
        />
        {onAsk && (
          <Primary
            onClick={() =>
              onAsk(
                palm
                  ? `What's moving PALM, BTC, and ETH right now? PALM is ${formatUsd(palm.price)} (${formatPct(palm.change24h)}). Cite live sources.`
                  : "What's moving PALM, BTC, and ETH right now? Cite live sources.",
              )
            }
          >
            Ask Hamrin
          </Primary>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[auto_4.5rem_1fr_6.5rem_5.5rem_5.5rem_5.5rem] gap-2 border-b border-[var(--stroke-soft)] px-3 py-2 text-[10.5px] tracking-[0.16em] text-[var(--faint)] sm:grid">
          <span />
          <span>SYM</span>
          <span>Name</span>
          <span className="text-right">Price</span>
          <span className="text-right">24h</span>
          <span className="text-right">Volume</span>
          <span className="text-right">7d</span>
        </div>
        {board.length === 0 && (
          <div className="px-4 py-8 text-center text-[13px] text-[var(--muted)]">{error || "Waiting on quotes."}</div>
        )}
        {board.map((item) => (
          <Row
            key={item.id || item.symbol}
            item={item}
            starred={watch.includes(item.symbol)}
            onStar={() => toggleStar(item.symbol)}
            onAsk={onAsk ? () => onAsk(`What's moving ${item.symbol} (${item.name}) today? Last print ${formatUsd(item.price)} (${formatPct(item.change24h)}). Cite live sources.`) : null}
          />
        ))}
      </Card>
    </Page>
  );
}

function Hero({ label, value, change, note }) {
  return (
    <Card className="px-3 py-3.5">
      <div className="text-[10px] tracking-[0.16em] text-[var(--faint)]">{label}</div>
      <div className="mt-1.5 text-[20px] tabular-nums leading-none">{value}</div>
      {Number.isFinite(Number(change)) ? (
        <div className={`mt-1 text-[12px] tabular-nums ${tickClass(change)}`}>{formatPct(change)}</div>
      ) : (
        note && <div className="mt-1 text-[11px] text-[var(--muted)]">{note}</div>
      )}
      {Number.isFinite(Number(change)) && note && <div className="mt-0.5 text-[11px] text-[var(--muted)]">{note}</div>}
    </Card>
  );
}

function Row({ item, starred, onStar, onAsk }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 border-b border-[var(--stroke-soft)] px-3 py-2.5 last:border-b-0 sm:grid-cols-[auto_4.5rem_1fr_6.5rem_5.5rem_5.5rem_5.5rem]">
      <button
        type="button"
        onClick={onStar}
        aria-label={starred ? "Remove from watchlist" : "Watch"}
        className={`h-7 w-7 rounded-md text-[13px] ${starred ? "text-[var(--amber)]" : "text-[var(--faint)] hover:text-[var(--ink)]"}`}
      >
        {starred ? "★" : "☆"}
      </button>
      <button type="button" onClick={onAsk || undefined} className="text-left">
        <div className="text-[13px] tracking-[0.08em]">{item.symbol}</div>
        <div className="text-[11px] text-[var(--muted)] sm:hidden">{item.name}</div>
      </button>
      <div className="hidden truncate text-[13px] text-[var(--muted)] sm:block">{item.name}</div>
      <div className="text-right text-[13px] tabular-nums">{formatUsd(item.price)}</div>
      <div className={`text-right text-[13px] tabular-nums ${tickClass(item.change24h)}`}>{formatPct(item.change24h)}</div>
      <div className="hidden text-right text-[12px] tabular-nums text-[var(--muted)] sm:block">{formatVol(item.volume)}</div>
      <div className="hidden justify-end sm:flex">
        <Spark values={item.spark} up={Number(item.change24h) >= 0} />
      </div>
    </div>
  );
}

function Spark({ values, up }) {
  if (!values?.length) return <span className="inline-block h-6 w-16" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 64;
      const y = 22 - ((value - min) / span) * 20;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="market-spark h-6 w-16" viewBox="0 0 64 24" aria-hidden="true">
      <polyline fill="none" stroke={up ? "var(--green)" : "var(--rose)"} strokeWidth="1.4" points={points} />
    </svg>
  );
}
