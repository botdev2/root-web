import { useState } from "react";
import { formatCredits } from "../glmChat.js";
import {
  CRAWLER,
  HAMRIN,
  LTV,
  OPS_MONTH,
  applyActivate,
  applyDeactivate,
  applySpend,
  creditsOf,
  money,
  parseAmount,
  wpalmOf,
} from "../market.js";

export default function PalmDesk({ book, save, compact }) {
  const [postAmt, setPostAmt] = useState("1000");
  const [note, setNote] = useState("");
  const wpalm = wpalmOf(book);
  const credits = creditsOf(book);

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
    { id: "hamrin", name: "Hamrin", price: HAMRIN },
    { id: "ops", name: "Ops · 30 days", price: OPS_MONTH },
    { id: "crawler", name: "Crawler pane", price: CRAWLER },
  ];

  return (
    <section id="marketplace" className={compact ? "pid-lux-desk" : "pid-lux-desk pid-lux-desk--wide"}>
      <div className="pid-lux-desk-head">
        <div>
          <div className="text-[11px] tracking-[0.22em] text-[var(--faint)]">MARKETPLACE · WIP</div>
          <div className="mt-1 text-[16px]">wPALM desk</div>
        </div>
        <div className="text-[12px] text-[var(--muted)]">You have wPALM if you own $PALM</div>
      </div>

      <div className="pid-lux-hamrin">
        <div>
          <div className="text-[11px] tracking-[0.16em] text-[var(--faint)]">ACTIVE CREDITS</div>
          <div className="mt-1 text-[28px] tabular-nums tracking-[0.02em]">{formatCredits(credits)}</div>
          <div className="mt-1 text-[12px] leading-5 text-[var(--muted)]">
            {money(wpalm)} wPALM from {money(wpalm)} $PALM owned · {money(book.posted)} posted as collateral
          </div>
        </div>
        <div className="pid-lux-hamrin-meta">
          <Meta label="wPALM" value={money(wpalm)} />
          <Meta label="Free PALM" value={money(book.palm)} />
          <Meta label="Posted" value={money(book.posted)} />
        </div>
      </div>

      <div className="pid-lux-desk-block">
        <div className="text-[11px] tracking-[0.16em] text-[var(--faint)]">ACTIVATE</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            className="pid-lux-input"
            value={postAmt}
            onChange={(event) => setPostAmt(event.target.value)}
            inputMode="decimal"
            aria-label="Activate amount"
          />
          <button type="button" className="pid-lux-btn pid-lux-btn--fill" onClick={() => run(applyActivate(book, parseAmount(postAmt)))}>
            Post PALM
          </button>
          <button type="button" className="pid-lux-btn" onClick={() => run(applyDeactivate(book, parseAmount(postAmt)))}>
            Release
          </button>
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
              <button type="button" className="pid-lux-btn" onClick={() => run(applySpend(book, item.id, item.price))}>
                Spend
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="pid-lux-desk-block">
        <p className="text-[11px] leading-5 text-[var(--faint)]">
          Credits are PALM in another form. {LTV * 100}% LTV borrow stays on the Marketplace tab. Sketch on this device.
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
