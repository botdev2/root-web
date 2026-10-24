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
    <div className="day-ring relative mx-auto h-[min(320px,86vw)] w-[min(320px,86vw)]">
      <div
        className="day-ring-glow pointer-events-none absolute left-1/2 top-1/2 h-[308px] w-[308px] -translate-x-1/2 -translate-y-1/2 rounded-full"
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
                className={`relative overflow-hidden text-center transition-transform duration-200 ${
                  selected ? "z-[1] scale-[1.03]" : "scale-100"
                }`}
                style={{ background: meta.tint, boxShadow: selected ? "inset 0 0 0 2.5px var(--accent)" : "none" }}
              >
                <span className="absolute inset-0 bg-black/28" />
                {passed && <span className="absolute inset-0 bg-[rgb(48,52,60)]/78" />}
                {complete && <span className="absolute inset-0 bg-[rgb(34,197,94)]/42" />}
                {dimmed && <span className="absolute inset-0 bg-[rgb(8,10,16)]/58" />}
                <span className="relative z-[1] flex h-full flex-col items-center justify-center text-white">
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

      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 320 320">
        {DAY_PARTS.map((part) => {
          const selected = selectedPart === part;
          return (
            <path
              key={part}
              d={arcPath(ARC_START[part])}
              fill="none"
              stroke={selected ? "var(--accent)" : "var(--stroke)"}
              strokeWidth={selected ? 4.5 : 2.5}
              strokeLinecap="round"
              opacity={selected ? 1 : selectedPart ? 0.22 : 0.55}
            />
          );
        })}
        <line x1={mx1} y1={my1} x2={mx2} y2={my2} stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={mdx} cy={mdy} r="3.2" fill="white" stroke="rgba(0,0,0,0.47)" strokeWidth="0.5" />
        <text x={mlx} y={mly} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.82)" fontSize="8" fontWeight="600">
          00:00
        </text>
        <g transform={`rotate(${angle} 160 160)`}>
          <polygon points="319,155 319,165 305,160" fill="white" stroke="rgba(0,0,0,0.38)" strokeWidth="0.6" />
          <circle cx="319" cy="160" r="3.5" fill="white" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
        </g>
        <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.82)" fontSize="8" fontWeight="600">
          {formatClockShort(now)}
        </text>
      </svg>

      <button
        type="button"
        onClick={() => onSelectPart?.(null)}
        className={`absolute left-1/2 top-1/2 z-[4] flex h-[148px] w-[148px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--panel)_60%,transparent)] backdrop-blur-md ${
          selectedPart ? "border border-[var(--stroke)]" : "border-2 border-[var(--accent)]"
        }`}
      >
        <div className="text-[15px] font-semibold">{formatWeekday(now)}</div>
        <div className="mt-0.5 text-[11px] text-[var(--muted)]">{formatCenterDate(now)}</div>
        <div className="mt-2 text-[28px] font-bold leading-none">
          {done} / {scored.length}
        </div>
      </button>
    </div>
  );
}
