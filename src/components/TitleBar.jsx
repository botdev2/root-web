export default function TitleBar({ marketOn = false }) {
  return (
    <div className="frost relative hidden h-9 shrink-0 items-center justify-between px-3 md:flex">
      <div className="flex items-center gap-2">
        <img src="/palm.png" alt="" className="h-[22px] w-[22px] object-contain" />
        <span className="text-[12px] text-[var(--ink)]">{marketOn ? "/root · PALM Market" : "/root"}</span>
      </div>
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[11.5px] text-[var(--faint)]">
        {marketOn ? "tape · ticks · PALM" : "useroot.sh"}
      </div>
      <div />
    </div>
  );
}
