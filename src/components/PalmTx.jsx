const KIND = {
  in: { label: "Received", sign: "+" },
  out: { label: "Sent", sign: "−" },
  stake: { label: "Staked", sign: "−" },
  unstake: { label: "Unstaked", sign: "+" },
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
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
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

export default function PalmTxList({ txs, loading, edition }) {
  const rows = Array.isArray(txs) ? txs : [];
  const totals = scan(rows);
  const figures = [
    ["Received", totals.in],
    ["Sent", totals.out],
    ["Staked", totals.staked],
    ["Unstaked", totals.unstaked],
  ];

  return (
    <section className={`mx-auto w-full ${edition ? "pid-ledger mt-8 max-w-[760px]" : "mb-6"}`}>
      <div className={`mb-3 ${edition ? "text-center text-[10px] tracking-[0.36em] text-[var(--faint)]" : "text-[12px] text-[var(--faint)]"}`}>
        {edition ? "CONFIDENTIAL STATEMENT · LAST 30 DAYS" : "$PALM activity · last 30 days"}
      </div>
      <div className={edition ? "border-y border-[color-mix(in_srgb,var(--amber)_38%,var(--stroke))]" : "frost-panel rounded-2xl border border-[var(--stroke)]"}>
        <div className={`grid grid-cols-2 sm:grid-cols-4 ${edition ? "gap-0" : "gap-px bg-[var(--stroke-soft)]"}`}>
          {figures.map(([label, value]) => (
            <div key={label} className={edition ? "px-3 py-5 text-center sm:px-4" : "bg-[var(--panel)] px-4 py-3"}>
              <div className={edition ? "text-[9px] tracking-[0.2em] text-[var(--faint)]" : "text-[11px] text-[var(--faint)]"}>{label}</div>
              <div className={`mt-1 font-semibold tabular-nums ${edition ? "text-[16px] tracking-[0.04em] text-[var(--ink)]" : "text-[15px]"}`}>
                {formatPalm(value)}
              </div>
            </div>
          ))}
        </div>
        {loading && !rows.length ? (
          <div className="px-4 py-6 text-center text-[13px] text-[var(--muted)]">Reading transfers…</div>
        ) : !rows.length ? (
          <div className="px-4 py-6 text-center text-[13px] text-[var(--muted)]">No $PALM transfers in the last month.</div>
        ) : (
          <ul className={edition ? "border-t border-[var(--stroke-soft)]" : ""}>
            {rows.map((tx) => {
              const kind = KIND[tx.kind] || KIND.out;
              return (
                <li key={tx.hash} className="flex items-center justify-between gap-3 border-b border-[var(--stroke-soft)] px-4 py-3.5 last:border-b-0">
                  <div className="min-w-0">
                    <div className={`text-[13px] text-[var(--ink)] ${edition ? "tracking-[0.04em]" : ""}`}>{kind.label}</div>
                    <div className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
                      {formatWhen(tx.at)} · {tx.counterparty}
                    </div>
                  </div>
                  <a
                    href={`https://etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-right text-[13px] font-semibold tabular-nums tracking-[0.04em] text-[var(--ink)] no-underline"
                  >
                    {kind.sign}
                    {formatPalm(tx.amount)}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
