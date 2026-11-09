import { useAccount } from "wagmi";
import {
  BORROW_APY,
  LIQ_LTV,
  LISTINGS,
  LTV,
  SUPPLY_APY,
  money,
  palmAmount,
  usd,
  usePalmUsd,
  wpalmOf,
} from "../../market.js";
import { Card, Page, Section } from "../ui.jsx";

export default function MarketplaceView({ credit = null }) {
  const { isConnected } = useAccount();
  const price = usePalmUsd();
  const held = palmAmount(credit?.held);
  const staked = palmAmount(credit?.staked);
  const wpalm = wpalmOf(credit);
  const wallet = isConnected ? held : wpalm;
  const stake = isConnected ? staked : 0;

  return (
    <Page wide>
      <div className="mb-4">
        <div className="text-[11px] tracking-[0.28em] text-[var(--faint)]">PALM DESK · WIP</div>
        <div className="mt-1 text-[22px]">Marketplace</div>
        <p className="mt-1 max-w-[640px] text-[13px] leading-5 text-[var(--muted)]">
          wPALM is wallet PALM plus staked PALM. Same USD price as PALM. Mockup — nothing here spends.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Wallet" value={money(wallet)} />
        <Stat label="Staked" value={money(stake)} />
        <Stat label="wPALM" value={money(wpalm)} />
        <Stat label="USD" value={usd(wpalm, price)} hint={price ? `${usd(1, price)} / PALM` : "Same as PALM"} />
      </div>

      <Card className="mb-5 p-5">
        <div className="text-[11px] tracking-[0.22em] text-[var(--faint)]">SUMMARY · WIP</div>
        <p className="mt-3 max-w-[720px] text-[16px] leading-7 text-[var(--ink)]">
          An address has as much wPALM as it holds in the wallet and in stake, in total. 1 wPALM = 1 PALM, so the dollar value is the same.
        </p>
        {!isConnected && <p className="mt-3 text-[13px] text-[var(--muted)]">Connect a wallet to use live holdings.</p>}
      </Card>

      <Section title="Services · mockup">
        <Card>
          {LISTINGS.map((item) => (
            <Quote
              key={item.id}
              name={item.name}
              note={item.note}
              wpalm={item.wpalm}
              dollars={usd(item.wpalm, price)}
            />
          ))}
        </Card>
      </Section>

      <Section title="Also · mockup">
        <Card>
          <Quote name="Convert other crypto" note="Pays at the PALM USD price. You receive wPALM 1:1 with PALM." wpalm={null} dollars={price ? usd(1, price) + " / PALM" : "—"} />
          <Quote name="Borrow" note={`${LTV * 100}% LTV on wallet + staked. Liq ${LIQ_LTV * 100}%. Supply ${SUPPLY_APY * 100}% · borrow ${BORROW_APY * 100}%.`} wpalm={null} dollars="Pool PALM only" />
        </Card>
      </Section>
    </Page>
  );
}

function Stat({ label, value, hint }) {
  return (
    <Card className="px-3 py-3.5 text-center">
      <div className="text-[10px] tracking-[0.16em] text-[var(--faint)]">{label}</div>
      <div className="mt-1.5 text-[18px] tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[10px] text-[var(--muted)]">{hint}</div>}
    </Card>
  );
}

function Quote({ name, note, wpalm, dollars }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--stroke-soft)] px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="text-[13px]">{name}</div>
        {note && <div className="mt-0.5 text-[11.5px] leading-5 text-[var(--muted)]">{note}</div>}
      </div>
      <div className="shrink-0 pt-0.5 text-right">
        {wpalm != null && <div className="text-[13px] tabular-nums">{money(wpalm)} wPALM</div>}
        <div className={`tabular-nums ${wpalm != null ? "mt-0.5 text-[11px] text-[var(--muted)]" : "text-[13px]"}`}>{dollars}</div>
      </div>
    </div>
  );
}
