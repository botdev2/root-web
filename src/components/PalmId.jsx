import { useEffect, useMemo, useRef, useState } from "react";
import portrait from "../assets/avatar.png";
import { formatCredits, readQuests } from "../glmChat.js";
import { readProfile } from "../account.js";
import { levelOf } from "./views/QuestsView.jsx";

// The whole open passport is drawn at this size, then scaled to fit. Both pages are the same size.
const W = 1100;
const H = 520;
const FR = 4;
const HALF = W / 2;
const PW = HALF - FR * 2;
const PH = H - FR * 2;

const INK = "#2a1633";
const MUTED = "#8a7b86";
const HAIR = "rgb(42 22 51 / 0.12)";
const PALM_FONT = '"PALM", "Segoe UI", system-ui, sans-serif';
const OPEN_MS = 1700;

// What the passport looks like at each level. The metal gets richer as you level up.
const LOOKS = [
  { status: "Visitor", cover: "#1f1d26", metal: ["#e3e5ea", "#a4a8b3", "#767b87"], guil: 0.05, duo: ["#16161a", "#e9e9ec"], pearl: 0.3 },
  { status: "Resident", cover: "#2b1830", metal: ["#f6d6b4", "#c48a56", "#8c5a32"], guil: 0.06, duo: ["#1a1216", "#eee4d8"], pearl: 0.35 },
  { status: "Citizen", cover: "#2e1228", metal: ["#fae0d4", "#cf9588", "#a56a5e"], guil: 0.07, duo: ["#1c1216", "#f0e4d8"], pearl: 0.6 },
  { status: "Holder", cover: "#1b1020", metal: ["#fbeab4", "#d0a748", "#9a6f1c"], guil: 0.08, duo: ["#1e1015", "#f4e4cf"], pearl: 0.7 },
  { status: "Diamond Hands", cover: "#1b1020", metal: ["#fff3c4", "#d9b04f", "#9a6f1c"], guil: 0.09, duo: ["#1e1015", "#f6e5cf"], pearl: 0.85, shine: true },
  { status: "Founder", cover: "#150b19", metal: ["#fff6d0", "#e0b857", "#a07418"], guil: 0.1, duo: ["#1e1015", "#f8e7d0"], pearl: 1, shine: true },
];

// Holdings decide how the passport looks: $PALM held plus staked, with the tier names from LOOKS.
const TIER_AT = [0, 1000, 10000, 100000, 1000000, 5000000];

function tierOf(total) {
  let index = 0;
  TIER_AT.forEach((min, i) => {
    if (total >= min) index = i;
  });
  return index;
}

