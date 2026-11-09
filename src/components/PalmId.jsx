import { useEffect, useMemo, useRef, useState } from "react";
import portrait from "../assets/avatar.png";
import { formatCredits, readQuests } from "../glmChat.js";
import { readProfile, writeProfile } from "../account.js";
import { levelOf } from "./views/QuestsView.jsx";
import { publicIdUrl } from "../version.js";

// The whole open passport is drawn at this size, then scaled to fit. Both pages are the same size.
const W = 1100;
const H = 520;
const FR = 4;
const HALF = W / 2;
const PW = HALF - FR * 2;
const PH = H - FR * 2;

const PAPER = "#f3eadc";
const PAPER_DEEP = "#e6d6c0";
const PAPER_INK = "#24141f";
const PAPER_MUTED = "#7a6a71";
const PAPER_HAIR = "rgb(36 20 31 / 0.14)";
const PALM_FONT = '"PALM", "Segoe UI", system-ui, sans-serif';
const OPEN_MS = 1700;

function rgbChannels(value) {
  const hex = String(value || "").trim();
  if (hex.startsWith("#") && hex.length >= 7) {
    return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  }
  const match = hex.match(/rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/);
  if (match) return [match[1], match[2], match[3]].map((n) => Number(n) / 255);
  return [0.12, 0.1, 0.1];
}

// Holdings decide the tier. Top rank is 250,000 $PALM held plus staked.
const LOOKS = [
  { status: "Guest", cover: "#1f1d26", metal: ["#e3e5ea", "#a4a8b3", "#767b87"], guil: 0.05, duo: ["#16161a", "#e9e9ec"], pearl: 0.25 },
  { status: "Member", cover: "#241c28", metal: ["#f6d6b4", "#c48a56", "#8c5a32"], guil: 0.055, duo: ["#1a1216", "#eee4d8"], pearl: 0.32 },
  { status: "Plus", cover: "#1c1e26", metal: ["#e8e4dc", "#9aa3b0", "#6d7582"], guil: 0.06, duo: ["#16161c", "#ece8e2"], pearl: 0.4 },
  { status: "Silver", cover: "#1a1c22", metal: ["#f2f3f6", "#b8bec8", "#7d8490"], guil: 0.065, duo: ["#14161a", "#f0f0f2"], pearl: 0.5 },
  { status: "Gold", cover: "#1b1020", metal: ["#fbeab4", "#d0a748", "#9a6f1c"], guil: 0.075, duo: ["#1e1015", "#f4e4cf"], pearl: 0.65 },
  { status: "Platinum", cover: "#141820", metal: ["#f4f6fa", "#c5d0dc", "#8a97a8"], guil: 0.08, duo: ["#12161c", "#eef2f6"], pearl: 0.78 },
  { status: "Black", cover: "#100c12", metal: ["#fff3c4", "#d9b04f", "#9a6f1c"], guil: 0.09, duo: ["#1e1015", "#f6e5cf"], pearl: 0.9, shine: true },
  { status: "Reserve", cover: "#0c0810", metal: ["#fff6d0", "#e0b857", "#a07418"], guil: 0.1, duo: ["#1e1015", "#f8e7d0"], pearl: 1, shine: true },
];

const TIER_AT = [0, 1000, 2500, 10000, 25000, 50000, 100000, 250000];
const PERKS = [
  "Welcome credits",
  "1 credit / 14 days",
  "2.5 credits / 14 days",
  "10 credits / 14 days",
  "25 credits / 14 days",
  "50 credits / 14 days",
  "100 credits / 14 days",
  "250 credits / 14 days",
];
const COVERS = [
  { id: "auto", label: "Tier default", min: 1 },
  { id: "graphite", label: "Graphite", color: "#1d1e24", min: 1 },
  { id: "plum", label: "Plum", color: "#2b1830", min: 2 },
  { id: "midnight", label: "Midnight", color: "#0f1a30", min: 3 },
  { id: "forest", label: "Forest", color: "#10261f", min: 4 },
  { id: "oxblood", label: "Oxblood", color: "#2c1017", min: 5 },
  { id: "ink", label: "Ink", color: "#0c0810", min: 7 },
];
const FOILS = [
  { id: "auto", label: "Tier default", min: 1 },
  { id: "1", label: "Steel", min: 1 },
  { id: "2", label: "Bronze", min: 2 },
  { id: "4", label: "Silver", min: 4 },
  { id: "5", label: "Gold", min: 5 },
  { id: "6", label: "Platinum", min: 6 },
  { id: "8", label: "Reserve gold", min: 8 },
];
const SETTINGS_KEY = "root-web-passport:";

