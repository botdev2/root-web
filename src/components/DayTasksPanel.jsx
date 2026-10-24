import { useState } from "react";
import DayRing from "./DayRing.jsx";
import useNow from "../hooks/useNow.js";
import { DAY_PART_META, dayPartFromDate, formatClock, formatDateLine } from "../dayClock.js";

export default function DayTasksPanel({ goals, onToggleGoal }) {
  const now = useNow();
  const [filter, setFilter] = useState(dayPartFromDate());
  const part = filter || dayPartFromDate(now);
  const rows = goals.filter((item) => (item.part || dayPartFromDate()) === part);

  return (
    <div className="mx-auto w-full max-w-[420px] px-2 pt-6 pb-2 text-center">
      <div className="home-title text-[42px] font-light leading-none tabular-nums">{formatClock(now)}</div>
      <div className="mt-1 text-[13px] text-[var(--muted)]">{formatDateLine(now)}</div>
      <div className="mt-4">
        <DayRing now={now} goals={goals} selectedPart={filter} onSelectPart={setFilter} />
      </div>
      <div className="mx-7 mt-5 space-y-1 text-left">
        {rows.length === 0 ? (
          <div className="py-2 text-center text-[12.5px] text-[var(--faint)]">
            No tasks for {DAY_PART_META[part].name} yet.
          </div>
        ) : (
          rows.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggleGoal?.(item.id)}
              className={`flex w-full items-center gap-2.5 px-1 py-2 text-left ${item.done ? "opacity-70" : ""}`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  item.done ? "border-[var(--green)] bg-[var(--green)] text-[var(--bg)]" : "border-[var(--stroke)]"
                }`}
              >
                {item.done ? "✓" : ""}
              </span>
              <span className={`text-[14px] ${item.done ? "text-[var(--muted)] line-through" : ""}`}>{item.text}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
