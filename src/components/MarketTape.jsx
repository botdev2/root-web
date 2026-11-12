import { formatPct, formatUsd, tickClass } from "../market.js";
import MarketLogo from "./MarketLogo.jsx";

export default function MarketTape({ quotes = [], global = null, fng = null, fees = null, onOpen }) {
  const rows = (quotes || []).filter((item) => item?.symbol && item.price);
  if (!rows.length && !fng && !global) return null;
  const lead = [...rows].filter((item) => item.symbol !== "PALM" && Number.isFinite(item.change24h)).sort((a, b) => b.change24h - a.change24h);
  const meta = [
    Number.isFinite(global?.btcDom) ? { key: "btcd", label: "BTC.D", value: global.btcDom.toFixed(1) + "%", change: 0 } : null,
    fng?.value ? { key: "fng", label: "F&G", value: fng.value + " " + (fng.label || ""), change: fng.value >= 55 ? 1 : fng.value <= 45 ? -1 : 0 } : null,
    fees?.fastestFee ? { key: "fee", label: "BTC fee", value: fees.fastestFee + " sat", change: 0 } : null,
    lead[0] ? { key: "lead", label: "LEAD", value: lead[0].symbol + " " + formatPct(lead[0].change24h), change: lead[0].change24h } : null,
  ].filter(Boolean);
  const loop = [...meta, ...rows, ...meta, ...rows];

  return (
    <button type="button" onClick={onOpen} className="market-tape block w-full text-left" title="Open Markets">
      <div className="market-tape-track">
        {loop.map((item, index) =>
          item.symbol ? (
            <span key={item.symbol + index} className="market-tape-item">
              <MarketLogo symbol={item.symbol} src={item.logo} size={14} />
              <span className="tracking-[0.14em] text-[var(--faint)]">{item.symbol}</span>
              <span className="text-[var(--ink)]">{formatUsd(item.price)}</span>
              <span className={tickClass(item.change24h)}>{formatPct(item.change24h)}</span>
            </span>
          ) : (
            <span key={item.key + index} className="market-tape-item">
              <span className="tracking-[0.14em] text-[var(--faint)]">{item.label}</span>
              <span className={tickClass(item.change)}>{item.value}</span>
            </span>
          ),
        )}
      </div>
    </button>
  );
}
