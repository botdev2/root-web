import { useEffect, useMemo, useRef, useState } from "react";
import portrait from "../assets/avatar.png";
import { formatCredits, readQuests } from "../glmChat.js";
import { readProfile } from "../account.js";
import { levelOf } from "./views/QuestsView.jsx";

// The whole open passport is drawn at this size, then scaled to fit. Both pages are the same size.
const W = 1100;
const H = 520;
const FR = 6;
const HALF = W / 2;
const PW = HALF - FR * 2;
const PH = H - FR * 2;

const INK = "#3b1650";
const SOFT = "#7d5a8e";
const PALM_FONT = '"PALM", "Segoe UI", system-ui, sans-serif';
const MONO = '"Courier New", ui-monospace, monospace';
const OPEN_MS = 1600;

// What the passport looks like at each level. Higher level, richer passport.
const LOOKS = [
  { status: "Visitor", cover: "#4a4452", emboss: ["#e4e1ea", "#9c97a6"], paper: ["#eeedf1", "#e4e1e8"], foil: null, holo: 0.2, guil: 0.08, duo: ["#141414", "#e9e9e9"], sky: 0.3, stars: 0 },
  { status: "Resident", cover: "#5a2a72", emboss: ["#efe2f5", "#a98bb8"], paper: ["#f3e9f2", "#eaddee"], foil: null, holo: 0.5, guil: 0.12, duo: ["#1e0a30", "#ead6f2"], sky: 0.5, stars: 0 },
  { status: "Citizen", cover: "#8c2a7a", emboss: ["#fff1b8", "#c9962f"], paper: ["#f8ebf4", "#eed8f0"], foil: ["#e1bde8", "#b78bc8"], holo: 0.85, guil: 0.16, duo: ["#260a3a", "#f7d3e8"], sky: 0.8, stars: 14 },
  { status: "Holder", cover: "#8c2a7a", emboss: ["#fff1b8", "#c9962f"], paper: ["#fbecf3", "#f0d5ee"], foil: ["#f6e3a1", "#b8862d"], holo: 1, guil: 0.2, duo: ["#2a0a32", "#ffdcc4"], sky: 1, stars: 24 },
  { status: "Diamond Hands", cover: "#8c2a7a", emboss: ["#fff1b8", "#c9962f"], paper: ["#fdeef4", "#f2d2ef"], foil: ["#fff1b8", "#b8862d"], holo: 1, guil: 0.24, duo: ["#2a0a32", "#ffdcc4"], sky: 1, stars: 36, shine: true },
  { status: "Founder", cover: "#8c2a7a", emboss: ["#fff6cf", "#c9962f"], paper: ["#fff0f6", "#f5cfef"], foil: ["#fff6cf", "#c9962f"], holo: 1, guil: 0.28, duo: ["#2a0a32", "#ffdcc4"], sky: 1, stars: 52, shine: true },
];

const UNLOCKS = ["", "the first visa stamp and a plum photo", "a pink photo and a lilac border", "a warm photo and a gold border", "a foil shimmer", "a sky full of stars"];

function hash(text) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619) >>> 0;
  }
  return value >>> 0;
}

