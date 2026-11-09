import { LISTINGS, money, palmAmount, usd, usePalmUsd, wpalmOf } from "../market.js";

export default function PalmDesk({ credit, compact }) {
  const price = usePalmUsd();
  const held = palmAmount(credit?.held);
  const staked = palmAmount(credit?.staked);
  const wpalm = wpalmOf(credit);

  return (
    <section id="marketplace" className={compact ? "pid-lux-desk" : "pid-lux-desk pid-lux-desk--wide"}>
      <div className="pid-lux-desk-head">
        <div>
          <div className="text-[11px] tracking-[0.22em] text-[var(--faint)]">MARKETPLACE · WIP</div>
          <div className="mt-1 text-[16px]">{compact ? "Quoted in wPALM" : "wPALM"}</div>
        </div>
        <div className="text-[12px] text-[var(--muted)]">{compact ? "Quoted in wPALM" : "Wallet + staked"}</div>
      </div>

      {!compact && (
        <div className="pid-lux-hamrin">
          <div>
            <div className="text-[11px] tracking-[0.16em] text-[var(--faint)]">WPALM</div>
            <div className="mt-1 text-[28px] tabular-nums tracking-[0.02em]">{credit ? money(wpalm) : "—"}</div>
            <div className="mt-1 text-[12px] leading-5 text-[var(--muted)]">
              {money(held)} in wallet + {money(staked)} staked
              {price ? ` · ${usd(wpalm, price)}` : ""}
            </div>
          </div>
          <div className="pid-lux-hamrin-meta">
            <Meta label="Wallet" value={credit ? money(held) : "—"} />
            <Meta label="Staked" value={credit ? money(staked) : "—"} />
            <Meta label="USD" value={credit ? usd(wpalm, price) : "—"} />
          </div>
        </div>
      )}

      <div className="pid-lux-desk-block">
        <div className="text-[11px] tracking-[0.16em] text-[var(--faint)]">MOCKUP · WPALM</div>
        <ul className="mt-1">
          {LISTINGS.map((item) => (
            <li key={item.id} className="pid-lux-listing">
              <div>
                <div>{item.name}</div>
                <div className="text-[11px] text-[var(--muted)]">{item.note}</div>
              </div>
              <div className="text-right">
                <div className="tabular-nums">{money(item.wpalm)} wPALM</div>
                <div className="text-[11px] text-[var(--muted)]">{usd(item.wpalm, price)}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.14em] text-[var(--faint)]">{label}</div>
      <div className="mt-0.5 text-[15px] tabular-nums">{value}</div>
    </div>
  );
}
