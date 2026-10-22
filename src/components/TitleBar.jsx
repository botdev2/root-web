export default function TitleBar() {
  return (
    <div className="frost relative hidden h-9 shrink-0 items-center justify-between px-3 md:flex">
      <div className="flex items-center gap-2">
        <img src="/palm.png" alt="" className="h-[22px] w-[22px] object-contain" />
        <span className="text-[12px] text-[var(--ink)]">/root</span>
      </div>
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[11.5px] text-[var(--faint)]">
        useroot.sh
      </div>
      <div className="text-[11px] text-[var(--faint)]">web</div>
    </div>
  );
}
