import {
  ARC_START,
  DAY_PARTS,
  DAY_PART_META,
  arcPath,
  dayPartFromDate,
  formatCenterDate,
  formatClockShort,
  formatWeekday,
  hasDayPartPassed,
  midnightAngle,
  polar,
  timeOfDayAngle,
} from "../dayClock.js";

const QUADRANTS = [
  { part: "morning", row: 1, col: 1 },
  { part: "afternoon", row: 1, col: 2 },
  { part: "night", row: 2, col: 1 },
  { part: "evening", row: 2, col: 2 },
];

function partCounts(goals, part) {
  const rows = goals.filter((item) => (item.part || dayPartFromDate()) === part);
  return { total: rows.length, undone: rows.filter((item) => !item.done).length, done: rows.filter((item) => item.done).length };
}

export default function DayRing({ now, goals = [], selectedPart, onSelectPart }) {
  const angle = timeOfDayAngle(now);
  const midnight = midnightAngle();
  const [lx, ly] = polar(160, 160, 188, angle);
  const [mx1, my1] = polar(160, 160, 154, midnight);
  const [mx2, my2] = polar(160, 160, 174, midnight);
  const [mdx, mdy] = polar(160, 160, 178, midnight);
  const [mlx, mly] = polar(160, 160, 188, midnight);
  const scored = goals.filter((item) => item.text?.trim());
  const done = scored.filter((item) => item.done).length;
  const wellness = scored.length ? done / scored.length : 0;

  return (
    <div className="day-ring relative mx-auto aspect-square w-[min(320px,calc(100%-5.5rem))]">
      <div
        className="day-ring-glow pointer-events-none absolute left-1/2 top-1/2 h-[96%] w-[96%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, var(--green) ${Math.round(20 + wellness * 40)}%, transparent), transparent 72%)`,
        }}
      />

      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div className="grid h-full w-full grid-cols-2 grid-rows-2">
          {QUADRANTS.map((cell) => {
            const meta = DAY_PART_META[cell.part];
            const counts = partCounts(goals, cell.part);
            const selected = selectedPart === cell.part;
            const dimmed = selectedPart && !selected;
            const passed = hasDayPartPassed(cell.part, now);
            const complete = counts.total > 0 && counts.undone === 0;
            return (
              <button
                key={cell.part}
                type="button"
                onClick={() => onSelectPart?.(selected ? null : cell.part)}
                className={`relative overflow-hidden bg-[var(--bg)] text-center transition-transform duration-200 ${
                  selected ? "z-[1] scale-[1.03]" : "scale-100"
                }`}
                style={{ boxShadow: selected ? "inset 0 0 0 2.5px var(--accent)" : "none" }}
              >
                <span
                  className="day-ring-photo absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(/day/${cell.part}.jpg)` }}
                />
                <span className="absolute inset-0" style={{ background: meta.tint }} />
                <span className="absolute inset-0" style={{ background: "var(--ring-scrim)" }} />
                {passed && <span className="absolute inset-0" style={{ background: "var(--ring-passed)" }} />}
                {complete && <span className="absolute inset-0 bg-[var(--green)]/40" />}
                {dimmed && <span className="absolute inset-0" style={{ background: "var(--ring-dim)" }} />}
                <span className="day-ring-label relative z-[1] flex h-full flex-col items-center justify-center">
                  <span className="text-[11px] font-semibold">{meta.name}</span>
                  {counts.total > 0 && (
                    <span className={`mt-0.5 text-[10px] font-semibold ${passed && counts.undone ? "line-through" : ""}`}>
                      {counts.undone}/{counts.total}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <svg
        className="pointer-events-none absolute left-1/2 top-1/2 h-[calc(100%+4.5rem)] w-[calc(100%+4.5rem)] -translate-x-1/2 -translate-y-1/2"
        viewBox="-36 -36 392 392"
      >
        {DAY_PARTS.map((part) => {
          const selected = selectedPart === part;
          return (
            <path
              key={part}
              d={arcPath(ARC_START[part])}
              fill="none"
              stroke={selected ? "var(--accent)" : "var(--ring-arc)"}
              strokeWidth={selected ? 4.5 : 2.5}
              strokeLinecap="round"
              opacity={selected ? 1 : selectedPart ? 0.22 : 0.55}
            />
          );
        })}
        <line x1={mx1} y1={my1} x2={mx2} y2={my2} stroke="var(--ring-ink)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={mdx} cy={mdy} r="3.2" fill="var(--ring-ink)" stroke="var(--ring-edge)" strokeWidth="0.6" />
        <text x={mlx} y={mly} textAnchor="middle" dominantBaseline="middle" fill="var(--ring-ink-soft)" fontSize="8" fontWeight="600">
          00:00
        </text>
        <g transform={`rotate(${angle} 160 160)`}>
          <polygon points="319,155 319,165 305,160" fill="var(--ring-ink)" stroke="var(--ring-edge)" strokeWidth="0.6" />
          <circle cx="319" cy="160" r="3.5" fill="var(--ring-ink)" stroke="var(--ring-edge)" strokeWidth="0.5" />
        </g>
        <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="var(--ring-ink-soft)" fontSize="8" fontWeight="600">
          {formatClockShort(now)}
        </text>
      </svg>

      <button
        type="button"
        onClick={() => onSelectPart?.(null)}
        className={`absolute left-1/2 top-1/2 z-[4] flex h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--panel)_60%,transparent)] backdrop-blur-md ${
          selectedPart ? "border border-[var(--stroke)]" : "border-2 border-[var(--accent)]"
        }`}
      >
        <div className="text-[13px] font-semibold md:text-[15px]">{formatWeekday(now)}</div>
        <div className="mt-0.5 text-[10px] text-[var(--muted)] md:text-[11px]">{formatCenterDate(now)}</div>
        <div className="mt-1.5 text-[22px] font-bold leading-none md:mt-2 md:text-[28px]">
          {done} / {scored.length}
        </div>
      </button>
    </div>
  );
}