function readSettings(address) {
  try {
    return { cover: "auto", foil: "auto", photo: "", ...(JSON.parse(localStorage.getItem(SETTINGS_KEY + String(address || "").toLowerCase()) || "{}")) };
  } catch {
    return { cover: "auto", foil: "auto", photo: "" };
  }
}

function writeSettings(address, value) {
  try {
    localStorage.setItem(SETTINGS_KEY + String(address || "").toLowerCase(), JSON.stringify(value));
  } catch {
    /* storage full or blocked: keep the in-memory choice */
  }
}

/** Shrinks an uploaded picture so it fits comfortably in local storage. */
function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const w = 292;
      const h = 372;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      const ratio = Math.max(w / image.width, h / image.height);
      const dw = image.width * ratio;
      const dh = image.height * ratio;
      ctx.drawImage(image, (w - dw) / 2, (h - dh) * 0.3, dw, dh);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file is not a picture."));
    };
    image.src = url;
  });
}

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
    boxShadow: "0 48px 110px -16px rgb(0 0 0 / 0.72), 0 14px 28px rgb(0 0 0 / 0.42), inset 0 1px 0 rgb(255 255 255 / 0.14), 0 0 0 1px rgb(255 255 255 / 0.06)",
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
        <path key={index} d={d} fill="none" stroke="#b08a4a" strokeWidth="0.55" opacity={opacity} />
      ))}
    </svg>
  );
}

function Field({ label, value, x, y, width = 140, size = 17 }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width }}>
      <div style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: PAPER_MUTED }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: size, fontWeight: 600, letterSpacing: "0.02em", color: PAPER_INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    </div>
  );
}

/** The DEV2 seal, pressed in ink. */
function Seal({ size, color, rotate }) {
  const text = "APPROVED  \u2022  PALM ID  \u2022  APPROVED  \u2022";
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
function Photo({ look, level, src }) {
  const [dark, light] = look.duo;
  const [dr, dg, db] = rgbChannels(dark);
  const [lr, lg, lb] = rgbChannels(light);
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
      <img src={src || portrait} alt="" width="146" height="186" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 12%", filter: `url(#${id})` }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgb(255 255 255 / 0.06) 0 1px, transparent 1px 3px)", mixBlendMode: "overlay" }} />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 28px rgb(20 8 20 / 0.5)" }} />
    </div>
  );
}

function CornerFoil({ look, size = 28 }) {
  const stroke = look.metal[0];
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M2 12 V4 H10" stroke={stroke} strokeWidth="1.2" />
      <path d="M2 8 V4 H8" stroke={look.metal[1]} strokeWidth="0.6" opacity="0.7" />
    </svg>
  );
}

