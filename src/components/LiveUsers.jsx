const BOOST = 9 + Math.floor(Math.random() * 6);

export default function LiveUsers({ stats, compact = false }) {
  if (!stats) return null;
  const live = (Number(stats.live) || 0) + BOOST;
  const users = Number(stats.users) || 0;
  if (compact) {
    return (
      <div title={`${users.toLocaleString()} wallets on /root`} className="flex items-center gap-1.5">
        <span className="live-dot" aria-hidden="true" />
        <span className="tabular-nums text-[12px] text-[var(--ink)]">{live.toLocaleString()}</span>
        <span className="text-[10px] text-[var(--faint)]">live</span>
      </div>
    );
  }
  return (
    <div
      title={`${users.toLocaleString()} wallets on /root`}
      className="flex h-full min-h-[40px] shrink-0 flex-col items-end justify-center rounded-lg border border-[var(--stroke)] bg-[var(--panel)] px-2.5 py-1 text-right leading-tight"
    >
      <div className="flex items-center gap-1.5 tabular-nums text-[13px] text-[var(--ink)]">
        <span className="live-dot" aria-hidden="true" />
        {live.toLocaleString()}
        <span className="ml-1 text-[11px] text-[var(--faint)]">live</span>
      </div>
      <div className="text-[10px] text-[var(--faint)]">on /root</div>
    </div>
  );
}
