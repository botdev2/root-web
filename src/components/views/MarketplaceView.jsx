import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useAppState } from "../../AppState.jsx";
import { formatCredits } from "../../glmChat.js";
import {
  BORROW_APY,
  CRAWLER,
  HAMRIN,
  LIQ_LTV,
  LTV,
  OPS_MONTH,
  SUPPLY_APY,
  applyActivate,
  applyBorrow,
  applyConvert,
  applyDeactivate,
  applyRepay,
  applySpend,
  applySupply,
  creditsOf,
  loanHealth,
  money,
  parseAmount,
  useMarketBook,
  wpalmOf,
} from "../../market.js";
import { Card, Field, Ghost, Page, Primary, Section, Tabs } from "../ui.jsx";

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "activate", label: "Activate" },
  { id: "services", label: "Services" },
  { id: "convert", label: "Convert" },
  { id: "lend", label: "Lend" },
];

export default function MarketplaceView({ credit = null }) {
  const { notice } = useAppState();
  const { address, isConnected } = useAccount();
  const { book, save, reset } = useMarketBook(address, credit);
  const [tab, setTab] = useState("summary");
  const [postAmt, setPostAmt] = useState("1000");
  const [lendAmt, setLendAmt] = useState("1000");
  const [supplyAmt, setSupplyAmt] = useState("500");
  const [convertAmt, setConvertAmt] = useState("100");

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
  const wpalm = wpalmOf(book);
  const credits = creditsOf(book);

  const copy = {
    summary: "Credits are wPALM. wPALM is $PALM, in another form. WIP.",
    activate: "Post real PALM as collateral. That is what makes wPALM active.",
    services: "Every PALM service spends credits. Nothing here mints credits.",
    convert: "Pay in any crypto. The desk converts it to credits, backed by PALM.",
    lend: "The pool only lends PALM that is already there. No empty mint.",
  };

  return (
    <Page wide>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] tracking-[0.28em] text-[var(--faint)]">PALM DESK · WIP</div>
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

      <BookStrip book={book} wpalm={wpalm} credits={credits} />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "summary" && (
        <>
          <Card className="mb-5 p-5">
            <div className="text-[11px] tracking-[0.22em] text-[var(--faint)]">SUMMARY · WIP</div>
            <p className="mt-3 max-w-[720px] text-[14px] leading-6 text-[var(--ink)]">
              Instead of creating credits out of the blue for Ops and hosting, they are based on wPALM — the supply of $PALM.
              All PALM services use these credits. Paying direct in any crypto just converts to credits.
            </p>
            <p className="mt-3 max-w-[720px] text-[14px] leading-6 text-[var(--ink)]">
              For a wPALM to be active, it has to be collateralized with real $PALM. wPALM is not created on empty value.
              The credits are actual $PALM, just in a different form.
            </p>
            <div className="mt-5 border-t border-[var(--stroke-soft)] pt-4">
              <div className="text-[11px] tracking-[0.2em] text-[var(--faint)]">WHO HAS WPALM?</div>
              <div className="mt-1 text-[18px]">You have wPALM if you own $PALM.</div>
              <p className="mt-2 text-[13px] leading-5 text-[var(--muted)]">
                This wallet: {money(wpalm)} wPALM because it owns {money(wpalm)} $PALM. {formatCredits(credits)} active
                {isConnected ? "." : ". Connect a wallet to seed the sketch from holdings."}
              </p>
            </div>
          </Card>
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <Flow title="Own" body="Hold or stake PALM. That is already wPALM, 1:1 with the supply. Nobody mints a second token out of nothing." />
            <Flow title="Activate" body="Post that PALM as collateral. Only then is the matching wPALM active — spendable as credits." />
            <Flow title="Spend" body="Hamrin, Ops, hosting, crawler: all the same credits. Other crypto is converted in. It never becomes a credit without PALM behind it." />
          </div>
          <Section title="Posted book (sketch)">
            <Card>
              <Quote name="Hamrin" price={`${money(HAMRIN)} credits`} note="Inference spends credits. It does not issue them." />
              <Quote name="Ops hosting · 30 days" price={`${money(OPS_MONTH)} credits`} note="Same credit unit as Hamrin. No separate Ops credit." />
              <Quote name="Crawler pane" price={`${money(CRAWLER)} credits`} note="Another PALM service, same book." />
              <Quote name="Borrow" price="40% LTV · pool PALM only" note={`Supply APY ${SUPPLY_APY * 100}% · borrow ${BORROW_APY * 100}%. Liq ${LIQ_LTV * 100}%.`} />
            </Card>
          </Section>
          <div className="flex flex-wrap gap-2">
            <Primary onClick={() => setTab("activate")}>Activate wPALM</Primary>
            <Ghost onClick={() => setTab("services")}>Open services</Ghost>
            <Ghost onClick={() => setTab("convert")}>Convert crypto</Ghost>
          </div>
        </>
      )}

      {tab === "activate" && (
        <>
          <p className="mb-4 text-[13px] leading-5 text-[var(--muted)]">
            You already have wPALM if you own PALM. Posting it as collateral is what turns that wPALM on. Release it, and it goes idle again. 1 PALM posted = 1 active credit.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="space-y-3 p-4">
              <div className="text-[15px]">Post PALM · activate</div>
              <p className="text-[12.5px] leading-5 text-[var(--muted)]">Lock real PALM. The matching wPALM becomes spendable credits.</p>
              <Field label="Amount" value={postAmt} onChange={setPostAmt} placeholder="1000" />
              <Primary onClick={() => run(applyActivate(book, amount(postAmt)))}>Activate</Primary>
            </Card>
            <Card className="space-y-3 p-4">
              <div className="text-[15px]">Release PALM · idle</div>
              <p className="text-[12.5px] leading-5 text-[var(--muted)]">Take PALM off collateral. Those credits stop being active. Debt has to be clear first.</p>
              <Field label="Amount" value={postAmt} onChange={setPostAmt} placeholder="1000" />
              <Ghost onClick={() => run(applyDeactivate(book, amount(postAmt)))}>Release</Ghost>
            </Card>
          </div>
        </>
      )}

      {tab === "services" && (
        <>
          <p className="mb-4 text-[13px] leading-5 text-[var(--muted)]">
            All PALM services settle in the same credits. Buying a month of Ops does not mint an Ops credit. It spends wPALM that is already backed.
          </p>
          <Service name="Hamrin" price={HAMRIN} note="Inference. Spends credits; does not create them." onBuy={() => run(applySpend(book, "hamrin", HAMRIN))} />
          <Service name="Ops hosting · 30 days" price={OPS_MONTH} note="ops.palmaierc.com, paid in the same credits as Hamrin." onBuy={() => run(applySpend(book, "ops", OPS_MONTH))} />
          <Service name="Crawler pane" price={CRAWLER} note="Another live crawler pane. Same credit." onBuy={() => run(applySpend(book, "crawler", CRAWLER))} />
          <p className="mt-3 text-[12px] leading-5 text-[var(--faint)]">
            Active now: {formatCredits(credits)} credits · {money(book.posted)} PALM posted as collateral.
          </p>
        </>
      )}

      {tab === "convert" && (
        <>
          <p className="mb-4 text-[13px] leading-5 text-[var(--muted)]">
            Pay in ETH, USDC, or anything else. The desk does not issue empty credits. It converts the payment into credits and posts matching PALM as collateral. Sketch — the swap is not live.
          </p>
          <Card className="max-w-[420px] space-y-3 p-4">
            <div className="text-[15px]">Convert to credits</div>
            <p className="text-[12.5px] leading-5 text-[var(--muted)]">Amount of credits to receive. PALM is posted behind them 1:1.</p>
            <Field label="Credits" value={convertAmt} onChange={setConvertAmt} placeholder="100" />
            <Primary onClick={() => run(applyConvert(book, amount(convertAmt)))}>Convert other crypto</Primary>
          </Card>
        </>
      )}

      {tab === "lend" && (
        <>
          <p className="mb-4 text-[13px] leading-5 text-[var(--muted)]">
            Do not mint wPALM to lend. Supply PALM into the pool. Borrow only against posted PALM, and only up to what the pool already holds.
          </p>
          <Card className="mb-4 px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="text-[11px] tracking-[0.18em] text-[var(--faint)]">LOAN HEALTH</div>
                <div className="mt-1 text-[22px] tabular-nums">{health == null ? "—" : `${health.toFixed(2)}×`}</div>
              </div>
              <p className="max-w-[420px] text-[12px] leading-5 text-[var(--muted)]">
                {book.borrowed <= 0
                  ? "No borrow. Pool PALM backs every credit that leaves the pool."
                  : "Keep this above 1.00. Liquidation starts at 75% LTV."}
              </p>
            </div>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="space-y-3 p-4">
              <div className="text-[15px]">Borrow against posted PALM</div>
              <p className="text-[12.5px] leading-5 text-[var(--muted)]">40% LTV. The credits you receive are pool PALM, not a new mint.</p>
              <Field label="Amount" value={lendAmt} onChange={setLendAmt} placeholder="1000" />
              <div className="flex flex-wrap gap-2">
                <Primary onClick={() => run(applyBorrow(book, amount(lendAmt)))}>Borrow credits</Primary>
                <Ghost onClick={() => run(applyRepay(book, amount(lendAmt)))}>Repay</Ghost>
              </div>
            </Card>
            <Card className="space-y-3 p-4">
              <div className="text-[15px]">Supply PALM</div>
              <p className="text-[12.5px] leading-5 text-[var(--muted)]">
                Lenders deposit PALM. They earn {SUPPLY_APY * 100}%. Borrowers pay {BORROW_APY * 100}%. Liq {LIQ_LTV * 100}%.
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

function BookStrip({ book, wpalm, credits }) {
  const stats = [
    ["$PALM owned", money(wpalm)],
    ["wPALM", money(wpalm)],
    ["Active credits", formatCredits(credits)],
    ["Posted", money(book.posted)],
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
        <div className="text-[13px] tabular-nums">{money(price)} credits</div>
        <Primary onClick={onBuy}>Spend credits</Primary>
      </div>
    </Card>
  );
}