/** The outside of the passport: dark leather with a foil palm and name. */
function FrontCover({ look, address, onConnect }) {
  const short = address ? `${address.slice(0, 2)}...${address.slice(-4)}` : "";
  const foil = { backgroundImage: foilFill(look) };
  return (
    <div style={frameStyle(look, "6px 16px 16px 6px")}>
      <div style={{ position: "relative", width: PW, height: PH, borderRadius: "3px 12px 12px 3px", overflow: "hidden", backgroundImage: `radial-gradient(90% 70% at 32% 8%, rgb(255 255 255 / 0.2), transparent 46%), radial-gradient(70% 50% at 80% 90%, rgb(255 220 160 / 0.08), transparent 55%), linear-gradient(160deg, ${look.cover}, #07050a)` }}>
        <svg width={PW} height={PH} style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.72 }} aria-hidden="true">
          <filter id="pid-leather" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.92" numOctaves="4" seed="9" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.62 0" />
          </filter>
          <rect width={PW} height={PH} filter="url(#pid-leather)" />
        </svg>
        <div style={{ position: "absolute", left: 0, top: 0, width: 18, height: PH, background: "linear-gradient(90deg, rgb(0 0 0 / 0.55), rgb(0 0 0 / 0.12) 55%, transparent)", boxShadow: `inset -1px 0 0 ${look.metal[2]}55` }} />
        <div style={{ position: "absolute", left: 18, top: 0, width: 2, height: PH, backgroundImage: foilFill(look), opacity: 0.35 }} />
        <div style={{ position: "absolute", inset: 16, borderRadius: 5, border: "1px solid", borderColor: look.metal[1], opacity: 0.42 }} />
        <div style={{ position: "absolute", inset: 21, borderRadius: 3, border: "1px solid", borderColor: look.metal[0], opacity: 0.16 }} />
        <div style={{ position: "absolute", left: 28, top: 28, opacity: 0.7 }}><CornerFoil look={look} /></div>
        <div style={{ position: "absolute", right: 28, top: 28, opacity: 0.7, transform: "scaleX(-1)" }}><CornerFoil look={look} /></div>
        <div style={{ position: "absolute", left: 28, bottom: 28, opacity: 0.7, transform: "scaleY(-1)" }}><CornerFoil look={look} /></div>
        <div style={{ position: "absolute", right: 28, bottom: 28, opacity: 0.7, transform: "scale(-1)" }}><CornerFoil look={look} /></div>
        <div style={{ position: "absolute", left: PW / 2 - 60, top: 108, width: 120, height: 84, ...foil, ...maskPalm, filter: "drop-shadow(0 -1px 0 rgb(255 255 255 / 0.38)) drop-shadow(0 4px 10px rgb(0 0 0 / 0.7))" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 218, textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.48em", color: look.metal[1], opacity: 0.72 }}>PRIVATE CLIENT</div>
          <div style={{ marginTop: 10, display: "inline-block", fontSize: 30, fontWeight: 600, letterSpacing: "0.36em", color: "transparent", WebkitBackgroundClip: "text", backgroundClip: "text", ...foil, filter: "drop-shadow(0 2px 3px rgb(0 0 0 / 0.65))" }}>PALM ID</div>
          <div style={{ marginTop: 10, fontSize: 12, letterSpacing: "0.32em", textTransform: "uppercase", color: look.metal[1], opacity: 0.92 }}>{look.status}</div>
          {short && <div style={{ marginTop: 20, fontSize: 13, letterSpacing: "0.24em", fontWeight: 600, color: look.metal[0] }}>{short}</div>}
        </div>
        <svg width="34" height="24" viewBox="0 0 34 24" style={{ position: "absolute", left: PW / 2 - 17, bottom: 52 }} aria-hidden="true">
          <rect x="1" y="1" width="32" height="22" rx="5" fill="none" stroke={look.metal[1]} strokeWidth="1.2" opacity="0.85" />
          <circle cx="17" cy="12" r="5" fill="none" stroke={look.metal[1]} strokeWidth="1.2" opacity="0.85" />
        </svg>
        {!address && (
          <div style={{ position: "absolute", left: 56, right: 56, top: 336, textAlign: "center" }}>
            <div style={{ fontSize: 12, letterSpacing: "0.04em", lineHeight: 1.6, color: "rgb(255 244 224 / 0.7)" }}>Issued to a wallet. Connect one to open yours.</div>
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
        <div style={{ position: "absolute", left: 0, top: 0, width: 52, height: PH, background: "linear-gradient(90deg, rgb(0 0 0 / 0.55), transparent)" }} />
        <div style={{ position: "absolute", right: 0, top: 0, width: 36, height: PH, background: "linear-gradient(270deg, rgb(255 236 196 / 0.1), transparent)" }} />
        {look.shine && <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(115deg, transparent 38%, rgb(255 255 255 / 0.18) 50%, transparent 62%)", backgroundSize: "260% 100%", animation: "pid-sheen 9s ease-in-out infinite", pointerEvents: "none" }} />}
      </div>
    </div>
  );
}

/** The inside of the front cover: the sunset-oasis artwork, with the tier ladder laid over it. */
function InsideCover({ look, total, tier }) {
  const next = tier < TIER_AT.length - 1 ? tier + 1 : null;
  const soft = "rgb(255 244 224 / 0.62)";
  return (
    <div style={frameStyle(look, "16px 6px 6px 16px")}>
      <div style={{ position: "relative", width: PW, height: PH, borderRadius: "12px 3px 3px 12px", overflow: "hidden", background: "#c0306a", color: "#fff6e8" }}>
        <img src="/brand/passport-oasis.jpg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "23% 50%" }} />
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 90px rgb(40 8 40 / 0.35)" }} />
        <div style={{ position: "absolute", right: 0, top: 0, width: 70, height: PH, background: "linear-gradient(270deg, rgb(20 4 24 / 0.45), transparent)" }} />
        <div style={{ position: "absolute", left: 22, right: 22, top: 20, bottom: 20, borderRadius: 14, background: "linear-gradient(180deg, rgb(22 7 30 / 0.52), rgb(22 7 30 / 0.36))", border: "1px solid rgb(255 244 224 / 0.28)", backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)", padding: "16px 20px 14px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Tiers</div>
            <div style={{ fontSize: 12, color: soft }}>{shortAmount(total)} / 250K</div>
          </div>
          <div style={{ marginTop: 10, height: 4, borderRadius: 3, background: "rgb(255 244 224 / 0.18)", overflow: "hidden" }}>
            <div style={{ width: `${Math.min(1, total / TIER_AT[TIER_AT.length - 1]) * 100}%`, height: "100%", borderRadius: 3, backgroundImage: foilFill(LOOKS[tier]) }} />
          </div>
          <div style={{ marginTop: 6, fontSize: 11.5, color: soft }}>
            {next ? `${shortAmount(Math.max(0, TIER_AT[next] - total))} more to ${LOOKS[next].status}` : "Top tier."}
          </div>
          <div style={{ position: "relative", marginTop: 10 }}>
            <div style={{ position: "absolute", left: 5, top: 16, height: LOOKS.length * 42 - 32, width: 1, background: "rgb(255 244 224 / 0.22)" }} />
            <div style={{ position: "absolute", left: 5, top: 16, height: Math.max(0, tier * 42), width: 1, background: look.metal[0] }} />
            {LOOKS.map((item, index) => {
              const reached = index <= tier;
              const current = index === tier;
              return (
                <div key={item.status} style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, height: 42, opacity: reached ? 1 : 0.55, background: current ? "rgb(255 244 224 / 0.1)" : "transparent", borderRadius: 8, margin: "0 -6px", padding: "0 6px" }}>
                  <div style={{ width: 11, height: 11, borderRadius: "50%", flex: "none", boxSizing: "border-box", border: `2px solid ${reached ? item.metal[0] : "rgb(255 244 224 / 0.4)"}`, background: reached ? item.metal[1] : "transparent", boxShadow: current ? `0 0 0 3px ${item.metal[1]}40` : "none" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.15 }}>{item.status}</div>
                    <div style={{ fontSize: 10.5, color: soft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{PERKS[index]}</div>
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: reached ? item.metal[0] : soft }}>{index === 0 ? "0" : shortAmount(TIER_AT[index])}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** An open PALM ID passport. It needs a wallet, reads credits and level from the account, and the more you do, the richer it looks. */
export default function PalmId({ address, credit, onConnect, publicPage = false }) {
  const [quests, setQuests] = useState(null);
  const [width, setWidth] = useState(W);
  const [open, setOpen] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const wrap = useRef(null);
  const timer = useRef(0);
  const played = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setQuests(null);
    if (!address) return undefined;
    if (publicPage) {
      setQuests({ points: credit?.points || 0, creditsEarned: credit?.creditsEarned || 0 });
      return undefined;
    }
    readQuests(address)
      .then((data) => {
        if (!cancelled) setQuests(data.quests || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [address, publicPage, credit?.points, credit?.creditsEarned]);

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
  const shown = tier + 1;
  const base = LOOKS[tier];
  const tierName = LOOKS[tier].status;
  const nextTier = tier < TIER_AT.length - 1 ? tier + 1 : null;
  const [settings, setSettings] = useState(() => readSettings(address));
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [custom, setCustom] = useState(false);
  const fileInput = useRef(null);
  const noteTimer = useRef(0);

  useEffect(() => {
    setSettings(readSettings(address));
    setName(address ? (readProfile(address)?.name || "") : "");
  }, [address]);

  const cover = COVERS.find((item) => item.id === settings.cover && item.min <= shown);
  const foil = FOILS.find((item) => item.id === settings.foil && item.min <= shown && item.id !== "auto");
  const look = {
    ...base,
    cover: cover?.color || base.cover,
    metal: foil ? LOOKS[Number(foil.id) - 1].metal : base.metal,
  };
  const issued = useMemo(() => issuedOn(address), [address]);
  const holder = name.trim() || "$PALM HOLDER";

  const flash = (text) => {
    setNote(text);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(""), 2600);
  };
  const change = (patch) => {
    const merged = { ...settings, ...patch };
    setSettings(merged);
    writeSettings(address, merged);
  };
  const saveName = () => {
    if (!address) return;
    const profile = readProfile(address) || {};
    if ((profile.name || "") !== name.trim()) {
      writeProfile(address, { ...profile, name });
      flash("Name saved");
    }
  };
  const copy = async (text, done) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(done);
    } catch {
      flash("Copy is blocked in this browser");
    }
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      change({ photo: await shrinkPhoto(file) });
      flash("Photo updated");
    } catch (error) {
      flash(error.message || "Could not use that photo");
    }
  };
  const number = "PALM" + String(address ? (hash(address.toLowerCase()) % 9000) + 1000 : 0).padStart(4, "0");
  const date = new Date(issued + "T00:00:00");
  const issueText = Number.isNaN(date.getTime()) ? "NOV 2026" : `${MONTH[date.getMonth()]} ${date.getFullYear()}`;
  const issueMrz = Number.isNaN(date.getTime()) ? "202611" : `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const left = credit ? formatCredits(credit.remaining) : "0";
  const earned = quests ? formatCredits(quests.creditsEarned) : "0";
  const scale = Math.min(1, width / W);
  const next = level.next ? level.number + 1 : null;
  const toNext = level.next ? Math.max(0, level.next - points) : 0;
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const ease = reduce ? "none" : `transform ${OPEN_MS}ms cubic-bezier(0.65, 0, 0.25, 1)`;
  const metal = look.metal;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
  const poseX = reduce ? 0 : (open ? 8 : 16) + tilt.x;
  const poseY = reduce ? 0 : (open ? -5 : -22) + tilt.y;
  const extra = publicPage ? 88 : 48;
  const follow = (event) => {
    if (reduce || !wrap.current) return;
    const box = wrap.current.getBoundingClientRect();
    const px = (event.clientX - box.left) / Math.max(1, box.width) - 0.5;
    const py = (event.clientY - box.top) / Math.max(1, box.height) - 0.5;
    setTilt({ x: py * -10, y: px * 14 });
  };

  // Draws the data page onto a canvas and downloads it as a PNG.
  const saveImage = async () => {
    try {
      await document.fonts?.load?.('700 26px "PALM"');
      const scaleUp = 2;
      const canvas = document.createElement("canvas");
      canvas.width = PW * scaleUp;
      canvas.height = PH * scaleUp;
      const ctx = canvas.getContext("2d");
      ctx.scale(scaleUp, scaleUp);
      const round = (x, y, w, h, r) => {
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
      };
      const paper = ctx.createLinearGradient(0, 0, PW, PH);
      paper.addColorStop(0, PAPER);
      paper.addColorStop(1, PAPER_DEEP);
      round(0, 0, PW, PH, 14);
      ctx.fillStyle = paper;
      ctx.fill();
      const foilLine = ctx.createLinearGradient(0, 0, PW, PH);
      foilLine.addColorStop(0, metal[0]);
      foilLine.addColorStop(0.5, metal[1]);
      foilLine.addColorStop(1, metal[2]);
      round(2, 2, PW - 4, PH - 4, 12);
      ctx.strokeStyle = foilLine;
      ctx.lineWidth = 4;
      ctx.stroke();
      const font = (size, weight = 400) => `${weight} ${size}px ${PALM_FONT}`;
      const text = (value, x, y, size, color, weight = 400, align = "left") => {
        ctx.font = font(size, weight);
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = "alphabetic";
        ctx.fillText(value, x, y);
      };
      text("PALM ID", 34, 52, 26, PAPER_INK, 600);
      text(`${tierName} \u00b7 ${shortAmount(total)} $PALM`, 34, 74, 12, PAPER_MUTED);
      ctx.fillStyle = PAPER_HAIR;
      ctx.fillRect(34, 84, PW - 68, 1);
      if (typeof ctx.filter === "string") {
        const picture = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = settings.photo || portrait;
        });
        if (picture) {
          ctx.save();
          round(37, 109, 146, 186, 3);
          ctx.clip();
          ctx.filter = "grayscale(1) contrast(1.35) sepia(0.4)";
          const ratio = Math.max(146 / picture.width, 186 / picture.height);
          ctx.drawImage(picture, 37 + (146 - picture.width * ratio) / 2, 109 - (picture.height * ratio - 186) * 0.12, picture.width * ratio, picture.height * ratio);
          ctx.restore();
          round(36, 108, 148, 188, 3);
          ctx.strokeStyle = metal[1];
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      const fields = [
        ["Name", holder.toUpperCase(), 226, 106],
        ["Tier", tierName.toUpperCase(), 380, 106],
        ["$PALM held", shortAmount(held), 226, 168],
        ["$PALM staked", shortAmount(staked), 380, 168],
        ["Passport no.", number, 226, 230],
        ["Issued", issueText, 380, 230],
      ];
      fields.forEach(([label, value, x, y]) => {
        text(label, x, y + 11, 11, PAPER_MUTED);
        text(value, x, y + 34, 17, PAPER_INK, 600);
      });
      ctx.fillStyle = PAPER_HAIR;
      ctx.fillRect(226, 156, PW - 260, 1);
      ctx.fillRect(226, 218, PW - 260, 1);
      ctx.fillRect(34, 322, PW - 68, 1);
      text("Credits", 34, 346, 11, PAPER_MUTED);
      text(left, 34, 386, 38, PAPER_INK, 700);
      text(`${earned} earned`, 34, 408, 12, PAPER_MUTED);
      text("Level", 250, 346, 11, PAPER_MUTED);
      text(String(level.number), 250, 376, 26, PAPER_INK, 700);
      text("Wallet", 34, 436, 11, PAPER_MUTED);
      text(address || "", 34, 454, 12.5, PAPER_INK);
      ctx.fillStyle = "rgb(255 255 255 / 0.38)";
      ctx.fillRect(4, PH - 62, PW - 8, 58);
      text(mrz("P<PALM<<" + clean(holder)), 34, PH - 36, 15, PAPER_INK);
      text(mrz(`${number}<<${clean(tierName)}<<${issueMrz}`), 34, PH - 13, 15, PAPER_INK);
      if (shown >= 2) {
        ctx.save();
        ctx.translate(451, 381);
        ctx.rotate(-0.14);
        ctx.strokeStyle = "#4a2a6a";
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, 57, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(0, 0, 31, 0, Math.PI * 2);
        ctx.stroke();
        text("DEV2", 0, 8, 25, "#4a2a6a", 700, "center");
        ctx.restore();
      }
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("no image");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${number}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 4000);
      flash("Saved as an image");
    } catch {
      flash("Could not save the image");
    }
  };

  const chip = (active, locked) => ({
    height: 32,
    padding: "0 14px",
    borderRadius: 0,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    cursor: locked ? "not-allowed" : "pointer",
    opacity: locked ? 0.4 : 1,
    color: active ? "var(--ink)" : "var(--muted)",
    background: "transparent",
    border: "1px solid " + (active ? "var(--accent)" : "var(--stroke)"),
  });

  return (
    <div className="mb-4">
      <div
        ref={wrap}
        className="mx-auto w-full"
        onPointerMove={follow}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        style={{ maxWidth: W, height: H * scale + extra }}
      >
        <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {/* closed, the passport sits in the middle; opening slides it back to the right as the cover swings left */}
          <div
            className="pid-pose"
            style={{
              width: W,
              height: H,
              perspective: 2200,
              perspectiveOrigin: "50% 42%",
            }}
          >
            <div
              style={{
                width: W,
                height: H,
                transformStyle: "preserve-3d",
                transform: `rotateX(${poseX}deg) rotateY(${poseY}deg)`,
                transition: reduce ? "none" : "transform 180ms ease-out",
              }}
            >
              <div className="pid-pose-shadow" aria-hidden="true" />
              <div
                onClick={() => address && setOpen((value) => !value)}
                style={{
                  position: "relative",
                  width: W,
                  height: H,
                  transformStyle: "preserve-3d",
                  transform: `translateX(${open ? 0 : -HALF / 2}px)`,
                  transition: ease,
                  cursor: address ? "pointer" : "default",
                  fontFamily: PALM_FONT,
                }}
              >
              <div className="pid-gold-edge pid-gold-edge--side" aria-hidden="true" />
              <div className="pid-gold-edge pid-gold-edge--foot" aria-hidden="true" />
            {/* right page: the data page */}
            <div style={{ position: "absolute", left: HALF, top: 0, width: HALF, height: H }}>
              <div style={frameStyle(look, "6px 16px 16px 6px")}>
                <div style={{ position: "relative", width: PW, height: PH, borderRadius: "3px 12px 12px 3px", overflow: "hidden", background: `linear-gradient(135deg, ${PAPER}, ${PAPER_DEEP})`, color: PAPER_INK }}>
                  <div style={{ position: "absolute", inset: 10, borderRadius: 8, border: `1px solid ${metal[1]}`, opacity: 0.28, pointerEvents: "none", zIndex: 3 }} />
                  <svg width={PW} height={PH} style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: 0.32 }} aria-hidden="true">
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
                      <div style={{ position: "absolute", left: 34, top: 24 }}>
                        <div style={{ fontSize: 10, letterSpacing: "0.28em", color: PAPER_MUTED }}>IDENTITY</div>
                        <div style={{ marginTop: 6, fontSize: 26, fontWeight: 600, letterSpacing: "0.12em", lineHeight: 1.05 }}>PALM ID</div>
                        <div style={{ marginTop: 5, fontSize: 12, letterSpacing: "0.08em", color: PAPER_MUTED }}>{tierName} · {shortAmount(total)} $PALM</div>
                      </div>
                      {/* pearl security seal */}
                      <div style={{ position: "absolute", right: 32, top: 22, width: 48, height: 48, borderRadius: "50%", opacity: look.pearl, backgroundImage: "conic-gradient(from 30deg, #f6f1f8, #d3e3ee, #f2dfe8, #e5ecd2, #f6f1f8)", boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.8), 0 0 0 1px rgb(42 22 51 / 0.14), 0 3px 8px rgb(42 22 51 / 0.18)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        <div style={{ width: 28, height: 20, background: "rgb(42 22 51 / 0.6)", ...maskPalm }} />
                        {look.shine && <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(115deg, transparent 35%, rgb(255 255 255 / 0.8) 50%, transparent 65%)", backgroundSize: "260% 100%", animation: "pid-sheen 5s ease-in-out infinite" }} />}
                      </div>
                      <div style={{ position: "absolute", left: 34, right: 34, top: 84, height: 1, backgroundImage: `linear-gradient(90deg, ${metal[2]}, ${metal[1]}, transparent)`, opacity: 0.7 }} />

                      <div style={{ position: "absolute", left: 34, top: 106, padding: 3, background: "#fffdf8", boxShadow: `0 0 0 1px ${metal[1]}, 0 8px 18px rgb(42 22 51 / 0.22)` }}>
                        <Photo look={look} level={shown} src={settings.photo} />
                      </div>

                      <Field label="Name" value={holder.toUpperCase()} x={226} y={106} size={holder.length > 12 ? 15 : 17} />
                      <Field label="Tier" value={tierName.toUpperCase()} x={380} y={106} size={tierName.length > 10 ? 15 : 17} />
                      <Field label="$PALM held" value={shortAmount(held)} x={226} y={168} />
                      <Field label="$PALM staked" value={shortAmount(staked)} x={380} y={168} />
                      <Field label="Passport no." value={number} x={226} y={230} />
                      <Field label="Issued" value={issueText} x={380} y={230} />
                      <div style={{ position: "absolute", left: 226, right: 34, top: 156, height: 1, background: PAPER_HAIR }} />
                      <div style={{ position: "absolute", left: 226, right: 34, top: 218, height: 1, background: PAPER_HAIR }} />

                      {/* credits and level, quietly */}
                      <div style={{ position: "absolute", left: 34, right: 34, top: 322, height: 1, background: PAPER_HAIR }} />
                      <div style={{ position: "absolute", left: 34, top: 324 }}>
                        <div style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: PAPER_MUTED }}>Credits</div>
                        <div style={{ marginTop: 2, fontSize: 38, fontWeight: 700, lineHeight: 1.05 }}>{left}</div>
                        <div style={{ marginTop: 3, fontSize: 12, color: PAPER_MUTED }}>{earned} earned</div>
                      </div>
                      <div style={{ position: "absolute", left: 250, top: 324, width: 128 }}>
                        <div style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: PAPER_MUTED }}>Level</div>
                        <div style={{ marginTop: 2, fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{level.number}</div>
                        <div style={{ marginTop: 9, height: 3, borderRadius: 2, background: PAPER_HAIR, overflow: "hidden" }}>
                          <div style={{ width: `${level.share * 100}%`, height: "100%", backgroundImage: `linear-gradient(90deg, ${metal[2]}, ${metal[1]})` }} />
                        </div>
                        <div style={{ marginTop: 6, fontSize: 11, color: PAPER_MUTED }}>{next ? `${toNext.toLocaleString()} pts to level ${next}` : `${points.toLocaleString()} pts`}</div>
                      </div>

                      {/* the seal arrives at Member */}
                      {shown >= 2 && (
                        <div style={{ position: "absolute", left: 392, top: 322, opacity: 0.88, mixBlendMode: "multiply" }}>
                          <Seal size={118} color="#4a2a6a" rotate={-8} />
                        </div>
                      )}

                      <div style={{ position: "absolute", left: 34, top: 416 }}>
                        <div style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: PAPER_MUTED }}>Wallet</div>
                        <div style={{ marginTop: 2, fontSize: 12.5, color: PAPER_INK, opacity: 0.8, whiteSpace: "nowrap" }}>{address}</div>
                      </div>

                      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 58, background: "rgb(255 255 255 / 0.42)", borderTop: `1px solid ${PAPER_HAIR}` }}>
                        <svg width={PW} height={58} aria-hidden="true">
                          <text x="34" y="24" fontSize="15" fontFamily={PALM_FONT} fill={PAPER_INK} opacity="0.7">
                            {mrz("P<PALM<<" + clean(holder))}
                          </text>
                          <text x="34" y="47" fontSize="15" fontFamily={PALM_FONT} fill={PAPER_INK} opacity="0.7">
                            {mrz(`${number}<<${clean(tierName)}<<${issueMrz}`)}
                          </text>
                        </svg>
                      </div>
                    </>
                  )}

                  <div style={{ position: "absolute", left: 0, top: 0, width: 56, height: PH, background: "linear-gradient(90deg, rgb(20 8 24 / 0.22), transparent)", pointerEvents: "none", zIndex: 5 }} />
                </div>
              </div>
            </div>

            {/* the cover: its outside faces you when closed, its inside is the left page once it has swung open */}
            <div style={{ position: "absolute", left: HALF, top: 0, width: HALF, height: H, transformOrigin: "0 50%", transformStyle: "preserve-3d", transform: open ? "rotateY(-180deg)" : "rotateY(0deg)", transition: ease, zIndex: 3 }}>
              <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                <FrontCover look={look} address={address} onConnect={onConnect} />
              </div>
              <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                <InsideCover look={look} total={total} tier={tier} />
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-7 max-w-[640px] text-center text-[11px] leading-5 tracking-[0.06em] text-[var(--muted)]">
        {address ? (
          <>
            {tierName} · {shortAmount(total)} $PALM held and staked
            {nextTier ? ` · ${shortAmount(TIER_AT[nextTier] - total)} to ${LOOKS[nextTier].status}` : " · Reserve"}
          </>
        ) : (
          "Issued to a wallet address."
        )}
      </p>

      {address && (
        <div className="mx-auto mt-5 max-w-[760px]">
          <div className={`flex flex-wrap items-center gap-2 ${publicPage ? "justify-center" : ""}`}>
            <button type="button" style={chip(false)} onClick={() => copy(address, "Wallet address copied")}>Copy address</button>
            <button type="button" style={chip(false)} onClick={() => copy(publicIdUrl(address) || address, "Public ID link copied")}>Copy public link</button>
            {!publicPage && (
              <button
                type="button"
                style={chip(false)}
                onClick={() => {
                  const href = publicIdUrl(address);
                  if (href) window.open(href, "_blank", "noopener");
                }}
              >
                Open public page
              </button>
            )}
            <button type="button" style={chip(false)} onClick={saveImage}>Save as image</button>
            {!publicPage && <button type="button" style={chip(custom)} onClick={() => setCustom((value) => !value)}>{custom ? "Done" : "Customize"}</button>}
            <span className="text-[12px] text-[var(--muted)]" aria-live="polite">{note}</span>
          </div>

          {custom && !publicPage && (
            <div className="mt-3 grid gap-4 rounded-[14px] border border-[var(--stroke-soft)] bg-[var(--panel-soft)] p-4 text-[12px] text-[var(--muted)] sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block">Name on the passport</span>
                <input
                  value={name}
                  maxLength={24}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={saveName}
                  onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
                  placeholder="$PALM HOLDER"
                  className="h-9 w-full rounded-[10px] border border-[var(--stroke)] bg-transparent px-3 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                />
              </label>
              <div>
                <span className="mb-1.5 block">Photo</span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" style={chip(false)} onClick={() => fileInput.current?.click()}>Upload photo</button>
                  {settings.photo && <button type="button" style={chip(false)} onClick={() => change({ photo: "" })}>Use avatar</button>}
                  <input ref={fileInput} type="file" accept="image/*" hidden onChange={upload} />
                </div>
                <span className="mt-1.5 block text-[11px] text-[var(--faint)]">Printed in black and white, and only stored in this browser.</span>
              </div>
              <div>
                <span className="mb-1.5 block">Cover</span>
                <div className="flex flex-wrap gap-2">
                  {COVERS.map((item) => {
                    const locked = item.min > shown;
                    return (
                      <button key={item.id} type="button" disabled={locked} title={locked ? `${LOOKS[item.min - 1].status} look unlocks this` : item.label} style={chip(settings.cover === item.id, locked)} onClick={() => change({ cover: item.id })}>
                        {item.color && <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: item.color, border: "1px solid var(--stroke)", marginRight: 6 }} />}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <span className="mb-1.5 block">Foil</span>
                <div className="flex flex-wrap gap-2">
                  {FOILS.map((item) => {
                    const locked = item.min > shown;
                    const swatch = item.id === "auto" ? null : LOOKS[Number(item.id) - 1].metal;
                    return (
                      <button key={item.id} type="button" disabled={locked} title={locked ? `${LOOKS[item.min - 1].status} look unlocks this` : item.label} style={chip(settings.foil === item.id, locked)} onClick={() => change({ foil: item.id })}>
                        {swatch && <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", backgroundImage: foilFill({ metal: swatch }), marginRight: 6 }} />}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
