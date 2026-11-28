import { useState } from "react";
import DayRing from "./DayRing.jsx";
import { Icon } from "./Icons.jsx";
import useNow from "../hooks/useNow.js";
import { DAY_PART_META, dayPartFromDate, formatClock, formatDateLine } from "../dayClock.js";
import { noteLinkLabel, remindLabel } from "../dayNotes.js";

export default function DayTasksPanel({ goals, onToggleGoal, onEdit, onOpenLink }) {
  const now = useNow();
  const [filter, setFilter] = useState(dayPartFromDate());
  const part = filter || dayPartFromDate(now);
  const rows = goals.filter((item) => (item.part || dayPartFromDate()) === part);

  return (
    <div className="mx-auto w-full max-w-[420px] px-1 pt-2 pb-4 text-center md:px-2 md:pt-6 md:pb-2">
      <div className="relative inline-flex items-start justify-center">
        <div className="home-title text-[32px] font-light leading-none tabular-nums md:text-[42px]">{formatClock(now)}</div>
        {onEdit && (
          <button
            type="button"
            aria-label="Edit notes"
            title="Edit notes"
            onClick={onEdit}
            className="absolute -right-8 top-1 flex h-7 w-7 items-center justify-center rounded-md text-[var(--faint)] hover:bg-[var(--hover)] hover:text-[var(--ink)] md:-right-9 md:top-2"
          >
            <Icon name="edit" size={15} />
          </button>
        )}
      </div>
      <div className="mt-1 text-[13px] text-[var(--muted)]">{formatDateLine(now)}</div>
      <div className="mt-3 md:mt-4">
        <DayRing now={now} goals={goals} selectedPart={filter} onSelectPart={setFilter} />
      </div>
      <div className="mx-4 mt-4 space-y-1 text-left md:mx-7 md:mt-5">
        {rows.length === 0 ? (
          <div className="py-2 text-center text-[12.5px] text-[var(--faint)]">
            No notes for {DAY_PART_META[part].name} yet.
            {onEdit && (
              <button type="button" onClick={onEdit} className="mt-1 block w-full text-[12px] text-[var(--accent)]">
                Add one
              </button>
            )}
          </div>
        ) : (
          rows.map((item) => {
            const link = noteLinkLabel(item);
            const remind = remindLabel(item);
            return (
              <div
                key={item.id}
                className={`flex w-full items-start gap-2.5 rounded-xl px-1 py-2 ${item.done ? "opacity-70" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => onToggleGoal?.(item.id)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    item.done ? "border-[var(--green)] bg-[var(--green)] text-[var(--bg)]" : "border-[var(--stroke)]"
                  }`}
                  aria-label={item.done ? "Mark open" : "Mark done"}
                >
                  {item.done ? "✓" : ""}
                </button>
                <div className="min-w-0 flex-1 text-left">
                  <button
                    type="button"
                    onClick={() => onToggleGoal?.(item.id)}
                    className={`block w-full text-left text-[14px] leading-5 ${
                      item.done ? "text-[var(--muted)] line-through" : ""
                    }`}
                  >
                    {item.text}
                  </button>
                  {(link || remind) && (
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-[var(--muted)]">
                      {link && (
                        <button
                          type="button"
                          onClick={() => onOpenLink?.(item)}
                          className="inline-flex items-center gap-1 hover:text-[var(--ink)]"
                        >
                          <Icon name={item.conversationId ? "chat" : "folder"} size={11} />
                          {link}
                        </button>
                      )}
                      {remind && (
                        <span className="inline-flex items-center gap-1 text-[var(--accent)]">
                          <Icon name="bell" size={11} />
                          {remind}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
