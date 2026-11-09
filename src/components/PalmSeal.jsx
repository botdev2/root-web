import { useEffect, useState } from "react";
import { readPalmOtp } from "../glmChat.js";

export function usePalmSeal(address) {
  const [code, setCode] = useState("");
  const [left, setLeft] = useState(0);
  const [period, setPeriod] = useState(20);

  useEffect(() => {
    if (!address) {
      setCode("");
      setLeft(0);
      return undefined;
    }
    let cancelled = false;
    let timer = 0;
    const pull = () =>
      readPalmOtp(address)
        .then((data) => {
          if (cancelled) return;
          setCode(String(data.code || ""));
          setPeriod(Number(data.period) || 20);
          setLeft(Math.max(1, Number(data.remaining) || 20));
        })
        .catch(() => {
          if (!cancelled) setLeft((value) => (value > 0 ? value : 0));
        });
    pull();
    timer = window.setInterval(() => {
      setLeft((value) => {
        if (value <= 1) {
          pull();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [address]);

  const grouped = code.length === 6 ? code.slice(0, 3) + " " + code.slice(3) : code;
  return { code, grouped, left, period };
}

export default function PalmSeal({ address, compact }) {
  const { grouped, code, left, period } = usePalmSeal(address);
  const share = period > 0 ? Math.max(0, Math.min(1, left / period)) : 0;
  return (
    <section className={compact ? "pid-seal pid-seal--compact" : "pid-seal"} aria-live="polite">
      <div className="pid-seal-copy">
        <div className="text-[11px] tracking-[0.2em] text-[var(--faint)]">LIVE SEAL</div>
        <div className="pid-seal-code">{code ? grouped : "—— ———"}</div>
        <div className="mt-1 text-[12px] text-[var(--muted)]">
          {left > 0 ? `Refreshes in ${left}s` : "Signing…"} · HMAC from PALM, 20s window
        </div>
      </div>
      <div className="pid-seal-meter" aria-hidden="true">
        <div className="pid-seal-meter-fill" style={{ width: `${share * 100}%` }} />
      </div>
    </section>
  );
}
