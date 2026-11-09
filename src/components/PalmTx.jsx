const KIND = {
  in: { label: "Incoming", sign: "+", debit: false },
  out: { label: "Outgoing", sign: "−", debit: true },
  stake: { label: "Staked", sign: "−", debit: true },
  unstake: { label: "Unstaked", sign: "+", debit: false },
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

function shortRef(hash) {
  const text = String(hash || "");
  if (text.length < 12) return text;
  return text.slice(0, 6) + "…" + text.slice(-4);
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

  if (!edition) {
    return (
      <section className="mx-auto mb-6 w-full">
        <div className="mb-3 text-[12px] text-[var(--faint)]">$PALM activity · last 30 days</div>
        <div className="frost-panel rounded-2xl border border-[var(--stroke)]">
          <div className="grid grid-cols-2 gap-px bg-[var(--stroke-soft)] sm:grid-cols-4">
            {figures.map(([label, value]) => (
              <div key={label} className="bg-[var(--panel)] px-4 py-3">
                <div className="text-[11px] text-[var(--faint)]">{label}</div>
                <div className="mt-1 text-[15px] font-semibold tabular-nums">{formatPalm(value)}</div>
              </div>
            ))}
          </div>
          {loading && !rows.length ? (
            <div className="px-4 py-6 text-center text-[13px] text-[var(--muted)]">Reading transfers…</div>
          ) : !rows.length ? (
            <div className="px-4 py-6 text-center text-[13px] text-[var(--muted)]">No $PALM transfers in the last month.</div>
          ) : (
            <ul>
              {rows.map((tx) => {
                const kind = KIND[tx.kind] || KIND.out;
                return (
                  <li key={tx.hash} className="flex items-center justify-between gap-3 border-b border-[var(--stroke-soft)] px-4 py-3.5 last:border-b-0">
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

  return (
    <section id="activity" className="pid-lux-panel mt-8">
      <div className="pid-lux-panel-head">
        <div>
          <div className="text-[11px] tracking-[0.2em] text-[var(--faint)]">ACTIVITY</div>
          <div className="mt-1 text-[15px]">Last 30 days · $PALM</div>
        </div>
        <div className="text-[12px] tabular-nums text-[var(--muted)]">Net {formatPalm(totals.in - totals.out)}</div>
      </div>
      <div className="grid grid-cols-2 border-y border-[color-mix(in_srgb,var(--amber)_28%,var(--stroke))] sm:grid-cols-4">
        {figures.map(([label, value]) => (
          <div key={label} className="px-4 py-4">
            <div className="text-[10px] tracking-[0.16em] text-[var(--faint)]">{label}</div>
            <div className="mt-1 text-[16px] tabular-nums">{formatPalm(value)}</div>
          </div>
        ))}
      </div>
      {loading && !rows.length ? (
        <div className="px-4 py-8 text-[13px] text-[var(--muted)]">Reading transfers…</div>
      ) : !rows.length ? (
        <div className="px-4 py-8 text-[13px] text-[var(--muted)]">No $PALM transfers in the last 30 days.</div>
      ) : (
        <div className="pid-lux-table-wrap">
          <table className="pid-lux-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Counterparty</th>
                <th className="pid-lux-num">$PALM</th>
                <th className="pid-lux-num">Tx</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => {
                const kind = KIND[tx.kind] || KIND.out;
                return (
                  <tr key={tx.hash}>
                    <td className="whitespace-nowrap">{formatWhen(tx.at)}</td>
                    <td>{kind.label}</td>
                    <td className="truncate font-normal">{tx.counterparty}</td>
                    <td className="pid-lux-num">
                      {kind.sign}
                      {formatPalm(tx.amount)}
                    </td>
                    <td className="pid-lux-num">
                      <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] no-underline hover:text-[var(--ink)]">
                        {shortRef(tx.hash)}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
