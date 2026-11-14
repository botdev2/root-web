export default function LiveUsers({ stats, compact = false }) {
  if (!stats) return null;
  const live = Number(stats.live) || 0;
  const users = Number(stats.users) || 0;
  return (
    <div
      title={`${users.toLocaleString()} wallets on /root`}
      className={`flex items-center gap-1.5 ${
        compact
          ? ""
          : "rounded-lg border border-[var(--stroke)] bg-[var(--panel)] px-2.5 py-1"
      }`}
    >
      <span className="live-dot" aria-hidden="true" />
      <span className="tabular-nums text-[13px] text-[var(--ink)]">{live.toLocaleString()}</span>
      <span className="text-[10px] text-[var(--faint)]">live</span>
    </div>
  );
}
