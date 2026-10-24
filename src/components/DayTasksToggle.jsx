export default function DayTasksToggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!enabled)}
      className="flex items-center gap-2 py-1.5 pr-3 pl-2.5"
      title="Show today's Day tasks on the empty home screen"
    >
      <span className={`text-[11.5px] opacity-[0.85] ${enabled ? "font-semibold text-[var(--ink)]" : "font-normal text-[var(--muted)]"}`}>
        Day tasks
      </span>
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full border opacity-[0.88] ${
          enabled ? "border-[var(--green)] bg-[var(--green)]" : "border-[var(--stroke-soft)] bg-[var(--stroke)]"
        }`}
      >
        <span
          className={`absolute top-[2px] h-3.5 w-3.5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.22)] transition-[left] duration-150 ${
            enabled ? "left-[18px]" : "left-[3px]"
          }`}
        />
      </span>
    </button>
  );
}