function palmAmount(text) {
  const value = Number.parseFloat(String(text || "0").replace(/,/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function shortAmount(value) {
  if (value >= 1e9) return (value / 1e9).toFixed(2).replace(/\.?0+$/, "") + "B";
  if (value >= 1e6) return (value / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (value >= 1e5) return (value / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return value.toLocaleString("en-US", { maximumFractionDigits: value < 100 ? 2 : 0 });
}


function hash(text) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619) >>> 0;
  }
  return value >>> 0;
}

function mrz(text, length = 34) {
  return (text + "<".repeat(length)).slice(0, length);
}

function clean(text) {
  return String(text || "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim().replace(/ /g, "<");
}

function issuedOn(address) {
  const key = "root-web-id-issued:" + String(address || "guest").toLowerCase();
  try {
    const saved = localStorage.getItem(key);
    if (saved) return saved;
    const today = new Date().toISOString().slice(0, 10);
    if (address) localStorage.setItem(key, today);
    return today;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const MONTH = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const foilFill = (look) => `linear-gradient(135deg, ${look.metal[0]}, ${look.metal[1]} 45%, ${look.metal[2]} 70%, ${look.metal[0]})`;

function frameStyle(look, radius) {
  return {
    position: "absolute",
    inset: 0,
    padding: FR,
    borderRadius: radius,
    backgroundColor: look.cover,
    backgroundImage: foilFill(look),
    backgroundSize: "300% 300%",
    animation: look.shine ? "pid-foil 8s linear infinite" : undefined,
    boxShadow: "0 34px 60px -14px rgb(8 3 16 / 0.55), 0 8px 18px rgb(8 3 16 / 0.35)",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  };
}

const maskPalm = {
  WebkitMaskImage: "url(/brand/palm-mark.png)",
  maskImage: "url(/brand/palm-mark.png)",
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
};

/** Fine engraved waves, like the security print on a banknote. */
function Guilloche({ opacity }) {
  const lines = useMemo(() => {
    const out = [];
    for (let k = 0; k < 34; k += 1) {
      let d = "";
      for (let x = 0; x <= PW; x += 6) {
        const y = 260 + Math.sin(x / 52 + k * 0.28) * (50 + k * 3.4) + Math.sin(x / 17 - k * 0.2) * 7;
        d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)} `;
      }
      out.push(d);
    }
    return out;
  }, []);
  return (
    <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
      {lines.map((d, index) => (
        <path key={index} d={d} fill="none" stroke="#8c7440" strokeWidth="0.6" opacity={opacity} />
      ))}
    </svg>
  );
}

function Field({ label, value, x, y, width = 140, size = 17 }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width }}>
      <div style={{ fontSize: 11, color: MUTED }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: size, fontWeight: 600, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    </div>
  );
}

/** The DEV2 seal, pressed in ink. */
function Seal({ size, color, rotate }) {
  const text = "APPROVED  \u2022  DECENTRALIZED CITIZEN  \u2022";
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: `rotate(${rotate}deg)`, fontFamily: PALM_FONT }}>
      <defs>
        <path id="pid-seal-arc" d="M60 60 m-45 0 a45 45 0 1 1 90 0 a45 45 0 1 1 -90 0" />
      </defs>
      <circle cx="60" cy="60" r="57" fill="none" stroke={color} strokeWidth="1.6" />
      <circle cx="60" cy="60" r="53" fill="none" stroke={color} strokeWidth="0.6" />
      <circle cx="60" cy="60" r="31" fill="none" stroke={color} strokeWidth="1" />
      <text fill={color} fontSize="11.5" fontWeight="600" fontFamily="inherit">
        <textPath href="#pid-seal-arc">
          {text}
        </textPath>
      </text>
      <text x="60" y="60" textAnchor="middle" dominantBaseline="central" fill={color} fontSize="25" fontWeight="700" fontFamily="inherit">
        DEV2
      </text>
    </svg>
  );
}

/** The holder's photo: drained of colour and posterised so it reads as an ID print. */
function Photo({ look, level }) {
  const [dark, light] = look.duo;
  const hex = (value) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const [dr, dg, db] = hex(dark);
  const [lr, lg, lb] = hex(light);
  const row = (d, l) => `${((l - d) * 0.299).toFixed(4)} ${((l - d) * 0.587).toFixed(4)} ${((l - d) * 0.114).toFixed(4)} 0 ${d.toFixed(4)}`;
  const id = "pid-duo-" + level;
  return (
    <div style={{ position: "relative", width: 146, height: 186, borderRadius: 3, overflow: "hidden", isolation: "isolate", background: dark }}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <feGaussianBlur stdDeviation="1.1" />
          <feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.45" intercept="-0.2" />
            <feFuncG type="linear" slope="1.45" intercept="-0.2" />
            <feFuncB type="linear" slope="1.45" intercept="-0.2" />
          </feComponentTransfer>
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 0.14 0.28 0.42 0.57 0.71 0.85 1" />
            <feFuncG type="discrete" tableValues="0 0.14 0.28 0.42 0.57 0.71 0.85 1" />
            <feFuncB type="discrete" tableValues="0 0.14 0.28 0.42 0.57 0.71 0.85 1" />
          </feComponentTransfer>
          <feColorMatrix type="matrix" values={`${row(dr, lr)}  ${row(dg, lg)}  ${row(db, lb)}  0 0 0 1 0`} />
        </filter>
      </svg>
      <img src={portrait} alt="" width="146" height="186" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 12%", filter: `url(#${id})` }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgb(255 255 255 / 0.06) 0 1px, transparent 1px 3px)", mixBlendMode: "overlay" }} />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 24px rgb(20 8 20 / 0.45)" }} />
    </div>
  );
}

/** The outside of the passport: dark leather with a foil palm and name. */
function FrontCover({ look, address, onConnect }) {
  const short = address ? `${address.slice(0, 2)}...${address.slice(-4)}` : "";
  const foil = { backgroundImage: foilFill(look) };
  return (
    <div style={frameStyle(look, "6px 16px 16px 6px")}>
      <div style={{ position: "relative", width: PW, height: PH, borderRadius: "3px 12px 12px 3px", overflow: "hidden", backgroundImage: `radial-gradient(120% 90% at 30% 15%, rgb(255 255 255 / 0.1), transparent 55%), linear-gradient(160deg, ${look.cover}, #0c0610)` }}>
        <svg width={PW} height={PH} style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.6 }} aria-hidden="true">
          <filter id="pid-leather" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="9" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0" />
          </filter>
          <rect width={PW} height={PH} filter="url(#pid-leather)" />
        </svg>
        <div style={{ position: "absolute", inset: 20, borderRadius: 6, border: "1px solid", borderColor: look.metal[1], opacity: 0.4 }} />
        <div style={{ position: "absolute", left: PW / 2 - 62, top: 130, width: 124, height: 85, ...foil, ...maskPalm, filter: "drop-shadow(0 -1px 0 rgb(255 255 255 / 0.25)) drop-shadow(0 2px 3px rgb(0 0 0 / 0.6))" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 252, textAlign: "center" }}>
          <div style={{ display: "inline-block", fontSize: 30, fontWeight: 700, color: "transparent", WebkitBackgroundClip: "text", backgroundClip: "text", ...foil, filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.55))" }}>PALM ID</div>
          <div style={{ marginTop: 6, fontSize: 12, color: look.metal[1], opacity: 0.85 }}>Decentralized Citizen</div>
          {short && <div style={{ marginTop: 26, display: "inline-block", padding: "6px 16px", borderRadius: 999, border: `1px solid ${look.metal[1]}`, fontSize: 14, fontWeight: 600, color: look.metal[0], opacity: 0.95 }}>{short}</div>}
        </div>
        <svg width="34" height="24" viewBox="0 0 34 24" style={{ position: "absolute", left: PW / 2 - 17, bottom: 56 }} aria-hidden="true">
          <rect x="1" y="1" width="32" height="22" rx="5" fill="none" stroke={look.metal[1]} strokeWidth="1.2" opacity="0.8" />
          <circle cx="17" cy="12" r="5" fill="none" stroke={look.metal[1]} strokeWidth="1.2" opacity="0.8" />
        </svg>
        {!address && (
          <div style={{ position: "absolute", left: 56, right: 56, top: 336, textAlign: "center" }}>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "rgb(255 255 255 / 0.7)" }}>A PALM ID is issued to a wallet. Connect one to open yours.</div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onConnect?.();
              }}
              style={{ marginTop: 12, height: 34, padding: "0 20px", borderRadius: 999, background: "transparent", border: `1px solid ${look.metal[1]}`, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: look.metal[0] }}
            >
              Connect wallet
            </button>
          </div>
        )}
        <div style={{ position: "absolute", left: 0, top: 0, width: 44, height: PH, background: "linear-gradient(90deg, rgb(0 0 0 / 0.5), transparent)" }} />
        <div style={{ position: "absolute", right: 0, top: 0, width: 30, height: PH, background: "linear-gradient(270deg, rgb(255 255 255 / 0.07), transparent)" }} />
      </div>
    </div>
  );
}

/** The inside of the front cover: the sunset-oasis artwork across the whole page. */
function InsideCover({ look }) {
  return (
    <div style={frameStyle(look, "16px 6px 6px 16px")}>
      <div style={{ position: "relative", width: PW, height: PH, borderRadius: "12px 3px 3px 12px", overflow: "hidden", background: "#c0306a" }}>
        <img src="/brand/passport-oasis.jpg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "23% 50%" }} />
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 90px rgb(40 8 40 / 0.35)" }} />
        <div style={{ position: "absolute", inset: 14, borderRadius: 4, border: "1px solid rgb(255 244 224 / 0.45)" }} />
        <div style={{ position: "absolute", right: 0, top: 0, width: 70, height: PH, background: "linear-gradient(270deg, rgb(20 4 24 / 0.45), transparent)" }} />
      </div>
    </div>
  );
}

/** An open PALM ID passport. It needs a wallet, reads credits and level from the account, and the more you do, the richer it looks. */
export default function PalmId({ address, credit, onConnect }) {
  const [quests, setQuests] = useState(null);
  const [width, setWidth] = useState(W);
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const timer = useRef(0);
  const played = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setQuests(null);
    if (!address) return undefined;
    readQuests(address)
      .then((data) => {
        if (!cancelled) setQuests(data.quests || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [address]);

  useEffect(() => {
    const node = wrap.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(() => setWidth(node.clientWidth || W));
    observer.observe(node);
    setWidth(node.clientWidth || W);
    return () => observer.disconnect();
  }, []);

  // The passport opens by itself the first time you see it.
  useEffect(() => {
    played.current = false;
    window.clearTimeout(timer.current);
    setOpen(false);
    const node = wrap.current;
    if (!address || !node) return undefined;
    const go = () => {
      if (played.current) return;
      played.current = true;
      timer.current = window.setTimeout(() => setOpen(true), 450);
    };
    if (typeof IntersectionObserver === "undefined") {
      go();
      return () => window.clearTimeout(timer.current);
    }
    const watcher = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) go();
      },
      { threshold: 0.35 },
    );
    watcher.observe(node);
    return () => {
      watcher.disconnect();
      window.clearTimeout(timer.current);
    };
  }, [address]);

  const points = quests?.points || 0;
  const level = levelOf(address ? points : 0);
  const held = palmAmount(credit?.held);
  const staked = palmAmount(credit?.staked);
  const total = address ? held + staked : 0;
  const tier = tierOf(total);
  const shown = Math.max(level.number, tier + 1);
  const look = LOOKS[shown - 1];
  const nextTier = tier < TIER_AT.length - 1 ? tier + 1 : null;
  const profile = useMemo(() => (address ? readProfile(address) : { name: "" }), [address]);
  const issued = useMemo(() => issuedOn(address), [address]);
  const holder = (profile?.name || "").trim() || "$PALM HOLDER";
  const number = "PALM" + String(address ? (hash(address.toLowerCase()) % 9000) + 1000 : 0).padStart(4, "0");
  const date = new Date(issued + "T00:00:00");
  const issueText = Number.isNaN(date.getTime()) ? "NOV 2026" : `${MONTH[date.getMonth()]} ${date.getFullYear()}`;
  const issueMrz = Number.isNaN(date.getTime()) ? "202611" : `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const left = credit ? formatCredits(credit.remaining) : "0";
  const earned = quests ? formatCredits(quests.creditsEarned) : "0";
  const scale = Math.min(1, width / W);
  const next = level.number < LOOKS.length ? level.number + 1 : null;
  const toNext = level.next ? Math.max(0, level.next - points) : 0;
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const ease = reduce ? "none" : `transform ${OPEN_MS}ms cubic-bezier(0.65, 0, 0.25, 1)`;
  const metal = look.metal;

  return (
    <div className="mb-4">
      <div ref={wrap} className="mx-auto w-full" style={{ maxWidth: W, height: H * scale + 2 }}>
        <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {/* closed, the passport sits in the middle; opening slides it back to the right as the cover swings left */}
          <div
            onClick={() => address && setOpen((value) => !value)}
            style={{ position: "relative", width: W, height: H, perspective: 2800, transform: `translateX(${open ? 0 : -HALF / 2}px)`, transition: ease, cursor: address ? "pointer" : "default", fontFamily: PALM_FONT }}
          >
            {/* right page: the data page */}
            <div style={{ position: "absolute", left: HALF, top: 0, width: HALF, height: H }}>
              <div style={frameStyle(look, "6px 16px 16px 6px")}>
                <div style={{ position: "relative", width: PW, height: PH, borderRadius: "3px 12px 12px 3px", overflow: "hidden", background: "linear-gradient(135deg, #f8f3eb, #efe7db)", color: INK }}>
                  <svg width={PW} height={PH} style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: 0.35 }} aria-hidden="true">
                    <filter id="pid-paper" x="0" y="0" width="100%" height="100%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="3" />
                      <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.42  0 0 0 0 0.3  0 0 0 0.35 0" />
                    </filter>
                    <rect width={PW} height={PH} filter="url(#pid-paper)" />
                  </svg>
                  <Guilloche opacity={look.guil} />
                  {look.shine && <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(115deg, transparent 38%, rgb(255 255 255 / 0.6) 50%, transparent 62%)", backgroundSize: "260% 100%", animation: "pid-sheen 7s ease-in-out infinite", pointerEvents: "none", zIndex: 4 }} />}

                  {address && (
                    <>
                      <div style={{ position: "absolute", left: 34, top: 26 }}>
                        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>PALM ID</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: MUTED }}>Holder passport · Decentralized citizen</div>
                      </div>
                      {/* pearl security seal */}
                      <div style={{ position: "absolute", right: 32, top: 22, width: 48, height: 48, borderRadius: "50%", opacity: look.pearl, backgroundImage: "conic-gradient(from 30deg, #f6f1f8, #d3e3ee, #f2dfe8, #e5ecd2, #f6f1f8)", boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.8), 0 0 0 1px rgb(42 22 51 / 0.14), 0 3px 8px rgb(42 22 51 / 0.18)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        <div style={{ width: 28, height: 20, background: "rgb(42 22 51 / 0.6)", ...maskPalm }} />
                        {look.shine && <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(115deg, transparent 35%, rgb(255 255 255 / 0.8) 50%, transparent 65%)", backgroundSize: "260% 100%", animation: "pid-sheen 5s ease-in-out infinite" }} />}
                      </div>
                      <div style={{ position: "absolute", left: 34, right: 34, top: 84, height: 1, backgroundImage: `linear-gradient(90deg, ${metal[2]}, ${metal[1]}, transparent)`, opacity: 0.7 }} />

                      <div style={{ position: "absolute", left: 34, top: 106, padding: 3, background: "#fffdf8", boxShadow: `0 0 0 1px ${metal[1]}, 0 8px 18px rgb(42 22 51 / 0.22)` }}>
                        <Photo look={look} level={shown} />
                      </div>

                      <Field label="Name" value={holder.toUpperCase()} x={226} y={106} size={holder.length > 12 ? 15 : 17} />
                      <Field label="Tier" value={look.status.toUpperCase()} x={380} y={106} size={look.status.length > 10 ? 15 : 17} />
                      <Field label="$PALM held" value={shortAmount(held)} x={226} y={168} />
                      <Field label="$PALM staked" value={shortAmount(staked)} x={380} y={168} />
                      <Field label="Passport no." value={number} x={226} y={230} />
                      <Field label="Issued" value={issueText} x={380} y={230} />
                      <div style={{ position: "absolute", left: 226, right: 34, top: 156, height: 1, background: HAIR }} />
                      <div style={{ position: "absolute", left: 226, right: 34, top: 218, height: 1, background: HAIR }} />

                      {/* credits and level, quietly */}
                      <div style={{ position: "absolute", left: 34, right: 34, top: 322, height: 1, background: HAIR }} />
                      <div style={{ position: "absolute", left: 34, top: 324 }}>
                        <div style={{ fontSize: 11, color: MUTED }}>Credits</div>
                        <div style={{ marginTop: 2, fontSize: 38, fontWeight: 700, lineHeight: 1.05 }}>{left}</div>
                        <div style={{ marginTop: 3, fontSize: 12, color: MUTED }}>{earned} earned</div>
                      </div>
                      <div style={{ position: "absolute", left: 250, top: 324, width: 128 }}>
                        <div style={{ fontSize: 11, color: MUTED }}>Level</div>
                        <div style={{ marginTop: 2, fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{level.number}</div>
                        <div style={{ marginTop: 9, height: 3, borderRadius: 2, background: "rgb(42 22 51 / 0.12)", overflow: "hidden" }}>
                          <div style={{ width: `${level.share * 100}%`, height: "100%", backgroundImage: `linear-gradient(90deg, ${metal[2]}, ${metal[1]})` }} />
                        </div>
                        <div style={{ marginTop: 6, fontSize: 11, color: MUTED }}>{next ? `${toNext.toLocaleString()} pts to level ${next}` : `${points.toLocaleString()} pts`}</div>
                      </div>

                      {/* the seal arrives at level 2 */}
                      {shown >= 2 && (
                        <div style={{ position: "absolute", left: 392, top: 322, opacity: 0.88, mixBlendMode: "multiply" }}>
                          <Seal size={118} color="#4a2a6a" rotate={-8} />
                        </div>
                      )}

                      <div style={{ position: "absolute", left: 34, top: 416 }}>
                        <div style={{ fontSize: 11, color: MUTED }}>Wallet</div>
                        <div style={{ marginTop: 2, fontSize: 12.5, color: INK, opacity: 0.8, whiteSpace: "nowrap" }}>{address}</div>
                      </div>

                      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 58, background: "rgb(255 255 255 / 0.42)", borderTop: `1px solid ${HAIR}` }}>
                        <svg width={PW} height={58} aria-hidden="true">
                          <text x="34" y="24" fontSize="15" fontFamily={PALM_FONT} fill={INK} opacity="0.7">
                            {mrz("P<PALM<<" + clean(holder))}
                          </text>
                          <text x="34" y="47" fontSize="15" fontFamily={PALM_FONT} fill={INK} opacity="0.7">
                            {mrz(`${number}<<${clean(look.status)}<<${issueMrz}<<${shortAmount(total).replace(/[^0-9A-Z]/gi, "")}`)}
                          </text>
                        </svg>
                      </div>
                    </>
                  )}

                  <div style={{ position: "absolute", left: 0, top: 0, width: 56, height: PH, background: "linear-gradient(90deg, rgb(20 8 24 / 0.28), transparent)", pointerEvents: "none", zIndex: 5 }} />
                </div>
              </div>
            </div>

            {/* the cover: its outside faces you when closed, its inside is the left page once it has swung open */}
            <div style={{ position: "absolute", left: HALF, top: 0, width: HALF, height: H, transformOrigin: "0 50%", transformStyle: "preserve-3d", transform: open ? "rotateY(-180deg)" : "rotateY(0deg)", transition: ease, zIndex: 3 }}>
              <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                <FrontCover look={look} address={address} onConnect={onConnect} />
              </div>
              <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                <InsideCover look={look} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-3 max-w-[760px] text-[12px] leading-5 text-[var(--muted)]">
        {address ? (
          <>
            {look.status} tier, from {shortAmount(total)} $PALM held and staked. The passport gets richer as you hold or stake more, and as you earn points in Achievements.
            {nextTier ? ` Reach ${shortAmount(TIER_AT[nextTier])} $PALM for ${LOOKS[nextTier].status}.` : ""} Click it to close or open.
          </>
        ) : (
          "A PALM ID is issued to a wallet address, so it stays shut until you connect one."
        )}
      </p>
    </div>
  );
}
