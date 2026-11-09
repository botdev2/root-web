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
  applyBorrow,
  applyConvert,
  applyRepay,
  applySpend,
  applySupply,
  creditsOf,
  loanHealth,
  money,
  palmAmount,
  parseAmount,
  useMarketBook,
  wpalmOf,
} from "../../market.js";
import { Card, Field, Ghost, Page, Primary, Section, Tabs } from "../ui.jsx";

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "services", label: "Services" },
  { id: "convert", label: "Convert" },
  { id: "lend", label: "Lend" },
];

export default function MarketplaceView({ credit = null }) {
  const { notice } = useAppState();
  const { address, isConnected } = useAccount();
  const { book, save, reset } = useMarketBook(address);
  const [tab, setTab] = useState("summary");
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
  const held = palmAmount(credit?.held);
  const staked = palmAmount(credit?.staked);
  const wpalm = wpalmOf(credit);
  const credits = creditsOf(book, credit);
  const health = useMemo(() => loanHealth(book, credit), [book, credit]);

  const copy = {
    summary: "wPALM is wallet PALM plus staked PALM. That is the whole number.",
    services: "Every PALM service spends credits. Credits are that wPALM.",
    convert: "Pay in any crypto. It converts to credits — still PALM behind them.",
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

      <BookStrip held={isConnected ? held : wpalm} staked={isConnected ? staked : 0} wpalm={wpalm} credits={credits} borrowed={book.borrowed} />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "summary" && (
        <>
          <Card className="mb-5 p-5">
            <div className="text-[11px] tracking-[0.22em] text-[var(--faint)]">SUMMARY · WIP</div>
            <p className="mt-3 max-w-[720px] text-[16px] leading-7 text-[var(--ink)]">
              An address has as much wPALM as it holds in the wallet and in stake, in total.
            </p>
            <p className="mt-3 max-w-[720px] text-[14px] leading-6 text-[var(--muted)]">
              Credits are that wPALM, in another form. Hamrin, Ops, hosting, crawler all spend the same credits. Other crypto just converts in. Nothing is minted on empty value.
            </p>
            <div className="mt-5 border-t border-[var(--stroke-soft)] pt-4">
              <div className="text-[11px] tracking-[0.2em] text-[var(--faint)]">THIS ADDRESS</div>
              <div className="mt-1 text-[22px] tabular-nums">{money(wpalm)} wPALM</div>
              <p className="mt-2 text-[13px] leading-5 text-[var(--muted)]">
                {money(isConnected ? held : wpalm)} in wallet + {money(isConnected ? staked : 0)} staked
                {isConnected ? "." : ". Connect a wallet to use live holdings."}
              </p>
            </div>
          </Card>
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <Flow title="Wallet" body="PALM sitting in the address." />
            <Flow title="Staked" body="PALM in the staking contract. Still yours. Still counts." />
            <Flow title="wPALM" body="Those two added together. 1 PALM = 1 wPALM. That is the credit supply." />
          </div>
          <Section title="Services (sketch)">
            <Card>
              <Quote name="Hamrin" price={`${money(HAMRIN)} credits`} note="Inference spends credits. It does not issue them." />
              <Quote name="Ops hosting · 30 days" price={`${money(OPS_MONTH)} credits`} note="Same credit unit as Hamrin." />
              <Quote name="Crawler pane" price={`${money(CRAWLER)} credits`} note="Same credit unit." />
            </Card>
          </Section>
          <div className="flex flex-wrap gap-2">
            <Primary onClick={() => setTab("services")}>Open services</Primary>
            <Ghost onClick={() => setTab("convert")}>Convert crypto</Ghost>
          </div>
        </>
      )}

      {tab === "services" && (
        <>
          <p className="mb-4 text-[13px] leading-5 text-[var(--muted)]">
            Spend from {money(wpalm)} wPALM on this address. Services do not mint a second credit.
          </p>
          <Service name="Hamrin" price={HAMRIN} note="Inference." onBuy={() => run(applySpend(book, credit, "hamrin", HAMRIN))} />
          <Service name="Ops hosting · 30 days" price={OPS_MONTH} note="ops.palmaierc.com" onBuy={() => run(applySpend(book, credit, "ops", OPS_MONTH))} />
          <Service name="Crawler pane" price={CRAWLER} note="Another live pane." onBuy={() => run(applySpend(book, credit, "crawler", CRAWLER))} />
          <p className="mt-3 text-[12px] leading-5 text-[var(--faint)]">{formatCredits(credits)} credits left on this sketch.</p>
        </>
      )}

      {tab === "convert" && (
        <>
          <p className="mb-4 text-[13px] leading-5 text-[var(--muted)]">
            Pay in ETH, USDC, or anything else. The desk converts it to credits. wPALM on the address stays wallet + staked until that PALM actually arrives. Sketch.
          </p>
          <Card className="max-w-[420px] space-y-3 p-4">
            <div className="text-[15px]">Convert to credits</div>
            <Field label="Credits" value={convertAmt} onChange={setConvertAmt} placeholder="100" />
            <Primary onClick={() => run(applyConvert(book, amount(convertAmt)))}>Convert other crypto</Primary>
          </Card>
        </>
      )}

      {tab === "lend" && (
        <>
          <p className="mb-4 text-[13px] leading-5 text-[var(--muted)]">
            Borrow against wallet + staked, at 40% LTV. The pool only lends PALM that is already there.
          </p>
          <Card className="mb-4 px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="text-[11px] tracking-[0.18em] text-[var(--faint)]">LOAN HEALTH</div>
                <div className="mt-1 text-[22px] tabular-nums">{health == null ? "—" : `${health.toFixed(2)}×`}</div>
              </div>
              <p className="max-w-[420px] text-[12px] leading-5 text-[var(--muted)]">
                {book.borrowed <= 0 ? "No borrow." : "Keep this above 1.00. Liquidation starts at 75% LTV."}
              </p>
            </div>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="space-y-3 p-4">
              <div className="text-[15px]">Borrow</div>
              <p className="text-[12.5px] leading-5 text-[var(--muted)]">40% of wallet + staked. Credits come from pool PALM.</p>
              <Field label="Amount" value={lendAmt} onChange={setLendAmt} placeholder="1000" />
              <div className="flex flex-wrap gap-2">
                <Primary onClick={() => run(applyBorrow(book, credit, amount(lendAmt)))}>Borrow credits</Primary>
                <Ghost onClick={() => run(applyRepay(book, amount(lendAmt)))}>Repay</Ghost>
              </div>
            </Card>
            <Card className="space-y-3 p-4">
              <div className="text-[15px]">Supply PALM</div>
              <p className="text-[12.5px] leading-5 text-[var(--muted)]">
                Earn {SUPPLY_APY * 100}%. Borrowers pay {BORROW_APY * 100}%. Liq {LIQ_LTV * 100}%.
              </p>
              <Field label="Amount" value={supplyAmt} onChange={setSupplyAmt} placeholder="500" />
              <div className="flex flex-wrap gap-2">
                <Primary onClick={() => run(applySupply(book, credit, amount(supplyAmt), true))}>Supply</Primary>
                <Ghost onClick={() => run(applySupply(book, credit, amount(supplyAmt), false))}>Withdraw</Ghost>
              </div>
            </Card>
          </div>
        </>
      )}
    </Page>
  );
}

function BookStrip({ held, staked, wpalm, credits, borrowed }) {
  const stats = [
    ["Wallet", money(held)],
    ["Staked", money(staked)],
    ["wPALM", money(wpalm)],
    ["Credits left", formatCredits(credits)],
    ["Borrowed", money(borrowed)],
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
