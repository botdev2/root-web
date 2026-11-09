import { useState } from "react";
import { formatCredits } from "../glmChat.js";
import {
  BORROW_APY,
  CRAWLER,
  CREDIT_PRICE,
  LTV,
  OPS_MONTH,
  PALM_PER_CREDIT,
  SUPPLY_APY,
  applyBorrow,
  applyBuy,
  applyPledge,
  applyRepay,
  applyWrap,
  hamrinTotal,
  loanHealth,
  money,
  parseAmount,
  windowFromHoldings,
} from "../market.js";

export default function PalmDesk({ book, save, credit, compact }) {
  const [wrapAmt, setWrapAmt] = useState("1000");
  const [lendAmt, setLendAmt] = useState("1000");
  const [note, setNote] = useState("");
  const windowCredits = windowFromHoldings(credit);
  const extra = Number(book.extra) || 0;
  const hamrin = hamrinTotal(credit, book);
  const health = loanHealth(book);

  const tell = (text) => {
    setNote(text);
    window.setTimeout(() => setNote(""), 2800);
  };

  const run = (result) => {
    if (result.error) {
      tell(result.error);
      return;
    }
    save(result.book);
    tell(result.note);
  };

  const listings = [
    { id: "credit", name: "Hamrin extra", price: CREDIT_PRICE, extra: 1 },
    { id: "ops", name: "Ops · 30 days", price: OPS_MONTH, extra: 0 },
    { id: "crawler", name: "Crawler pane", price: CRAWLER, extra: 0 },
  ];

  return (
    <section id="marketplace" className={compact ? "pid-lux-desk" : "pid-lux-desk pid-lux-desk--wide"}>
      <div className="pid-lux-desk-head">
        <div>
          <div className="text-[11px] tracking-[0.22em] text-[var(--faint)]">MARKETPLACE</div>
          <div className="mt-1 text-[16px]">wPALM desk</div>
        </div>
        <div className="text-[12px] text-[var(--muted)]">1 PALM = 1 wPALM</div>
      </div>

      <div className="pid-lux-hamrin">
        <div>
          <div className="text-[11px] tracking-[0.16em] text-[var(--faint)]">HAMRIN WINDOW</div>
          <div className="mt-1 text-[28px] tabular-nums tracking-[0.02em]">{credit ? formatCredits(hamrin) : "—"}</div>
          <div className="mt-1 text-[12px] leading-5 text-[var(--muted)]">
            {formatCredits(windowCredits)} from {PALM_PER_CREDIT.toLocaleString()} PALM held or staked / 14 days
            {extra ? ` · +${formatCredits(extra)} extra in wPALM` : " · extra credits: 800 wPALM"}
          </div>
        </div>
        <div className="pid-lux-hamrin-meta">
          <Meta label="wPALM" value={money(book.wpalm)} />
          <Meta label="Free PALM" value={money(book.palm)} />
          <Meta label="Pledged" value={money(book.collateral)} />
        </div>
      </div>

      <div className="pid-lux-desk-block">
        <div className="text-[11px] tracking-[0.16em] text-[var(--faint)]">WRAP</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            className="pid-lux-input"
            value={wrapAmt}
            onChange={(event) => setWrapAmt(event.target.value)}
            inputMode="decimal"
            aria-label="Wrap amount"
          />
          <button type="button" className="pid-lux-btn pid-lux-btn--fill" onClick={() => run(applyWrap(book, parseAmount(wrapAmt), true))}>
            Wrap
          </button>
          <button type="button" className="pid-lux-btn" onClick={() => run(applyWrap(book, parseAmount(wrapAmt), false))}>
            Unwrap
          </button>
        </div>
      </div>

      <div className="pid-lux-desk-block">
        <div className="text-[11px] tracking-[0.16em] text-[var(--faint)]">BUY WITH WPALM</div>
        <ul className="mt-1">
          {listings.map((item) => (
            <li key={item.id} className="pid-lux-listing">
              <div>
                <div>{item.name}</div>
                <div className="text-[11px] text-[var(--muted)]">{money(item.price)} wPALM</div>
              </div>
              <button type="button" className="pid-lux-btn" onClick={() => run(applyBuy(book, item.id, item.price, item.extra))}>
                Buy
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="pid-lux-desk-block">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-[11px] tracking-[0.16em] text-[var(--faint)]">LEND · {LTV * 100}% LTV</div>
          <div className="text-[12px] tabular-nums text-[var(--muted)]">{health == null ? "No borrow" : `${health.toFixed(2)}× health`}</div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            className="pid-lux-input"
            value={lendAmt}
            onChange={(event) => setLendAmt(event.target.value)}
            inputMode="decimal"
            aria-label="Lend amount"
          />
          <button type="button" className="pid-lux-btn" onClick={() => run(applyPledge(book, parseAmount(lendAmt)))}>
            Pledge
          </button>
          <button type="button" className="pid-lux-btn pid-lux-btn--fill" onClick={() => run(applyBorrow(book, parseAmount(lendAmt)))}>
            Borrow
          </button>
          <button type="button" className="pid-lux-btn" onClick={() => run(applyRepay(book, parseAmount(lendAmt)))}>
            Repay
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-[var(--faint)]">
          Supply {SUPPLY_APY * 100}% · borrow {BORROW_APY * 100}%. Sketch on this device — wrap is not on-chain yet.
        </p>
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
