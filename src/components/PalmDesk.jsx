import { PALM_TOKEN, palmAmount, usd, usePalmUsd } from "../market.js";
import { PALM_PER_CREDIT, formatCredits } from "../glmChat.js";
import { levelOf } from "./views/QuestsView.jsx";

const STAKING = "0x9131d68c27507d68120b5c6659ff974b10902a0d";
const TIER_AT = [0, 1000, 2500, 10000, 25000, 50000, 100000, 250000];
const TIER_NAME = ["Guest", "Member", "Plus", "Silver", "Gold", "Platinum", "Black", "Reserve"];

function compact(value) {
  const amount = Math.abs(Number(value) || 0);
  if (amount >= 1e6) return (amount / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (amount >= 1e5) return (amount / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return amount.toLocaleString("en-US", { maximumFractionDigits: amount < 100 ? 2 : 0 });
}

function pct(share) {
  const p = (Number(share) || 0) * 100;
  if (p <= 0) return "0%";
  if (p < 1) return p.toFixed(1) + "%";
  return Math.round(p) + "%";
}

function passportNo(address) {
  const text = String(address || "").toLowerCase();
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619) >>> 0;
  }
  return "PALM" + String((value % 9000) + 1000).padStart(4, "0");
}

function scan(txs) {
  return (txs || []).reduce(
    (sum, tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.kind === "buy" || tx.kind === "in" || tx.kind === "unstake") sum.in += amount;
      else sum.out += amount;
      return sum;
    },
    { in: 0, out: 0 },
  );
}

function tierOf(total) {
  let index = 0;
  TIER_AT.forEach((min, i) => {
    if (total >= min) index = i;
  });
  return index;
}

export default function PalmDesk({ address, credit, txs }) {
  const price = usePalmUsd();
  const held = palmAmount(credit?.held);
  const staked = palmAmount(credit?.staked);
  const total = held + staked;
  const tier = tierOf(total);
  const next = tier < TIER_AT.length - 1 ? tier + 1 : null;
  const level = levelOf(credit?.points || 0);
  const windowCredits = credit?.windowAllowance ?? credit?.remaining;
  const rate = Number(credit?.palmPerCredit) || PALM_PER_CREDIT;
  const movement = scan(txs);
  const net = movement.in - movement.out;
  const stakeShare = total > 0 ? staked / total : 0;
  const walletShare = total > 0 ? held / total : 0;

  return (
    <section id="account" className="pid-lux-desk">
      <div className="pid-lux-desk-head">
        <div>
          <div className="text-[11px] tracking-[0.22em] text-[var(--faint)]">PASSPORT</div>
          <div className="mt-1 text-[16px]">{passportNo(address)}</div>
        </div>
        <div className="text-[12px] text-[var(--muted)]">{TIER_NAME[tier]}</div>
      </div>

      <ul className="pid-lux-desk-block">
        <Row
          label="Tier"
          value={TIER_NAME[tier]}
          note={next ? `${compact(Math.max(0, TIER_AT[next] - total))} $PALM to ${TIER_NAME[next]}` : "Reserve"}
        />
        <Row label="Level" value={String(level.number)} note={`${(credit?.points || 0).toLocaleString()} pts`} />
        <Row
          label="Hamrin"
          value={windowCredits != null ? formatCredits(windowCredits) + " cr" : "—"}
          note={`${rate.toLocaleString()} $PALM = 1 credit`}
        />
        <Row label="PALM" value={price ? usd(1, price) : "—"} note="Spot" />
      </ul>

      <div className="pid-lux-desk-block">
        <div className="text-[11px] tracking-[0.16em] text-[var(--faint)]">ALLOCATION</div>
        <div className="pid-lux-splitbar mt-3" aria-hidden="true">
          <div style={{ width: `${Math.max(1, walletShare * 100)}%` }} />
          <div style={{ width: `${Math.max(1, stakeShare * 100)}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <Meta label="Wallet" value={credit ? compact(held) : "—"} note={total ? pct(walletShare) : ""} />
          <Meta label="Staked" value={credit ? compact(staked) : "—"} note={total ? pct(stakeShare) : ""} />
        </div>
      </div>

      <div className="pid-lux-desk-block">
        <div className="text-[11px] tracking-[0.16em] text-[var(--faint)]">6 MONTHS</div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Meta label="In" value={txs ? compact(movement.in) : "—"} />
          <Meta label="Out" value={txs ? compact(movement.out) : "—"} />
          <Meta label="Net" value={txs ? (net >= 0 ? "+" : "−") + compact(net) : "—"} note={txs ? `${txs.length} tx` : ""} />
        </div>
      </div>

      <div className="pid-lux-desk-block pid-lux-desk-links">
        <a href={`https://etherscan.io/address/${address}`} target="_blank" rel="noopener noreferrer">
          Etherscan
        </a>
        <a href={`https://etherscan.io/token/${PALM_TOKEN}?a=${address}`} target="_blank" rel="noopener noreferrer">
          $PALM
        </a>
        <a href={`https://etherscan.io/address/${STAKING}`} target="_blank" rel="noopener noreferrer">
          Staking
        </a>
        <a href={`https://dexscreener.com/ethereum/${PALM_TOKEN}`} target="_blank" rel="noopener noreferrer">
          Chart
        </a>
      </div>
    </section>
  );
}

function Row({ label, value, note }) {
  return (
    <li className="pid-lux-listing">
      <div>
        <div className="text-[11px] tracking-[0.14em] text-[var(--faint)]">{label}</div>
        {note ? <div className="mt-0.5 text-[11px] text-[var(--muted)]">{note}</div> : null}
      </div>
      <div className="text-right tabular-nums">{value}</div>
    </li>
  );
}

function Meta({ label, value, note }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.14em] text-[var(--faint)]">{label}</div>
      <div className="mt-0.5 text-[15px] tabular-nums">{value}</div>
      {note ? <div className="mt-0.5 text-[11px] text-[var(--muted)]">{note}</div> : null}
    </div>
  );
}
