import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import {
  formatPct,
  formatUsd,
  formatVol,
  mcapOf,
  readWatchlist,
  searchDexQuotes,
  tickClass,
  wpalmOf,
  writeWatchlist,
} from "../../market.js";
import MarketLogo from "../MarketLogo.jsx";
import {
  DominanceStrip,
  FearGauge,
  FeeLadder,
  FundingMeter,
  NextEvent,
  PalmHero,
  QuotePane,
  RangeTrack,
  SparkArea,
  Turnover,
} from "../MarketGfx.jsx";
import { notionalUsd } from "../../trades.js";
import { Ghost, Page, Primary } from "../ui.jsx";

const SORTS = [
  { id: "watch", label: "Watch" },
  { id: "change", label: "24h" },
  { id: "volume", label: "Volume" },
  { id: "mcap", label: "Mcap" },
];

export default function MarketsView({
  quotes = [],
  global = null,
  fng = null,
  funding = [],
  fees = null,
  event = null,
  updatedAt = 0,
  error = "",
  credit = null,
  marketOn = false,
  book = null,
  onToggleMode,
  onAsk,
  onOpenTrades,
}) {
  const { isConnected } = useAccount();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("watch");
  const [watch, setWatch] = useState(readWatchlist);
  const [hits, setHits] = useState([]);
  const palm = quotes.find((item) => item.symbol === "PALM");
  const spectre = quotes.find((item) => item.symbol === "SPECTRE");
  const ryft = quotes.find((item) => item.symbol === "RYFT");
  const btc = quotes.find((item) => item.symbol === "BTC");
  const eth = quotes.find((item) => item.symbol === "ETH");
  const sol = quotes.find((item) => item.symbol === "SOL");
  const wpalm = wpalmOf(credit);
  const fundBtc = funding.find((item) => item.symbol === "BTC");

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

  const ranked = useMemo(() => {
    return quotes
      .filter((item) => item.symbol !== "PALM" && Number.isFinite(item.change24h))
      .slice()
      .sort((a, b) => b.change24h - a.change24h);
  }, [quotes]);

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
      if (sort === "change") return (Number(b.change24h) || -999) - (Number(a.change24h) || -999);
      if (sort === "volume") return (b.volume || 0) - (a.volume || 0);
      if (sort === "mcap") return mcapOf(b) - mcapOf(a);
      const aStar = starred.has(a.symbol) ? 1 : 0;
      const bStar = starred.has(b.symbol) ? 1 : 0;
      if (aStar !== bStar) return bStar - aStar;
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return (a.rank || 999) - (b.rank || 999);
    });
  }, [quotes, hits, query, watch, sort]);

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
  const palmBtc = palm?.price && btc?.price ? palm.price / btc.price : 0;
  const vs = [btc, eth, sol, spectre, ryft].filter(Boolean);
  const heat = [palm, spectre, ryft, ...ranked.filter((item) => !["PALM", "SPECTRE", "RYFT"].includes(item.symbol))]
    .filter(Boolean)
    .slice(0, 14);

  return (
    <Page wide desk>
      <div className="market-desk">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {stamp && (
            <span className="flex items-center gap-1.5 text-[11px] tabular-nums text-[var(--faint)]">
              <span className="market-live">live</span>
              {stamp}
            </span>
          )}
          <Ghost active={marketOn} onClick={onToggleMode}>
            {marketOn ? "Mode on" : "Market Mode"}
          </Ghost>
        </div>

        <div className="market-hero mb-4">
          <PalmHero
            palm={palm}
            wpalm={wpalm}
            connected={isConnected}
            vs={vs}
            fallback={error || "—"}
            extra={
              [
                palm?.volume ? formatVol(palm.volume) + " 24h vol" : "",
                palmBtc ? "PALM/BTC " + palmBtc.toExponential(2) : "",
              ]
                .filter(Boolean)
                .join(" · ")
            }
          />
          <QuotePane item={spectre} label="SPECTRE AI" extra="Ethereum" />
          <QuotePane item={ryft} label="RYFT Corp" extra="Robinhood Chain" />
          <QuotePane item={btc} label="BTC" extra={btc && Number.isFinite(btc.high24h) ? "hi " + formatUsd(btc.high24h) : "Bitcoin"} />
          <QuotePane item={eth} label="ETH" extra={eth && Number.isFinite(eth.high24h) ? "hi " + formatUsd(eth.high24h) : "Ethereum"} />
        </div>

        <NextEvent event={event} />

        <PositionsStrip book={book} quotes={quotes} onOpen={onOpenTrades} />

        <div className="market-instruments mb-5">
          <FearGauge value={fng?.value} label={fng?.label} />
          <DominanceStrip btc={global?.btcDom} eth={global?.ethDom} mcap={global?.mcap} coins={global?.coins} />
          <FundingMeter rate={fundBtc?.rate} />
          <FeeLadder fastest={fees?.fastestFee} half={fees?.halfHourFee} hour={fees?.hourFee} />
          <Turnover volume={global?.volume} mcap={global?.mcap} />
        </div>

        {heat.length > 0 && (
          <div className="market-heat mb-5">
            {heat.map((item) => {
              const mag = Math.min(10, Math.abs(Number(item.change24h) || 0));
              const up = Number(item.change24h) >= 0;
              return (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={
                    onAsk
                      ? () =>
                          onAsk(
                            `What's moving ${item.symbol} today? Print ${formatUsd(item.price)} (${formatPct(item.change24h)}). Cite live sources.`,
                          )
                      : undefined
                  }
                  className={`market-heat-cell ${up ? "market-heat-up" : "market-heat-down"} ${item.symbol === "PALM" ? "market-heat-palm" : ""}`}
                  style={{
                    flex:
                      item.symbol === "PALM"
                        ? "3.2 1 168px"
                        : `${(1.2 + mag).toFixed(2)} 1 ${72 + mag * 10}px`,
                  }}
                >
                  <SparkArea values={item.spark} up={up} className="market-heat-spark" w={120} h={44} />
                  <div className="relative z-[1] flex items-center gap-1.5">
                    <MarketLogo symbol={item.symbol} src={item.logo} size={16} />
                    <span className="text-[11px] tracking-[0.1em]">{item.symbol}</span>
                  </div>
                  <div className={`relative z-[1] text-[15px] tabular-nums ${tickClass(item.change24h)}`}>{formatPct(item.change24h)}</div>
                  <div className="relative z-[1] text-[11px] tabular-nums text-[var(--muted)]">{formatUsd(item.price)}</div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a ticker, then DexScreener fills gaps"
            className="h-10 min-w-[220px] flex-1 rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 text-[14px] outline-none placeholder:text-[var(--faint)]"
          />
          {SORTS.map((item) => (
            <Ghost key={item.id} active={sort === item.id} onClick={() => setSort(item.id)}>
              {item.label}
            </Ghost>
          ))}
          {onAsk && (
            <Primary
              onClick={() =>
                onAsk(
                  [
                    "Read this tape and say what risk is doing.",
                    fng ? `Fear & Greed ${fng.value} ${fng.label}.` : "",
                    Number.isFinite(global?.btcDom) ? `BTC.D ${global.btcDom.toFixed(1)}%.` : "",
                    palm ? `PALM ${formatUsd(palm.price)} (${formatPct(palm.change24h)}).` : "",
                    ranked[0] ? `Lead ${ranked[0].symbol} ${formatPct(ranked[0].change24h)}.` : "",
                    ranked.length ? `Lag ${ranked[ranked.length - 1].symbol} ${formatPct(ranked[ranked.length - 1].change24h)}.` : "",
                    fees?.fastestFee ? `BTC fee ${fees.fastestFee} sat/vB.` : "",
                    "Cite the prints. Not a trade idea.",
                  ]
                    .filter(Boolean)
                    .join(" "),
                )
              }
            >
              Ask Hamrin
            </Primary>
          )}
        </div>

        <div className="market-book">
          <div className="hidden grid-cols-[auto_auto_5rem_1fr_6.5rem_5.5rem_5.5rem_5.5rem_7rem] gap-2 border-b border-[var(--stroke-soft)] px-3 py-2 text-[10.5px] tracking-[0.16em] text-[var(--faint)] lg:grid">
            <span />
            <span />
            <span>SYM</span>
            <span>Name</span>
            <span className="text-right">Price</span>
            <span className="text-right">24h</span>
            <span className="text-right">Volume</span>
            <span className="text-right">Mcap</span>
            <span className="text-right">Range</span>
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
              onAsk={
                onAsk
                  ? () =>
                      onAsk(
                        `What's moving ${item.symbol} (${item.name}) today? Last print ${formatUsd(item.price)} (${formatPct(item.change24h)}). Cite live sources.`,
                      )
                  : null
              }
            />
          ))}
        </div>
      </div>
    </Page>
  );
}

function PositionsStrip({ book, quotes, onOpen }) {
  const palm = quotes.find((item) => item.symbol === "PALM");
  const eth = quotes.find((item) => item.symbol === "ETH");
  const live = (book?.orders || []).filter((item) => ["armed", "triggered", "signing"].includes(item.status));
  const filled = (book?.orders || []).filter((item) => item.status === "done").slice(0, 4);
  const rows = live.length ? live : filled;
  const halt = !!book?.guards?.halt;
  const disarmed = book?.guards && !book.guards.live;

  return (
    <button type="button" onClick={onOpen} className="market-positions mb-5 w-full text-left">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10.5px] tracking-[0.16em] text-[var(--faint)]">YOUR POSITIONS</span>
          {live.length > 0 && (
            <span className="rounded-full border border-[var(--stroke)] px-1.5 py-0.5 text-[10px] tabular-nums text-[var(--ink)]">
              {live.length} live
            </span>
          )}
          {halt && <span className="text-[10px] tracking-[0.12em] text-[var(--rose)]">KILL</span>}
          {disarmed && !halt && <span className="text-[10px] tracking-[0.12em] text-[var(--faint)]">DISARMED</span>}
        </div>
        <span className="text-[11px] text-[var(--muted)]">Open desk</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 pb-4 text-[13px] text-[var(--muted)]">No PALM/ETH limits. Open the desk to arm one.</div>
      ) : (
        <div className="px-2 pb-2">
          {rows.map((order) => {
            const size = order.side === "buy" ? `${order.amount} ETH` : `${order.amount} PALM`;
            const usd = notionalUsd(order, palm?.price, eth?.price);
            return (
              <div key={order.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] tracking-[0.12em] ${order.side === "buy" ? "text-[var(--green)]" : "text-[var(--rose)]"}`}>
                      {order.side.toUpperCase()}
                    </span>
                    <span className="text-[13px]">{order.pair || "PALM/ETH"}</span>
                    <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--faint)]">{order.status}</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-[var(--muted)]">
                    {size} · trigger {formatUsd(order.triggerUsd)}
                  </div>
                </div>
                <div className="shrink-0 text-right text-[12px] tabular-nums text-[var(--muted)]">{usd ? formatUsd(usd) : "—"}</div>
              </div>
            );
          })}
        </div>
      )}
    </button>
  );
}

function Row({ item, starred, onStar, onAsk }) {
  const up = Number(item.change24h) >= 0;
  return (
    <div className="market-book-row grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-2.5 lg:grid-cols-[auto_auto_5rem_1fr_6.5rem_5.5rem_5.5rem_5.5rem_7rem]">
      <button
        type="button"
        onClick={onStar}
        aria-label={starred ? "Remove from watchlist" : "Watch"}
        className={`h-7 w-7 rounded-md text-[13px] ${starred ? "text-[var(--amber)]" : "text-[var(--faint)] hover:text-[var(--ink)]"}`}
      >
        {starred ? "★" : "☆"}
      </button>
      <MarketLogo symbol={item.symbol} src={item.logo} size={20} />
      <button type="button" onClick={onAsk || undefined} className="min-w-0 text-left">
        <div className="text-[13px] tracking-[0.08em]">{item.symbol}</div>
        <div className="truncate text-[11px] text-[var(--muted)] lg:hidden">{item.name}</div>
      </button>
      <div className="hidden truncate text-[13px] text-[var(--muted)] lg:block">{item.name}</div>
      <div className="text-right text-[13px] tabular-nums">{formatUsd(item.price)}</div>
      <div className={`text-right text-[13px] tabular-nums ${tickClass(item.change24h)}`}>{formatPct(item.change24h)}</div>
      <div className="hidden text-right text-[12px] tabular-nums text-[var(--muted)] lg:block">{formatVol(item.volume)}</div>
      <div className="hidden text-right text-[12px] tabular-nums text-[var(--muted)] lg:block">{formatVol(mcapOf(item))}</div>
      <div className="hidden min-w-0 lg:block">
        {item.spark?.length > 4 ? (
          <SparkArea values={item.spark} up={up} w={88} h={28} />
        ) : (
          <RangeTrack low={item.low24h} high={item.high24h} price={item.price} />
        )}
      </div>
    </div>
  );
}
