import { useMemo, useState } from "react";
import DayRing from "./DayRing.jsx";
import { Icon } from "./Icons.jsx";
import useNow from "../hooks/useNow.js";
import { DAY_PART_META, dayPartFromDate, formatClock, formatDateLine } from "../dayClock.js";
import { noteLinkLabel, remindLabel } from "../dayNotes.js";

function stamp(value) {
  const at = Date.parse(value || "");
  return Number.isFinite(at) ? at : 0;
}

function orderNotes(rows) {
  const open = [];
  const done = [];
  for (const item of rows) (item.done ? done : open).push(item);
  const byNext = (left, right) => {
    const leftAt = left.remindAt ? stamp(left.remindAt) : Number.MAX_SAFE_INTEGER;
    const rightAt = right.remindAt ? stamp(right.remindAt) : Number.MAX_SAFE_INTEGER;
    if (leftAt !== rightAt) return leftAt - rightAt;
    return stamp(left.createdAt) - stamp(right.createdAt);
  };
  open.sort(byNext);
  done.sort((left, right) => stamp(right.updatedAt || right.createdAt) - stamp(left.updatedAt || left.createdAt));
  return { open, done };
}

function attachLine(item) {
  const link = noteLinkLabel(item);
  if (item.conversationTitle && item.projectLabel && item.conversationTitle !== item.projectLabel) {
    return { kind: "chat", label: `${item.projectLabel} · ${item.conversationTitle}` };
  }
  if (link) return { kind: item.conversationId ? "chat" : "folder", label: link };
  return { kind: "none", label: "Unattached" };
}

export default function DayTasksPanel({ goals, onToggleGoal, onEdit, onOpenLink }) {
  const now = useNow();
  const [filter, setFilter] = useState(dayPartFromDate());
  const part = filter || dayPartFromDate(now);
  const rows = goals.filter((item) => (item.part || dayPartFromDate()) === part);
  const { open, done } = useMemo(() => orderNotes(rows), [rows]);

  return (
    <div className="mx-auto w-full max-w-[440px] px-1 pt-2 pb-4 text-center md:px-2 md:pt-6 md:pb-2">
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

      <div key={part} className="mx-2 mt-5 space-y-2 text-left md:mx-4">
        {rows.length === 0 ? (
          <div className="note-rise rounded-2xl border border-dashed border-[var(--stroke)] px-4 py-5 text-center">
            <div className="text-[12px] tracking-[0.18em] text-[var(--faint)]">NEXT UP</div>
            <div className="mt-1.5 text-[13.5px] text-[var(--muted)]">Nothing queued for {DAY_PART_META[part].name}.</div>
            {onEdit && (
              <button type="button" onClick={onEdit} className="mt-2 text-[12.5px] text-[var(--accent)]">
                Add a note
              </button>
            )}
          </div>
        ) : (
          <>
            {open[0] && (
              <NoteRow
                item={open[0]}
                kicker="Next up"
                lead
                delay={0}
                onToggle={onToggleGoal}
                onOpen={onOpenLink}
              />
            )}
            {open.slice(1).map((item, index) => (
              <NoteRow
                key={item.id}
                item={item}
                kicker={index === 0 ? "Then" : ""}
                delay={70 + index * 55}
                onToggle={onToggleGoal}
                onOpen={onOpenLink}
              />
            ))}
            {done.length > 0 && (
              <div className="note-rise pt-2" style={{ animationDelay: `${90 + open.length * 55}ms` }}>
                <div className="mb-1.5 px-1 text-[11px] tracking-[0.18em] text-[var(--faint)]">DONE</div>
                <div className="space-y-1.5">
                  {done.map((item, index) => (
                    <NoteRow
                      key={item.id}
                      item={item}
                      delay={120 + open.length * 55 + index * 40}
                      onToggle={onToggleGoal}
                      onOpen={onOpenLink}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NoteRow({ item, kicker, lead, delay = 0, onToggle, onOpen }) {
  const attach = attachLine(item);
  const remind = remindLabel(item);
  const linked = attach.kind !== "none";
  return (
    <div className="note-rise" style={{ animationDelay: `${delay}ms` }}>
      {kicker && (
        <div className={`mb-1.5 px-1 text-[11px] tracking-[0.18em] ${lead ? "text-[var(--accent)]" : "text-[var(--faint)]"}`}>
          {kicker.toUpperCase()}
        </div>
      )}
      <div
        className={`flex items-start gap-3 rounded-2xl border px-3 py-2.5 transition-colors ${
          lead
            ? "border-[color-mix(in_srgb,var(--accent)_45%,var(--stroke))] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
            : "border-[var(--stroke-soft)] bg-[color-mix(in_srgb,var(--panel)_55%,transparent)]"
        } ${item.done ? "opacity-60" : ""}`}
      >
        <button
          type="button"
          onClick={() => onToggle?.(item.id)}
          className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors ${
            item.done ? "border-[var(--green)] bg-[var(--green)] text-[var(--bg)]" : "border-[var(--stroke)] hover:border-[var(--ink)]"
          }`}
          aria-label={item.done ? "Mark open" : "Mark done"}
        >
          {item.done ? <span className="note-check text-[11px] leading-none">✓</span> : ""}
        </button>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onToggle?.(item.id)}
            className={`block w-full text-left leading-5 ${lead ? "text-[15px]" : "text-[14px]"} ${
              item.done ? "text-[var(--muted)] line-through" : "text-[var(--ink)]"
            }`}
          >
            {item.text}
          </button>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => linked && onOpen?.(item)}
              disabled={!linked}
              className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${
                linked
                  ? "border-[var(--stroke)] text-[var(--muted)] hover:text-[var(--ink)]"
                  : "border-dashed border-[var(--stroke)] text-[var(--faint)]"
              }`}
            >
              <Icon name={attach.kind === "chat" ? "chat" : attach.kind === "folder" ? "folder" : "link"} size={11} />
              <span className="truncate">{attach.label}</span>
            </button>
            {remind && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--accent)_40%,var(--stroke))] px-2 py-0.5 text-[11px] text-[var(--accent)]">
                <Icon name="bell" size={11} />
                {remind.replace(/^Miles · /, "")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