function mrz(text, length = 40) {
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

function scatter(seed, count, w, h) {
  let value = seed;
  const next = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
  return Array.from({ length: count }, () => ({ x: next() * w, y: next() * h, r: 0.6 + next() * 1.4, o: 0.4 + next() * 0.6 }));
}

function frameStyle(look, radius) {
  const foil = look.foil;
  return {
    position: "absolute",
    inset: 0,
    padding: FR,
    borderRadius: radius,
    backgroundColor: look.cover,
    backgroundImage: foil ? `linear-gradient(135deg, ${foil[0]}, ${foil[1]}, ${foil[0]}, ${foil[1]})` : "none",
    backgroundSize: "300% 300%",
    animation: look.shine ? "pid-foil 6s linear infinite" : undefined,
    boxShadow: "0 22px 48px rgb(30 8 50 / 0.4), 0 3px 8px rgb(30 8 50 / 0.3)",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  };
}

function Guilloche({ opacity }) {
  const lines = useMemo(() => {
    const out = [];
    for (let k = 0; k < 26; k += 1) {
      let d = "";
      for (let x = 0; x <= PW; x += 8) {
        const y = 250 + Math.sin(x / 46 + k * 0.32) * (60 + k * 3) + Math.sin(x / 19 - k * 0.2) * 10;
        d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)} `;
      }
      out.push(d);
    }
    return out;
  }, []);
  return (
    <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
      {lines.map((d, index) => (
        <path key={index} d={d} fill="none" stroke="#9a4fb0" strokeWidth="0.8" opacity={opacity} />
      ))}
      {[34, 54, 74, 94, 114].map((r) => (
        <circle key={r} cx={PW - 110} cy="320" r={r} fill="none" stroke="#9a4fb0" strokeWidth="0.8" opacity={opacity * 0.9} />
      ))}
    </svg>
  );
}

function Leaf({ x, y, rotate, scale = 1, opacity }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} opacity={opacity}>
      <path d="M0 0 C30 -50 100 -70 150 -52 C110 -32 55 -10 0 0Z" fill="#a24fb0" />
      <path d="M0 0 C25 -20 70 -38 150 -52" stroke="#6d2f86" strokeWidth="1.5" fill="none" opacity="0.6" />
    </g>
  );
}

function Field({ label, value, x, y, width = 140, size = 15 }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width }}>
      <div style={{ fontSize: 10, letterSpacing: "0.2em", color: SOFT }}>{label}</div>
      <div style={{ marginTop: 3, fontSize: size, fontWeight: 700, letterSpacing: "0.08em", color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    </div>
  );
}

function Stamp({ size, color, rotate, text, center, centerSize = 24, fontSize = 9.5, spacing = 1.1 }) {
  const id = "pid-arc-" + size + text.length;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: `rotate(${rotate}deg)`, fontFamily: PALM_FONT }}>
      <defs>
        <path id={id} d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="60" cy="60" r="31" fill="none" stroke={color} strokeWidth="1.5" />
      <text fill={color} fontSize={fontSize} fontWeight="700" letterSpacing={spacing} fontFamily="inherit">
        <textPath href={"#" + id} startOffset="0">
          {text}
        </textPath>
      </text>
      <text x="60" y="60" textAnchor="middle" dominantBaseline="central" fill={color} fontSize={centerSize} fontWeight="800" letterSpacing="1" fontFamily="inherit">
        {center}
      </text>
    </svg>
  );
}

/** The holder's photo, posterised into two inks so it reads as an ID print and not as a character. */
function Photo({ look, level }) {
  const [dark, light] = look.duo;
  const hex = (value) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const [dr, dg, db] = hex(dark);
  const [lr, lg, lb] = hex(light);
  const row = (d, l) => `${((l - d) * 0.299).toFixed(4)} ${((l - d) * 0.587).toFixed(4)} ${((l - d) * 0.114).toFixed(4)} 0 ${d.toFixed(4)}`;
  const id = "pid-duo-" + level;
  return (
    <div style={{ position: "relative", width: 160, height: 204, borderRadius: 12, overflow: "hidden", isolation: "isolate", background: dark }}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <feGaussianBlur stdDeviation="0.9" />
          <feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.5" intercept="-0.22" />
            <feFuncG type="linear" slope="1.5" intercept="-0.22" />
            <feFuncB type="linear" slope="1.5" intercept="-0.22" />
          </feComponentTransfer>
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
            <feFuncG type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
            <feFuncB type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
          </feComponentTransfer>
          <feColorMatrix type="matrix" values={`${row(dr, lr)}  ${row(dg, lg)}  ${row(db, lb)}  0 0 0 1 0`} />
        </filter>
      </svg>
      <img src={portrait} alt="" width="160" height="204" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 12%", filter: `url(#${id})` }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgb(255 255 255 / 0.08) 0 1px, transparent 1px 3px)", mixBlendMode: "overlay" }} />
      <svg width="160" height="204" style={{ position: "absolute", inset: 0, mixBlendMode: "overlay" }} aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <text key={index} x={-20 + (index % 2) * 18} y={20 + index * 26} fontSize="9" letterSpacing="3" fill="#fff" opacity="0.32" fontFamily={PALM_FONT}>
            PALM PALM PALM PALM PALM PALM PALM PALM
          </text>
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 26px rgb(20 6 40 / 0.5)", borderRadius: 12 }} />
    </div>
  );
}

/** The outside of the passport: leather, a gold palm, and the name. */
function FrontCover({ look, address, onConnect }) {
  const [light, dark] = look.emboss;
  const gold = { backgroundImage: `linear-gradient(135deg, ${light}, ${dark})` };
  return (
    <div style={frameStyle(look, "6px 26px 26px 6px")}>
      <div style={{ position: "relative", width: PW, height: PH, borderRadius: "3px 20px 20px 3px", overflow: "hidden", backgroundImage: `linear-gradient(150deg, rgb(255 255 255 / 0.16), transparent 40%), radial-gradient(120% 90% at 30% 20%, ${look.cover}, #14061f)` }}>
        <svg width={PW} height={PH} style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.55 }} aria-hidden="true">
          <filter id="pid-leather" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="9" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0" />
          </filter>
          <rect width={PW} height={PH} filter="url(#pid-leather)" />
        </svg>
        <div style={{ position: "absolute", inset: 22, borderRadius: 10, border: "1.5px solid", borderImage: `linear-gradient(135deg, ${light}, ${dark}) 1`, opacity: 0.55 }} />
        <div style={{ position: "absolute", left: PW / 2 - 70, top: 96, width: 140, height: 140, ...gold, WebkitMaskImage: "url(/palm.png)", maskImage: "url(/palm.png)", WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", filter: "drop-shadow(0 2px 3px rgb(0 0 0 / 0.5))" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 262, textAlign: "center" }}>
          <div style={{ display: "inline-block", fontSize: 36, fontWeight: 800, letterSpacing: "0.3em", paddingLeft: "0.3em", color: "transparent", WebkitBackgroundClip: "text", backgroundClip: "text", ...gold, filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.5))" }}>PALM ID</div>
          <div style={{ marginTop: 8, fontSize: 11, letterSpacing: "0.36em", paddingLeft: "0.36em", color: light, opacity: 0.8 }}>DECENTRALIZED CITIZEN</div>
        </div>
        <div style={{ position: "absolute", left: PW / 2 - 19, bottom: 52, width: 38, height: 26, borderRadius: 5, ...gold, boxShadow: "inset 0 0 0 1.5px rgb(90 55 8 / 0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 18, height: 12, borderRadius: 2, border: "1.5px solid rgb(90 55 8 / 0.6)" }} />
        </div>
        {!address && (
          <div style={{ position: "absolute", left: 40, right: 40, top: 344, textAlign: "center" }}>
            <div style={{ fontSize: 12, lineHeight: 1.6, letterSpacing: "0.04em", color: "rgb(255 255 255 / 0.86)" }}>A PALM ID is issued to a wallet. Connect one to open yours.</div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onConnect?.();
              }}
              style={{ marginTop: 12, height: 34, padding: "0 18px", borderRadius: 8, border: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "#2a0a32", ...gold }}
            >
              Connect wallet
            </button>
          </div>
        )}
        <div style={{ position: "absolute", right: 0, top: 0, width: 28, height: PH, background: "linear-gradient(270deg, rgb(255 255 255 / 0.1), transparent)" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 40, height: PH, background: "linear-gradient(90deg, rgb(0 0 0 / 0.45), transparent)" }} />
      </div>
    </div>
  );
}

/** The inside of the front cover: the sunset-oasis artwork across the whole page. */
function InsideCover({ look }) {
  const stars = useMemo(() => scatter(11, look.stars, PW, 220), [look.stars]);
  return (
    <div style={frameStyle(look, "26px 6px 6px 26px")}>
      <div style={{ position: "relative", width: PW, height: PH, borderRadius: "20px 3px 3px 20px", overflow: "hidden", background: "#c0306a" }}>
        <img
          src="/brand/passport-oasis.jpg"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "23% 50%", filter: `saturate(${0.55 + look.sky * 0.45})` }}
        />
        {look.stars > 0 && (
          <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
            {stars.map((star, index) => (
              <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#fff" opacity={star.o * 0.85} />
            ))}
          </svg>
        )}
        <div style={{ position: "absolute", right: 0, top: 0, width: 56, height: PH, background: "linear-gradient(270deg, rgb(10 2 20 / 0.4), transparent)" }} />
      </div>
    </div>
  );
}

/** An open PALM ID passport. It needs a wallet, reads credits and level from the account, and the more you do, the better it looks. */
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
  const look = LOOKS[level.number - 1];
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
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const ease = reduce ? "none" : `transform ${OPEN_MS}ms cubic-bezier(0.65, 0, 0.25, 1)`;
  const wallet = address || "";

  return (
    <div className="mb-4">
      <div ref={wrap} className="mx-auto w-full" style={{ maxWidth: W, height: H * scale + 2 }}>
        <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {/* closed, the passport sits in the middle; opening slides it back to the right as the cover swings left */}
          <div
            onClick={() => address && setOpen((value) => !value)}
            style={{ position: "relative", width: W, height: H, perspective: 2600, transform: `translateX(${open ? 0 : -HALF / 2}px)`, transition: ease, cursor: address ? "pointer" : "default", fontFamily: PALM_FONT }}
          >
            {/* right page: the data page */}
            <div style={{ position: "absolute", left: HALF, top: 0, width: HALF, height: H }}>
              <div style={frameStyle(look, "6px 26px 26px 6px")}>
                <div style={{ position: "relative", width: PW, height: PH, borderRadius: "3px 20px 20px 3px", overflow: "hidden", background: `linear-gradient(120deg, ${look.paper[0]}, ${look.paper[1]})`, color: INK }}>
                  <Guilloche opacity={look.guil} />
                  <svg width={PW} height={PH} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
                    <Leaf x={PW - 24} y={90} rotate={-150} scale={1.3} opacity={look.guil * 1.6} />
                    <Leaf x={PW - 24} y={90} rotate={-120} scale={1.1} opacity={look.guil * 1.6} />
                    <Leaf x={PW - 14} y={400} rotate={-170} scale={1.2} opacity={look.guil * 1.6} />
                  </svg>
                  {look.shine && <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(115deg, transparent 35%, rgb(255 255 255 / 0.55) 50%, transparent 65%)", backgroundSize: "250% 100%", animation: "pid-sheen 5s ease-in-out infinite", pointerEvents: "none", zIndex: 4 }} />}

                  {address && (
                    <>
                      <div style={{ position: "absolute", left: 34, top: 20, right: 110 }}>
                        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "0.26em", color: INK }}>PALM ID</div>
                        <div style={{ marginTop: 5, fontSize: 11, letterSpacing: "0.32em", color: SOFT }}>HOLDER PASSPORT</div>
                        <div style={{ marginTop: 2, fontSize: 10, letterSpacing: "0.32em", color: SOFT }}>DECENTRALIZED CITIZEN</div>
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          right: 28,
                          top: 24,
                          width: 58,
                          height: 58,
                          borderRadius: 11,
                          opacity: look.holo,
                          backgroundImage: "linear-gradient(135deg, #6fd3ff 0%, #b18cff 30%, #ff8bd0 55%, #ffd36f 80%, #8cffd0 100%)",
                          backgroundSize: "200% 200%",
                          animation: look.shine ? "pid-foil 4s linear infinite" : undefined,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.65), 0 3px 8px rgb(60 20 80 / 0.25)",
                        }}
                      >
                        <img src="/palm.png" alt="" width="38" height="38" style={{ opacity: 0.92 }} />
                      </div>

                      <div style={{ position: "absolute", left: 32, top: 112, padding: 4, borderRadius: 16, background: "rgb(255 255 255 / 0.85)", boxShadow: "0 6px 16px rgb(60 20 80 / 0.3)" }}>
                        <Photo look={look} level={level.number} />
                      </div>

                      <Field label="NAME" value={holder.toUpperCase()} x={226} y={112} size={holder.length > 12 ? 13 : 15} />
                      <Field label="STATUS" value={look.status.toUpperCase()} x={380} y={112} size={look.status.length > 10 ? 13 : 15} />
                      <Field label="NATIONALITY" value="CHAD" x={226} y={172} />
                      <Field label="ISSUE DATE" value={issueText} x={380} y={172} />
                      <Field label="EXPIRY" value="NEVER" x={226} y={232} />
                      <Field label="PASSPORT NO." value={number} x={380} y={232} />

                      {/* credits live on the passport */}
                      <div style={{ position: "absolute", left: 226, top: 296, width: 176, borderRadius: 14, background: "rgb(255 255 255 / 0.68)", boxShadow: "inset 0 0 0 1px rgb(90 42 114 / 0.2)", padding: "9px 14px 11px" }}>
                        <div style={{ fontSize: 10, letterSpacing: "0.2em", color: SOFT }}>CREDITS</div>
                        <div style={{ marginTop: 1, fontSize: 28, fontWeight: 800, color: INK, letterSpacing: "0.02em", lineHeight: 1.1 }}>{left}</div>
                        <div style={{ marginTop: 2, fontSize: 11, color: SOFT }}>{earned} earned</div>
                        <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: "0.14em", color: SOFT }}>
                          <span>LEVEL {level.number}</span>
                          <span>{points.toLocaleString()} PTS</span>
                        </div>
                        <div style={{ marginTop: 4, height: 6, borderRadius: 3, background: "rgb(90 42 114 / 0.18)", overflow: "hidden" }}>
                          <div style={{ width: `${level.share * 100}%`, height: "100%", background: "linear-gradient(90deg, #8c2a7a, #e5476b)" }} />
                        </div>
                      </div>

                      {/* the seal arrives at level 2 */}
                      {level.number >= 2 && (
                        <div style={{ position: "absolute", left: 398, top: 282, opacity: 0.9, mixBlendMode: "multiply" }}>
                          <Stamp size={132} color="#7a2f96" rotate={-9} text="APPROVED * DECENTRALIZED CITIZEN *" center="DEV2" centerSize={27} />
                        </div>
                      )}

                      {/* one visa stamp per level after the first */}
                      <div style={{ position: "absolute", left: 30, top: 344, display: "flex", gap: 6 }}>
                        {[2, 3, 4, 5, 6].map((n) =>
                          level.number >= n ? (
                            <div key={n} style={{ mixBlendMode: "multiply" }}>
                              <Stamp size={32} color={["#7a2f96", "#c0306a", "#b8862d", "#2f7a8c", "#4a2fa0"][n - 2]} rotate={[-10, 8, -6, 12, -4][n - 2]} text="PALM ID * PALM ID * PALM *" fontSize={11} spacing={3} center={`LV ${n}`} centerSize={22} />
                            </div>
                          ) : (
                            <div key={n} style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px dashed rgb(90 42 114 / 0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "rgb(90 42 114 / 0.45)" }}>
                              {n}
                            </div>
                          ),
                        )}
                      </div>

                      {/* the wallet this passport was issued to */}
                      <div style={{ position: "absolute", left: 32, top: 398, right: 32 }}>
                        <div style={{ fontSize: 10, letterSpacing: "0.2em", color: SOFT }}>WALLET</div>
                        <div style={{ marginTop: 3, fontFamily: MONO, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.02em", color: INK, whiteSpace: "nowrap" }}>{wallet}</div>
                      </div>

                      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 62, background: "rgb(255 255 255 / 0.55)", borderTop: "1px solid rgb(90 42 114 / 0.12)" }}>
                        <svg width={PW} height={62} aria-hidden="true">
                          <text x="32" y="26" textLength={PW - 64} lengthAdjust="spacing" fontSize="15" fontFamily={MONO} fill={INK}>
                            {mrz("P<PALM<<" + clean(holder))}
                          </text>
                          <text x="32" y="50" textLength={PW - 64} lengthAdjust="spacing" fontSize="15" fontFamily={MONO} fill={INK}>
                            {mrz(`${number}<<GLOBAL<<${clean(look.status)}<<${issueMrz}<<NEVER`)}
                          </text>
                        </svg>
                      </div>
                    </>
                  )}

                  <div style={{ position: "absolute", left: 0, top: 0, width: 54, height: PH, background: "linear-gradient(90deg, rgb(10 2 20 / 0.34), transparent)", pointerEvents: "none", zIndex: 5 }} />
                </div>
              </div>
            </div>

            {/* the cover: its outside faces you when closed, its inside is the left page once it has swung open */}
            <div
              style={{
                position: "absolute",
                left: HALF,
                top: 0,
                width: HALF,
                height: H,
                transformOrigin: "0 50%",
                transformStyle: "preserve-3d",
                transform: open ? "rotateY(-180deg)" : "rotateY(0deg)",
                transition: ease,
                zIndex: 3,
              }}
            >
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
            Level {level.number} · {look.status}. Issued to your wallet. Your ID shows your credits and levels up as you earn points in Achievements.
            {next ? ` Level ${next} adds ${UNLOCKS[next - 1]}.` : " This is the best it gets."} Click the passport to close or open it.
          </>
        ) : (
          "A PALM ID is issued to a wallet address, so it stays shut until you connect one."
        )}
      </p>
    </div>
  );
}
