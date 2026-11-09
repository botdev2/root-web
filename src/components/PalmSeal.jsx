import { useEffect, useMemo, useState } from "react";
import { encode } from "uqr";
import { readPalmOtp } from "../glmChat.js";

export function usePalmSeal(address) {
  const [code, setCode] = useState("");
  const [left, setLeft] = useState(0);
  const [period, setPeriod] = useState(30);
  const [otpauth, setOtpauth] = useState("");
  const [secret, setSecret] = useState("");

  useEffect(() => {
    if (!address) {
      setCode("");
      setLeft(0);
      setOtpauth("");
      setSecret("");
      return undefined;
    }
    let cancelled = false;
    let timer = 0;
    const pull = () =>
      readPalmOtp(address)
        .then((data) => {
          if (cancelled) return;
          setCode(String(data.code || ""));
          setPeriod(Number(data.period) || 30);
          setLeft(Math.max(1, Number(data.remaining) || 30));
          setOtpauth(String(data.otpauth || ""));
          setSecret(String(data.secret || ""));
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
  return { code, grouped, left, period, otpauth, secret };
}

function QrMark({ value }) {
  const svg = useMemo(() => {
    if (!value) return "";
    const qr = encode(value, { ecc: "M", border: 2 });
    const n = qr.size;
    const dots = [];
    for (let y = 0; y < n; y += 1) {
      for (let x = 0; x < n; x += 1) {
        if (qr.data[y][x]) dots.push(`<rect x="${x}" y="${y}" width="1" height="1" />`);
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges">${dots.join("")}</svg>`;
  }, [value]);
  if (!svg) return <div className="pid-seal-qr pid-seal-qr--empty" aria-hidden="true" />;
  return <div className="pid-seal-qr" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function groupedSecret(secret) {
  return String(secret || "")
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function SealDigits({ code, grouped, className = "" }) {
  const [open, setOpen] = useState(false);
  const show = (on) => setOpen(on);
  return (
    <div
      className={`pid-seal-code ${open ? "is-open" : ""} ${className}`.trim()}
      onPointerEnter={() => show(true)}
      onPointerLeave={() => show(false)}
      onPointerDown={(event) => {
        event.stopPropagation();
        show(true);
      }}
      onPointerUp={() => show(false)}
      onPointerCancel={() => show(false)}
      title="Hold to read"
    >
      {open && code ? grouped : "••• •••"}
    </div>
  );
}

export default function PalmSeal({ address, compact }) {
  const { grouped, code, left, period, otpauth, secret } = usePalmSeal(address);
  const [keyOpen, setKeyOpen] = useState(false);
  const [note, setNote] = useState("");
  const share = period > 0 ? Math.max(0, Math.min(1, left / period)) : 0;

  const copy = async (text, done) => {
    try {
      await navigator.clipboard.writeText(text);
      setNote(done);
      window.setTimeout(() => setNote(""), 2200);
    } catch {
      setNote("Copy is blocked in this browser");
    }
  };

  return (
    <section id="authenticator" className={compact ? "pid-seal pid-seal--compact" : "pid-seal"}>
      <div className="pid-seal-copy">
        <div className="text-[11px] tracking-[0.2em] text-[var(--faint)]">AUTHENTICATOR</div>
        <div className="mt-1 text-[16px]">PALM ID</div>
      </div>
      <div className="pid-seal-row">
        {otpauth ? (
          <a className="pid-seal-qr-link" href={otpauth} title="Add PALM ID to authenticator">
            <QrMark value={otpauth} />
          </a>
        ) : (
          <QrMark value="" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[12px] leading-5 text-[var(--muted)]">
            Scan with Google Authenticator, Authy, or Aegis. On a phone, tap the QR to add it.
          </p>
          <SealDigits code={code} grouped={grouped} />
          <div className="mt-1 text-[12px] text-[var(--muted)]">
            Hold to match · {left > 0 ? `${left}s` : "signing…"}
          </div>
        </div>
      </div>
      <div className="pid-seal-meter" aria-hidden="true">
        <div className="pid-seal-meter-fill" style={{ width: `${share * 100}%` }} />
      </div>
      <div className="pid-seal-actions">
        <button type="button" className="pid-seal-btn" onClick={() => setKeyOpen((on) => !on)}>
          {keyOpen ? "Hide setup key" : "Show setup key"}
        </button>
        {otpauth && (
          <button type="button" className="pid-seal-btn" onClick={() => copy(otpauth, "otpauth link copied")}>
            Copy otpauth
          </button>
        )}
        {note && <span className="text-[11px] text-[var(--muted)]">{note}</span>}
      </div>
      {keyOpen && secret && (
        <button type="button" className="pid-seal-key" onClick={() => copy(secret, "Setup key copied")}>
          {groupedSecret(secret)}
        </button>
      )}
    </section>
  );
}
