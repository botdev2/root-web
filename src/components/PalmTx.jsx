import { Card } from "./ui.jsx";

const KIND = {
  in: { label: "Received", sign: "+", tone: "var(--green)" },
  out: { label: "Sent", sign: "−", tone: "var(--rose)" },
  stake: { label: "Staked", sign: "−", tone: "var(--amber)" },
  unstake: { label: "Unstaked", sign: "+", tone: "var(--green)" },
};

function formatPalm(value) {
  const amount = Math.abs(Number(value) || 0);
  if (amount >= 1e6) return (amount / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (amount >= 1e5) return (amount / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return amount.toLocaleString("en-US", { maximumFractionDigits: amount < 100 ? 2 : 0 });
}

function formatWhen(at) {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function scan(txs) {
  return (txs || []).reduce(
    (sum, tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.kind === "in" || tx.kind === "unstake") sum.in += amount;
      else sum.out += amount;
      if (tx.kind === "stake") sum.staked += amount;
      if (tx.kind === "unstake") sum.unstaked += amount;
      return sum;
    },
    { in: 0, out: 0, staked: 0, unstaked: 0 },
  );
}

export default function PalmTxList({ txs, loading }) {
  const rows = Array.isArray(txs) ? txs : [];
  const totals = scan(rows);
  return (
    <section className="mb-6">
      <div className="mb-2 text-[12px] text-[var(--faint)]">$PALM activity · last 30 days</div>
      <Card>
        <div className="grid grid-cols-2 gap-px border-b border-[var(--stroke-soft)] bg-[var(--stroke-soft)] sm:grid-cols-4">
          {[
            ["In", totals.in, "var(--green)"],
            ["Out", totals.out, "var(--rose)"],
            ["Staked", totals.staked, "var(--amber)"],
            ["Unstaked", totals.unstaked, "var(--green)"],
          ].map(([label, value, tone]) => (
            <div key={label} className="bg-[var(--panel)] px-4 py-3">
              <div className="text-[11px] text-[var(--faint)]">{label}</div>
              <div className="mt-0.5 text-[15px] font-semibold" style={{ color: tone }}>
                {formatPalm(value)}
              </div>
            </div>
          ))}
        </div>
        {loading && !rows.length ? (
          <div className="px-4 py-6 text-[13px] text-[var(--muted)]">Reading transfers…</div>
        ) : !rows.length ? (
          <div className="px-4 py-6 text-[13px] text-[var(--muted)]">No $PALM transfers in the last month.</div>
        ) : (
          <ul>
            {rows.map((tx) => {
              const kind = KIND[tx.kind] || KIND.out;
              return (
                <li key={tx.hash} className="flex items-center justify-between gap-3 border-b border-[var(--stroke-soft)] px-4 py-3 last:border-b-0">
                  <div className="min-w-0">
                    <div className="text-[13px] text-[var(--ink)]">{kind.label}</div>
                    <div className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
                      {formatWhen(tx.at)} · {tx.counterparty}
                    </div>
                  </div>
                  <a
                    href={`https://etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-right text-[13px] font-semibold no-underline"
                    style={{ color: kind.tone }}
                  >
                    {kind.sign}
                    {formatPalm(tx.amount)}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </section>
  );
}
