import { useEffect, useMemo, useRef, useState } from "react";
import portrait from "../assets/avatar.png";
import { formatCredits, readQuests } from "../glmChat.js";
import { readProfile } from "../account.js";
import { levelOf } from "./views/QuestsView.jsx";

// The whole open passport is drawn at this size, then scaled to fit.
const W = 1100;
const H = 520;
const FRAME = 6;
const IW = W - FRAME * 2;
const IH = H - FRAME * 2;
const SPINE = 464;
const RW = IW - SPINE;

const INK = "#3b1650";
const SOFT = "#7d5a8e";
const PALM_FONT = '"PALM", "Segoe UI", system-ui, sans-serif';
const MONO = '"Courier New", ui-monospace, monospace';


// What the passport looks like at each level. Higher level, richer passport.
const LOOKS = [
  { status: "Visitor", cover: "#4a4452", paper: ["#eeedf1", "#e4e1e8"], foil: null, holo: 0.2, guil: 0.08, duo: ["#141414", "#e9e9e9"], sky: 0.28, stars: 0 },
  { status: "Resident", cover: "#5a2a72", paper: ["#f3e9f2", "#eaddee"], foil: null, holo: 0.5, guil: 0.12, duo: ["#1e0a30", "#ead6f2"], sky: 0.5, stars: 0 },
  { status: "Citizen", cover: "#8c2a7a", paper: ["#f8ebf4", "#eed8f0"], foil: ["#e1bde8", "#b78bc8"], holo: 0.85, guil: 0.16, duo: ["#260a3a", "#f7d3e8"], sky: 0.8, stars: 14 },
  { status: "Holder", cover: "#8c2a7a", paper: ["#fbecf3", "#f0d5ee"], foil: ["#f6e3a1", "#b8862d"], holo: 1, guil: 0.2, duo: ["#2a0a32", "#ffdcc4"], sky: 1, stars: 24 },
  { status: "Diamond Hands", cover: "#8c2a7a", paper: ["#fdeef4", "#f2d2ef"], foil: ["#fff1b8", "#b8862d"], holo: 1, guil: 0.24, duo: ["#2a0a32", "#ffdcc4"], sky: 1, stars: 36, shine: true },
  { status: "Founder", cover: "#8c2a7a", paper: ["#fff0f6", "#f5cfef"], foil: ["#fff6cf", "#c9962f"], holo: 1, guil: 0.28, duo: ["#2a0a32", "#ffdcc4"], sky: 1, stars: 52, shine: true },
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

function mrz(text, length = 44) {
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

/** The inside of the passport cover: a crop of the PALM passport artwork, which already carries the slogan and the chip. */
function Cover({ look }) {
  const stars = useMemo(() => scatter(11, look.stars, SPINE, 200), [look.stars]);
  return (
    <>
      <img
        src="/brand/passport-cover.jpg"
        alt=""
        style={{ position: "absolute", left: 0, top: 0, width: SPINE, height: IH, objectFit: "cover", objectPosition: "50% 70%", filter: `saturate(${0.2 + look.sky * 0.9}) brightness(${0.8 + look.sky * 0.2})` }}
      />
      {look.stars > 0 && (
        <svg width={SPINE} height={IH} style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
          {stars.map((star, index) => (
            <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#fff" opacity={star.o * 0.8} />
          ))}
        </svg>
      )}
    </>
  );
}
function Guilloche({ opacity }) {
  const lines = useMemo(() => {
    const out = [];
    for (let k = 0; k < 26; k += 1) {
      let d = "";
      for (let x = 0; x <= RW; x += 8) {
        const y = 250 + Math.sin(x / 46 + k * 0.32) * (60 + k * 3) + Math.sin(x / 19 - k * 0.2) * 10;
        d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)} `;
      }
      out.push(d);
    }
    return out;
  }, []);
  return (
    <svg width={RW} height={IH} style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
      {lines.map((d, index) => (
        <path key={index} d={d} fill="none" stroke="#9a4fb0" strokeWidth="0.8" opacity={opacity} />
      ))}
      {[34, 54, 74, 94, 114].map((r) => (
        <circle key={r} cx={RW - 120} cy="300" r={r} fill="none" stroke="#9a4fb0" strokeWidth="0.8" opacity={opacity * 0.9} />
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

function Field({ label, value, x, y, width = 176, size = 17 }) {
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
    <div style={{ position: "relative", width: 176, height: 224, borderRadius: 12, overflow: "hidden", isolation: "isolate", background: dark }}>
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
      <img src={portrait} alt="" width="176" height="224" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 12%", filter: `url(#${id})` }} />
      {/* fine print and scan lines, like a security photo */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgb(255 255 255 / 0.08) 0 1px, transparent 1px 3px)", mixBlendMode: "overlay" }} />
      <svg width="176" height="224" style={{ position: "absolute", inset: 0, mixBlendMode: "overlay" }} aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => (
          <text key={index} x={-20 + (index % 2) * 18} y={20 + index * 26} fontSize="9" letterSpacing="3" fill="#fff" opacity="0.32" fontFamily={PALM_FONT}>
            PALM PALM PALM PALM PALM PALM PALM PALM
          </text>
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 26px rgb(20 6 40 / 0.5)", borderRadius: 12 }} />
    </div>
  );
}
/** An open PALM ID passport. It reads credits and level from the account, and the more you do, the better it looks. */
export default function PalmId({ address, credit }) {
  const [quests, setQuests] = useState(null);
  const [width, setWidth] = useState(W);
  const wrap = useRef(null);

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

  const points = quests?.points || 0;
  const level = levelOf(points);
  const look = LOOKS[level.number - 1];
  const profile = useMemo(() => (address ? readProfile(address) : { name: "" }), [address]);
  const issued = useMemo(() => issuedOn(address), [address]);
  const holder = (profile?.name || "").trim() || (address ? "$PALM HOLDER" : "GUEST");
  const number = "PALM" + String(address ? (hash(address.toLowerCase()) % 9000) + 1000 : 0).padStart(4, "0");
  const date = new Date(issued + "T00:00:00");
  const issueText = Number.isNaN(date.getTime()) ? "NOV 2026" : `${MONTH[date.getMonth()]} ${date.getFullYear()}`;
  const issueMrz = Number.isNaN(date.getTime()) ? "202611" : `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const left = credit ? formatCredits(credit.remaining) : "0";
  const earned = quests ? formatCredits(quests.creditsEarned) : "0";
  const scale = Math.min(1, width / W);
  const foil = look.foil;
  const next = level.number < LOOKS.length ? level.number + 1 : null;

  return (
    <div className="mb-4">
      <div ref={wrap} className="mx-auto w-full" style={{ maxWidth: W, height: H * scale + 2 }}>
        <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <div
            style={{
              width: W,
              height: H,
              padding: FRAME,
              borderRadius: 26,
              backgroundColor: look.cover,
              backgroundImage: foil ? `linear-gradient(135deg, ${foil[0]}, ${foil[1]}, ${foil[0]}, ${foil[1]})` : "none",
              backgroundSize: "300% 300%",
              animation: look.shine ? "pid-foil 6s linear infinite" : undefined,
              boxShadow: "0 22px 48px rgb(30 8 50 / 0.4), 0 3px 8px rgb(30 8 50 / 0.3)",
              fontFamily: PALM_FONT,
            }}
          >
            <div style={{ position: "relative", width: IW, height: IH, borderRadius: 20, overflow: "hidden", background: "#14061f" }}>
              {/* left page: the inside of the cover */}
              <Cover look={look} />
              {/* right page: the data page */}
              <div
                style={{
                  position: "absolute",
                  left: SPINE,
                  top: 0,
                  width: RW,
                  height: IH,
                  background: `linear-gradient(120deg, ${look.paper[0]}, ${look.paper[1]})`,
                  color: INK,
                  overflow: "hidden",
                }}
              >
                <Guilloche opacity={look.guil} />
                <svg width={RW} height={IH} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
                  <Leaf x={600} y={90} rotate={-150} scale={1.3} opacity={look.guil * 1.6} />
                  <Leaf x={600} y={90} rotate={-120} scale={1.1} opacity={look.guil * 1.6} />
                  <Leaf x={610} y={400} rotate={-170} scale={1.2} opacity={look.guil * 1.6} />
                </svg>
                {look.shine && <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(115deg, transparent 35%, rgb(255 255 255 / 0.55) 50%, transparent 65%)", backgroundSize: "250% 100%", animation: "pid-sheen 5s ease-in-out infinite", pointerEvents: "none", zIndex: 4 }} />}

                {/* header */}
                <div style={{ position: "absolute", left: 34, top: 30, right: 120 }}>
                  <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "0.26em", color: INK }}>PALM ID</div>
                  <div style={{ marginTop: 5, fontSize: 11, letterSpacing: "0.32em", color: SOFT }}>HOLDER PASSPORT</div>
                  <div style={{ marginTop: 2, fontSize: 10, letterSpacing: "0.32em", color: SOFT }}>DECENTRALIZED CITIZEN</div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    right: 30,
                    top: 22,
                    width: 62,
                    height: 62,
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
                  <img src="/palm.png" alt="" width="40" height="40" style={{ opacity: 0.92 }} />
                </div>

                {/* photo */}
                <div style={{ position: "absolute", left: 32, top: 112, padding: 4, borderRadius: 16, background: "rgb(255 255 255 / 0.85)", boxShadow: "0 6px 16px rgb(60 20 80 / 0.3)" }}>
                  <Photo look={look} level={level.number} />
                </div>

                <Field label="NAME" value={holder.toUpperCase()} x={246} y={112} size={holder.length > 14 ? 14 : 17} />
                <Field label="STATUS" value={look.status.toUpperCase()} x={440} y={112} />
                <Field label="NATIONALITY" value="CHAD" x={246} y={178} />
                <Field label="ISSUE DATE" value={issueText} x={440} y={178} />
                <Field label="EXPIRY" value="NEVER" x={246} y={244} />
                <Field label="PASSPORT NO." value={number} x={440} y={244} />

                {/* credits live on the passport */}
                <div style={{ position: "absolute", left: 246, top: 316, width: 224, borderRadius: 14, background: "rgb(255 255 255 / 0.66)", boxShadow: "inset 0 0 0 1px rgb(90 42 114 / 0.2)", padding: "10px 14px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: "0.2em", color: SOFT }}>CREDITS</div>
                      <div style={{ marginTop: 1, fontSize: 28, fontWeight: 800, color: INK, letterSpacing: "0.02em" }}>{left}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, letterSpacing: "0.2em", color: SOFT }}>EARNED</div>
                      <div style={{ marginTop: 1, fontSize: 16, fontWeight: 700, color: INK }}>{earned}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 9, display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: "0.16em", color: SOFT }}>
                    <span>LEVEL {level.number}</span>
                    <span>{points.toLocaleString()} PTS</span>
                  </div>
                  <div style={{ marginTop: 4, height: 6, borderRadius: 3, background: "rgb(90 42 114 / 0.18)", overflow: "hidden" }}>
                    <div style={{ width: `${level.share * 100}%`, height: "100%", background: "linear-gradient(90deg, #8c2a7a, #e5476b)" }} />
                  </div>
                </div>

                {/* the main stamp arrives at level 2 */}
                {level.number >= 2 && (
                  <div style={{ position: "absolute", left: 458, top: 296, opacity: 0.9, mixBlendMode: "multiply" }}>
                    <Stamp size={140} color="#7a2f96" rotate={-9} text="APPROVED * DECENTRALIZED CITIZEN *" center="DEV2" centerSize={27} />
                  </div>
                )}

                {/* one visa stamp per level after the first */}
                <div style={{ position: "absolute", left: 28, top: 366, display: "flex", gap: 6 }}>
                  {[2, 3, 4, 5, 6].map((n) =>
                    level.number >= n ? (
                      <div key={n} style={{ mixBlendMode: "multiply" }}>
                        <Stamp size={34} color={["#7a2f96", "#c0306a", "#b8862d", "#2f7a8c", "#4a2fa0"][n - 2]} rotate={[-10, 8, -6, 12, -4][n - 2]} text="PALM ID * PALM ID * PALM *" fontSize={11} spacing={3} center={`LV ${n}`} centerSize={22} />
                      </div>
                    ) : (
                      <div key={n} style={{ width: 34, height: 34, borderRadius: "50%", border: "1.5px dashed rgb(90 42 114 / 0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "rgb(90 42 114 / 0.45)" }}>
                        {n}
                      </div>
                    ),
                  )}
                </div>

                <div style={{ position: "absolute", left: 32, top: 424, fontSize: 10, letterSpacing: "0.26em", color: SOFT }}>HODL TODAY. A MORE PRIVATE TOMORROW.</div>

                {/* machine readable zone */}
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 62, background: "rgb(255 255 255 / 0.55)", borderTop: "1px solid rgb(90 42 114 / 0.12)" }}>
                  <svg width={RW} height={62} aria-hidden="true">
                    <text x="32" y="26" textLength={RW - 64} lengthAdjust="spacing" fontSize="15" fontFamily={MONO} fill={INK}>
                      {mrz("P<PALM<<" + clean(holder))}
                    </text>
                    <text x="32" y="50" textLength={RW - 64} lengthAdjust="spacing" fontSize="15" fontFamily={MONO} fill={INK}>
                      {mrz(`${number}<<GLOBAL<<${clean(look.status)}<<${issueMrz}<<NEVER`)}
                    </text>
                  </svg>
                </div>
              </div>

              {/* the fold */}
              <div style={{ position: "absolute", left: SPINE - 46, top: 0, width: 46, height: IH, background: "linear-gradient(90deg, transparent, rgb(10 2 20 / 0.45))", pointerEvents: "none", zIndex: 5 }} />
              <div style={{ position: "absolute", left: SPINE, top: 0, width: 54, height: IH, background: "linear-gradient(90deg, rgb(10 2 20 / 0.38), transparent)", pointerEvents: "none", zIndex: 5 }} />
            </div>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-3 max-w-[760px] text-[12px] leading-5 text-[var(--muted)]">
        Level {level.number} · {look.status}. Your ID shows your credits and levels up as you earn points in Achievements.
        {next ? ` Level ${next} adds ${UNLOCKS[next - 1]}.` : " This is the best it gets."}
      </p>
    </div>
  );
}
