import { useAppState } from "../AppState.jsx";

export default function Toast() {
  const { toast } = useAppState();
  if (!toast) return null;
  return (
    <div className="pointer-events-none absolute bottom-24 left-1/2 z-40 -translate-x-1/2 fade-up md:bottom-8">
      <div className="frost-panel rounded-full border border-[var(--stroke)] px-4 py-2 text-[12.5px] shadow-lg">
        {toast}
      </div>
    </div>
  );
}
