export function Page({ children, wide }) {
  return (
    <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-6">
      <div className={wide ? "mx-auto w-full max-w-[1100px]" : "mx-auto w-full max-w-[880px]"}>{children}</div>
    </div>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`frost-panel rounded-2xl border border-[var(--stroke)] ${className}`}>{children}</div>
  );
}

export function Section({ title, children }) {
  return (
    <section className="mb-6">
      <div className="mb-2 text-[12px] text-[var(--faint)]">{title}</div>
      {children}
    </section>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="mb-5 flex flex-wrap gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`h-9 rounded-lg px-3 text-[12.5px] ${
            value === tab.id ? "bg-[var(--sidebar-sel)] text-[var(--ink)]" : "text-[var(--muted)] hover:bg-[var(--hover)]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Row({ label, value, children }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--stroke-soft)] px-4 py-3 last:border-b-0">
      <div>
        <div className="text-[13px]">{label}</div>
        {value && <div className="mt-0.5 text-[11px] text-[var(--muted)]">{value}</div>}
      </div>
      {children}
    </div>
  );
}

export function Toggle({ on, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-6 w-11 rounded-full ${on ? "bg-[var(--accent)]" : "bg-[var(--stroke)]"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--bg)] transition-transform ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export function Ghost({ children, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-lg border px-3 text-[12.5px] ${
        active ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--stroke)] hover:bg-[var(--hover)]"
      }`}
    >
      {children}
    </button>
  );
}

export function Primary({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 rounded-lg bg-[var(--accent)] px-3.5 text-[12.5px] text-[var(--bg)]"
    >
      {children}
    </button>
  );
}

export function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      {label && <div className="mb-1.5 text-[11px] text-[var(--faint)]">{label}</div>}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-10 w-full rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 text-[14px] outline-none"
      />
    </label>
  );
}
