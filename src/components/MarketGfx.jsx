import { useId } from "react";
import { formatPct, formatUsd, formatVol, PALM_MARK, tickClass, vsChange } from "../market.js";
import MarketLogo from "./MarketLogo.jsx";

function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}

export function SparkArea({ values, up, w = 180, h = 56, className = "" }) {
  const fillId = useId();
  if (!values?.length || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((value, index) => {
    const x = (index / (values.length - 1)) * w;
    const y = h - 3 - ((value - min) / span) * (h - 8);
    return [x.toFixed(1), y.toFixed(1)];
  });
  const line = pts.map((pair) => pair.join(",")).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const stroke = up ? "var(--green)" : "var(--rose)";
  return (
    <svg className={`market-spark-area ${className}`} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.38" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#${fillId})`} points={area} />
      <polyline fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" points={line} />
    </svg>
  );
}

export function FearGauge({ value, label }) {
  const gradId = useId();
  const n = Number(value);
  const ok = Number.isFinite(n);
  const clamped = ok ? Math.max(0, Math.min(100, n)) : 50;
  const angle = 180 - clamped * 1.8;
  const [nx, ny] = polar(80, 86, 52, angle);
  const tone = !ok ? "" : n >= 55 ? "up" : n <= 45 ? "down" : "mid";
  return (
    <div className="market-inst">
      <div className="market-inst-label">Fear & Greed</div>
      <svg className="market-gauge" viewBox="0 0 160 108" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--rose)" />
            <stop offset="45%" stopColor="var(--amber)" />
            <stop offset="100%" stopColor="var(--green)" />
          </linearGradient>
        </defs>
        <path d="M18 86 A62 62 0 0 1 142 86" fill="none" stroke="var(--stroke)" strokeWidth="10" strokeLinecap="round" />
        <path d="M18 86 A62 62 0 0 1 142 86" fill="none" stroke={`url(#${gradId})`} strokeWidth="7" strokeLinecap="round" />
        <line x1="80" y1="86" x2={nx} y2={ny} stroke="var(--ink)" strokeWidth="2" />
        <circle cx="80" cy="86" r="4.5" fill="var(--ink)" />
        <text x="80" y="64" textAnchor="middle" fill="currentColor" fontSize="20" fontVariant="tabular-nums">
          {ok ? n : "—"}
        </text>
      </svg>
      <div className={`market-inst-note ${tone === "up" ? "text-[var(--green)]" : tone === "down" ? "text-[var(--rose)]" : ""}`}>
        {label || "alternative.me"}
      </div>
    </div>
  );
}

export function DominanceStrip({ btc, eth, mcap, coins }) {
  const b = Number(btc) || 0;
  const e = Number(eth) || 0;
  const rest = Math.max(0, 100 - b - e);
  return (
    <div className="market-inst market-inst-wide">
      <div className="market-inst-label">Dominance</div>
      <div className="market-dom-track" aria-hidden="true">
        <span className="market-dom-btc" style={{ width: b + "%" }} />
        <span className="market-dom-eth" style={{ width: e + "%" }} />
        <span className="market-dom-rest" style={{ width: rest + "%" }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] tabular-nums">
        <span>
          <i className="market-swatch market-swatch-btc" /> BTC.D {b ? b.toFixed(1) + "%" : "—"}
        </span>
        <span>
          <i className="market-swatch market-swatch-eth" /> ETH.D {e ? e.toFixed(1) + "%" : "—"}
        </span>
        <span className="text-[var(--faint)]">Rest {rest.toFixed(1)}%</span>
      </div>
      <div className="market-inst-note mt-1">
        {formatVol(mcap)} mcap{coins ? " · " + coins + " coins" : ""} · CoinPaprika
      </div>
    </div>
  );
}

export function FundingMeter({ rate }) {
  const n = Number(rate);
  const ok = Number.isFinite(n);
  const pct = ok ? n * 100 : 0;
  const pos = 50 + Math.max(-45, Math.min(45, (n / 0.0008) * 50));
  return (
    <div className="market-inst">
      <div className="market-inst-label">BTC funding</div>
      <div className={`text-[18px] tabular-nums leading-none ${ok ? tickClass(n) : ""}`}>
        {ok ? pct.toFixed(4) + "%" : "—"}
      </div>
      <div className="market-fund" aria-hidden="true">
        <span className="market-fund-neg" />
        <span className="market-fund-pos" />
        <span className="market-fund-zero" />
        {ok && <span className="market-fund-thumb" style={{ left: pos + "%" }} />}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-[var(--faint)]">
        <span>shorts pay</span>
        <span>Binance perp</span>
        <span>longs pay</span>
      </div>
    </div>
  );
}

export function FeeLadder({ fastest, half, hour }) {
  const rows = [
    { label: "next", sat: Number(fastest) || 0 },
    { label: "30m", sat: Number(half) || 0 },
    { label: "1h", sat: Number(hour) || 0 },
  ];
  const max = Math.max(...rows.map((row) => row.sat), 1);
  return (
    <div className="market-inst">
      <div className="market-inst-label">BTC fee</div>
      <div className="text-[18px] tabular-nums leading-none">{rows[0].sat ? rows[0].sat + " sat" : "—"}</div>
      <div className="market-fee-list">
        {rows.map((row) => (
          <div key={row.label} className="market-fee-row">
            <span className="w-7 text-[10px] text-[var(--faint)]">{row.label}</span>
            <span className="market-fee-bar">
              <span style={{ width: (row.sat / max) * 100 + "%" }} />
            </span>
            <span className="w-8 text-right text-[10px] tabular-nums">{row.sat || "—"}</span>
          </div>
        ))}
      </div>
      <div className="market-inst-note">mempool.space</div>
    </div>
  );
}

