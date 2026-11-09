import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useAppState } from "../../AppState.jsx";
import { formatCredits } from "../../glmChat.js";
import {
  BORROW_APY,
  CRAWLER,
  CREDIT_PRICE,
  LIQ_LTV,
  LTV,
  OPS_MONTH,
  PALM_PER_CREDIT,
  SUPPLY_APY,
  applyBorrow,
  applyBuy,
  applyPledge,
  applyRepay,
  applySupply,
  applyWrap,
  hamrinTotal,
  loanHealth,
  money,
  parseAmount,
  useMarketBook,
  windowFromHoldings,
} from "../../market.js";
import { Card, Field, Ghost, Page, Primary, Section, Tabs } from "../ui.jsx";

const TABS = [
  { id: "desk", label: "Desk" },
  { id: "wrap", label: "Wrap" },
  { id: "services", label: "Services" },
  { id: "lend", label: "Lend" },
];

export default function MarketplaceView({ credit = null }) {
  const { notice } = useAppState();
  const { address, isConnected } = useAccount();
  const { book, save, reset } = useMarketBook(address, credit);
  const [tab, setTab] = useState("desk");
  const [wrapAmt, setWrapAmt] = useState("1000");
  const [lendAmt, setLendAmt] = useState("1000");
  const [supplyAmt, setSupplyAmt] = useState("500");

  const run = (result) => {
    if (result.error) {
      notice(result.error);
      return;
    }
    save(result.book);
    notice(result.note);
  };

  const amount = (text) => parseAmount(text);

  const health = useMemo(() => loanHealth(book), [book]);
  const windowCredits = windowFromHoldings(credit);
  const hamrin = hamrinTotal(credit, book);

  const copy = {
    desk: "PALM matches wPALM. wPALM buys work. Staked PALM can back a loan.",
    wrap: "Lock PALM, mint wPALM. Burn wPALM, unlock PALM. Always 1:1.",
    services: "Spend wPALM on credits, Ops, and crawler time.",
    lend: "Pledge PALM as collateral. Supply wPALM. Borrow against the book.",
  };

  return (
    <Page wide>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-[0.28em] text-[var(--faint)]">PALM DESK</div>
          <div className="mt-1 text-[22px]">Marketplace</div>
          <p className="mt-1 max-w-[640px] text-[13px] leading-5 text-[var(--muted)]">{copy[tab]}</p>
        </div>
        <Ghost
          onClick={() => {
            reset();
            notice("Demo book reset.");
          }}
        >
          Reset demo book
        </Ghost>
      </div>

      <p className="mb-4 text-[12.5px] leading-5 text-[var(--muted)]">
        PALM is what you hold and stake. Wrap 1 PALM, get 1 wPALM — a vault, not a mint. Holdings mint the 14-day Hamrin
        window ({PALM_PER_CREDIT.toLocaleString()} PALM = 1 credit). Extra credits, Ops, and crawler time settle in wPALM.
        This screen is a live sketch of that book. Wrap and lend are not on-chain yet.
        {isConnected ? "" : " Connect a wallet to seed the sketch from holdings."}
      </p>

      <BookStrip book={book} hamrin={hamrin} />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "desk" && (
        <>
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <Flow title="Hold" body={`PALM in the wallet and the staking contract. Holdings mint the 14-day Hamrin window (${PALM_PER_CREDIT.toLocaleString()} PALM = 1 credit).`} />
            <Flow title="Wrap" body="Lock PALM in the wrapper. Mint wPALM 1:1. Unwrap burns wPALM and returns PALM. No extra supply." />
            <Flow title="Spend or borrow" body="Buy a service with wPALM, or pledge PALM at 40% LTV and borrow wPALM so you do not have to sell." />
          </div>
          <Section title="Posted book (sketch)">
            <Card>
              <Quote name="Hamrin extra credit" price={`${money(CREDIT_PRICE)} wPALM`} note="One-shot. Stacks on the holdings window and does not reset with it." />
              <Quote name="Ops hosting · 30 days" price={`${money(OPS_MONTH)} wPALM`} note="Matches the DAO monthly hosting vote. Paid in wPALM, not a card." />
              <Quote name="Crawler pane" price={`${money(CRAWLER)} wPALM`} note="Extra live pane on the desk." />
              <Quote name="Borrow vs pledged PALM" price="40% LTV · liq 75%" note={`Supply APY ${SUPPLY_APY * 100}% · borrow APY ${BORROW_APY * 100}%.`} />
            </Card>
          </Section>
          <div className="flex flex-wrap gap-2">
            <Primary onClick={() => setTab("wrap")}>Open wrap</Primary>
            <Ghost onClick={() => setTab("services")}>Open services</Ghost>
            <Ghost onClick={() => setTab("lend")}>Open lend</Ghost>
          </div>
        </>
      )}

      {tab === "wrap" && (
        <>
          <p className="mb-4 text-[13px] leading-5 text-[var(--muted)]">
            The wrapper is a vault, not a mint. PALM in → wPALM out. wPALM in → PALM out. Same number both ways. wPALM is what the desk, Ops, and the lending pool settle in.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="space-y-3 p-4">
              <div className="text-[15px]">Wrap PALM → wPALM</div>
              <p className="text-[12.5px] leading-5 text-[var(--muted)]">Lock PALM. Receive wPALM at 1:1.</p>
              <Field label="Amount" value={wrapAmt} onChange={setWrapAmt} placeholder="1000" />
              <Primary onClick={() => run(applyWrap(book, amount(wrapAmt), true))}>Wrap</Primary>
            </Card>
            <Card className="space-y-3 p-4">
              <div className="text-[15px]">Unwrap wPALM → PALM</div>
              <p className="text-[12.5px] leading-5 text-[var(--muted)]">Burn wPALM. Unlock the same PALM. Free collateral is not touched.</p>
              <Field label="Amount" value={wrapAmt} onChange={setWrapAmt} placeholder="1000" />
              <Ghost onClick={() => run(applyWrap(book, amount(wrapAmt), false))}>Unwrap</Ghost>
            </Card>
          </div>
          <p className="mt-4 text-[12px] leading-5 text-[var(--faint)]">
            Vault rule: circulating wPALM equals PALM locked in the wrapper. If that ever diverges, unwrap halts.
          </p>
        </>
      )}

      {tab === "services" && (
        <>
          <p className="mb-4 text-[13px] leading-5 text-[var(--muted)]">
            Holdings still earn the 14-day Hamrin window ({formatCredits(windowCredits)} from this wallet). The desk sells extra work in wPALM so a wallet that is short this window can keep going without dumping PALM.
          </p>
          <Service
            name="Hamrin extra credit"
            price={CREDIT_PRICE}
            note="One credit of Hamrin inference. Stacks on the holdings window and does not expire with it."
            onBuy={() => run(applyBuy(book, "credit", CREDIT_PRICE, 1))}
          />
          <Service
            name="Ops hosting · 30 days"
            price={OPS_MONTH}
            note="One site-month on ops.palmaierc.com. The DAO already chose a monthly fee. This is that fee, in wPALM."
            onBuy={() => run(applyBuy(book, "ops", OPS_MONTH))}
          />
          <Service
            name="Crawler pane"
            price={CRAWLER}
            note="Another live crawler pane."
            onBuy={() => run(applyBuy(book, "crawler", CRAWLER))}
          />
          <p className="mt-3 text-[12px] leading-5 text-[var(--faint)]">
            Tools that ship with /root stay free. Paid packs will list here in wPALM. Hamrin now: {formatCredits(hamrin)} ({formatCredits(windowCredits)} holdings · +{formatCredits(book.extra)} desk).
          </p>
        </>
      )}

      {tab === "lend" && (
        <>
          <p className="mb-4 text-[13px] leading-5 text-[var(--muted)]">
            Do not sell PALM to pay for a month of Ops. Pledge it. The pool lends wPALM against PALM at 40% LTV. If the loan climbs to 75% of collateral, the book takes PALM to cover the wPALM. Lenders earn the borrow rate minus a cut that goes to stakers.
          </p>
          <Card className="mb-4 px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="text-[11px] tracking-[0.18em] text-[var(--faint)]">LOAN HEALTH</div>
                <div className="mt-1 text-[22px] tabular-nums">{health == null ? "—" : `${health.toFixed(2)}×`}</div>
              </div>
              <p className="max-w-[420px] text-[12px] leading-5 text-[var(--muted)]">
                {book.borrowed <= 0
                  ? "No borrow. Health is collateral × 40% / debt. Below 1.00 the position is in range of liquidation."
                  : "Keep this above 1.00. Liquidation starts at 75% LTV."}
              </p>
            </div>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="space-y-3 p-4">
              <div className="text-[15px]">Collateral and borrow</div>
              <p className="text-[12.5px] leading-5 text-[var(--muted)]">Pledge free PALM. Borrow wPALM up to 40% of pledged PALM.</p>
              <Field label="Amount" value={lendAmt} onChange={setLendAmt} placeholder="1000" />
              <div className="flex flex-wrap gap-2">
                <Ghost onClick={() => run(applyPledge(book, amount(lendAmt)))}>Pledge as collateral</Ghost>
                <Primary onClick={() => run(applyBorrow(book, amount(lendAmt)))}>Borrow wPALM</Primary>
                <Ghost onClick={() => run(applyRepay(book, amount(lendAmt)))}>Repay</Ghost>
              </div>
            </Card>
            <Card className="space-y-3 p-4">
              <div className="text-[15px]">Supply wPALM</div>
              <p className="text-[12.5px] leading-5 text-[var(--muted)]">
                Lenders deposit wPALM. They earn {SUPPLY_APY * 100}%. Borrowers pay {BORROW_APY * 100}%. The spread is protocol fee. Liq {LIQ_LTV * 100}%.
              </p>
              <Field label="Amount" value={supplyAmt} onChange={setSupplyAmt} placeholder="500" />
              <div className="flex flex-wrap gap-2">
                <Primary onClick={() => run(applySupply(book, amount(supplyAmt), true))}>Supply</Primary>
                <Ghost onClick={() => run(applySupply(book, amount(supplyAmt), false))}>Withdraw</Ghost>
              </div>
            </Card>
          </div>
        </>
      )}
    </Page>
  );
}

