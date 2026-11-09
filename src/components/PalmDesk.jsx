import { useState } from "react";
import { formatCredits } from "../glmChat.js";
import {
  CRAWLER,
  HAMRIN,
  OPS_MONTH,
  applySpend,
  creditsOf,
  money,
  palmAmount,
  wpalmOf,
} from "../market.js";

export default function PalmDesk({ book, save, credit, compact }) {
  const [note, setNote] = useState("");
  const held = palmAmount(credit?.held);
  const staked = palmAmount(credit?.staked);
  const wpalm = wpalmOf(credit);
  const credits = creditsOf(book, credit);

  const run = (result) => {
    if (result.error) {
      setNote(result.error);
      return;
    }
    save(result.book);
    setNote(result.note);
  };

  const listings = [
    { id: "hamrin", name: "Hamrin", price: HAMRIN },
    { id: "ops", name: "Ops · 30 days", price: OPS_MONTH },
    { id: "crawler", name: "Crawler pane", price: CRAWLER },
  ];

  return (
    <section id="marketplace" className={compact ? "pid-lux-desk" : "pid-lux-desk pid-lux-desk--wide"}>
      <div className="pid-lux-desk-head">
        <div>
          <div className="text-[11px] tracking-[0.22em] text-[var(--faint)]">MARKETPLACE · WIP</div>
          <div className="mt-1 text-[16px]">wPALM</div>
        </div>
        <div className="text-[12px] text-[var(--muted)]">Wallet + staked</div>
      </div>

      <div className="pid-lux-hamrin">
        <div>
          <div className="text-[11px] tracking-[0.16em] text-[var(--faint)]">WPALM</div>
          <div className="mt-1 text-[28px] tabular-nums tracking-[0.02em]">{credit ? money(wpalm) : "—"}</div>
          <div className="mt-1 text-[12px] leading-5 text-[var(--muted)]">
            {money(held)} in wallet + {money(staked)} staked
          </div>
        </div>
        <div className="pid-lux-hamrin-meta">
          <Meta label="Wallet" value={credit ? money(held) : "—"} />
          <Meta label="Staked" value={credit ? money(staked) : "—"} />
          <Meta label="Credits left" value={formatCredits(credits)} />
        </div>
      </div>

      <div className="pid-lux-desk-block">
        <div className="text-[11px] tracking-[0.16em] text-[var(--faint)]">SPEND CREDITS</div>
        <ul className="mt-1">
          {listings.map((item) => (
            <li key={item.id} className="pid-lux-listing">
              <div>
                <div>{item.name}</div>
                <div className="text-[11px] text-[var(--muted)]">{money(item.price)} credits</div>
              </div>
              <button type="button" className="pid-lux-btn" onClick={() => run(applySpend(book, credit, item.id, item.price))}>
                Spend
              </button>
            </li>
          ))}
        </ul>
      </div>
      {note && <div className="pid-lux-note">{note}</div>}
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
