import { formatPct, formatUsd, tickClass } from "../market.js";

export default function MarketTape({ quotes = [], onOpen }) {
  const rows = (quotes || []).filter((item) => item?.symbol && item.price);
  if (!rows.length) return null;
  const loop = [...rows, ...rows];

  return (
    <button type="button" onClick={onOpen} className="market-tape block w-full text-left" title="Open Markets">
      <div className="market-tape-track">
        {loop.map((item, index) => (
          <span key={item.symbol + index} className="market-tape-item">
            <span className="tracking-[0.14em] text-[var(--faint)]">{item.symbol}</span>
            <span className="text-[var(--ink)]">{formatUsd(item.price)}</span>
            <span className={tickClass(item.change24h)}>{formatPct(item.change24h)}</span>
          </span>
        ))}
      </div>
    </button>
  );
}