function BookStrip({ book, hamrin }) {
  const stats = [
    ["PALM free", money(book.palm)],
    ["wPALM", money(book.wpalm)],
    ["Hamrin", formatCredits(hamrin)],
    ["Collateral", money(book.collateral)],
    ["Borrowed", money(book.borrowed)],
  ];
  return (
    <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
      {stats.map(([label, value]) => (
        <Card key={label} className="px-3 py-3.5 text-center">
          <div className="text-[10px] tracking-[0.16em] text-[var(--faint)]">{label}</div>
          <div className="mt-1.5 text-[18px] tabular-nums">{value}</div>
        </Card>
      ))}
    </div>
  );
}

function Flow({ title, body }) {
  return (
    <Card className="p-4">
      <div className="text-[11px] tracking-[0.2em] text-[var(--faint)]">{title.toUpperCase()}</div>
      <p className="mt-2 text-[13px] leading-5 text-[var(--muted)]">{body}</p>
    </Card>
  );
}

function Quote({ name, price, note }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--stroke-soft)] px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="text-[13px]">{name}</div>
        <div className="mt-0.5 text-[11.5px] leading-5 text-[var(--muted)]">{note}</div>
      </div>
      <div className="shrink-0 pt-0.5 text-[13px] tabular-nums">{price}</div>
    </div>
  );
}

function Service({ name, price, note, onBuy }) {
  return (
    <Card className="mb-2 flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="text-[14px]">{name}</div>
        <p className="mt-1 text-[12.5px] leading-5 text-[var(--muted)]">{note}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="text-[13px] tabular-nums">{money(price)} wPALM</div>
        <Primary onClick={onBuy}>Buy with wPALM</Primary>
      </div>
    </Card>
  );
}