export function Turnover({ volume, mcap }) {
  const turn = volume > 0 && mcap > 0 ? (volume / mcap) * 100 : 0;
  return (
    <div className="market-inst">
      <div className="market-inst-label">24h volume</div>
      <div className="text-[18px] tabular-nums leading-none">{formatVol(volume)}</div>
      <div className="market-turn" aria-hidden="true">
        <span style={{ width: Math.min(100, turn * 8) + "%" }} />
      </div>
      <div className="market-inst-note">{turn ? turn.toFixed(2) + "% of mcap" : "CoinPaprika"}</div>
    </div>
  );
}

export function RangeTrack({ low, high, price }) {
  if (!Number.isFinite(low) || !Number.isFinite(high) || !Number.isFinite(price) || high <= low) return null;
  const pos = Math.max(2, Math.min(98, ((price - low) / (high - low)) * 100));
  return (
    <div className="market-range">
      <span className="tabular-nums">{formatUsd(low)}</span>
      <span className="market-range-track">
        <span className="market-range-fill" style={{ width: pos + "%" }} />
        <span className="market-range-thumb" style={{ left: pos + "%" }} />
      </span>
      <span className="tabular-nums">{formatUsd(high)}</span>
    </div>
  );
}

export function QuotePane({ item, label, extra }) {
  const up = Number(item?.change24h) >= 0;
  return (
    <div className={`market-pane ${up ? "market-pane-up" : "market-pane-down"}`}>
      <SparkArea values={item?.spark} up={up} className="market-pane-spark" w={240} h={90} />
      <div className="relative z-[1]">
        <div className="flex items-center gap-2">
          <MarketLogo symbol={item?.symbol || label} src={item?.logo} size={22} />
          <span className="text-[11px] tracking-[0.2em] text-[var(--faint)]">{label}</span>
        </div>
        <div className="mt-2 text-[26px] tabular-nums leading-none">{item?.price ? formatUsd(item.price) : "—"}</div>
        <div className={`mt-1.5 text-[13px] tabular-nums ${tickClass(item?.change24h)}`}>{formatPct(item?.change24h)}</div>
        {extra && <div className="mt-1 text-[11px] text-[var(--muted)]">{extra}</div>}
        <RangeTrack low={item?.low24h} high={item?.high24h} price={item?.price} />
      </div>
    </div>
  );
}

export function PalmVs({ palm, quotes = [] }) {
  const peers = quotes.filter((item) => item?.symbol && item.symbol !== "PALM" && Number.isFinite(item.change24h));
  if (!peers.length || !Number.isFinite(palm?.change24h)) return null;
  return (
    <div className="market-vs">
      {peers.map((item) => {
        const delta = vsChange(palm, item);
        return (
          <div key={item.symbol} className="market-vs-cell">
            <MarketLogo symbol={item.symbol} src={item.logo} size={14} />
            <span className="text-[10px] tracking-[0.12em] text-[var(--faint)]">vs {item.symbol}</span>
            <span className={`text-[13px] tabular-nums ${tickClass(delta)}`}>{formatPct(delta)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function PalmHero({ palm, wpalm, connected, extra, fallback, vs = [] }) {
  const up = Number(palm?.change24h) >= 0;
  return (
    <div className={`market-palm ${up ? "market-pane-up" : "market-pane-down"}`}>
      <SparkArea values={palm?.spark} up={up} className="market-pane-spark" w={420} h={140} />
      <div className="market-palm-orb" aria-hidden="true" />
      <img src={PALM_MARK} alt="" className="market-palm-mark" width="96" height="96" />
      <div className="relative z-[1] flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] tracking-[0.28em] text-[var(--faint)]">PALM</span>
          <span className="market-live">live</span>
        </div>
        <div>
          <div className="text-[34px] tabular-nums leading-none md:text-[42px]">
            {palm?.price ? formatUsd(palm.price) : fallback || "—"}
          </div>
          <div className={`mt-2 text-[15px] tabular-nums ${tickClass(palm?.change24h)}`}>{formatPct(palm?.change24h)}</div>
        </div>
        {extra && <div className="text-[12px] text-[var(--muted)]">{extra}</div>}
        <RangeTrack low={palm?.low24h} high={palm?.high24h} price={palm?.price} />
        <PalmVs palm={palm} quotes={vs} />
      </div>
      <div className="relative z-[1] flex w-[132px] shrink-0 flex-col justify-end border-l border-[color-mix(in_srgb,var(--stroke)_70%,transparent)] pl-4">
        <div className="text-[10px] tracking-[0.18em] text-[var(--faint)]">wPALM</div>
        <div className="mt-1 text-[22px] tabular-nums leading-none">
          {connected ? wpalm.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"}
        </div>
        <div className="mt-1 text-[11px] text-[var(--muted)]">{connected ? extraHold(wpalm, palm?.price) : "Connect a wallet"}</div>
      </div>
    </div>
  );
}

function extraHold(amount, price) {
  if (!Number.isFinite(price) || price <= 0) return "1:1 with PALM";
  const value = amount * price;
  return formatUsd(value) + " · 1:1 PALM";
}
