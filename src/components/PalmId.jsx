import { useEffect, useMemo, useRef, useState } from "react";
import { formatCredits, readQuests } from "../glmChat.js";
import { readProfile } from "../account.js";
import { levelOf } from "./views/QuestsView.jsx";

const W = 760;
const H = 430;
const INK = "#3b1650";
const SOFT = "#7d5a8e";

const SUNSET = ["#2a0f4a", "#8c2a7a", "#e5476b", "#ff9a4a"];

// What the card looks like at each level. Higher level, richer card.
const LOOKS = [
  { status: "Visitor", paper: ["#ecebef", "#e2dfe7"], foil: null, holo: 0.18, leaves: 0.05, photo: ["#a29cad", "#80788c"], sun: false },
  { status: "Resident", paper: ["#f2e8f1", "#e9d9ec"], foil: null, holo: 0.45, leaves: 0.12, photo: ["#8a4a9b", "#5a2a72"], sun: false },
  { status: "Citizen", paper: ["#f8eaf3", "#ecd6ef"], foil: ["#d9b4e0", "#bd8fcb"], holo: 0.8, leaves: 0.2, photo: SUNSET, sun: true },
  { status: "Holder", paper: ["#fbebf2", "#efd3ee"], foil: ["#f6e3a1", "#b8862d"], holo: 1, leaves: 0.26, photo: SUNSET, sun: true },
  { status: "Diamond Hands", paper: ["#fdedf3", "#f1d0ee"], foil: ["#fff1b8", "#b8862d"], holo: 1, leaves: 0.3, photo: SUNSET, sun: true, shine: true },
  { status: "Founder", paper: ["#fff0f6", "#f4ccee"], foil: ["#fff6cf", "#c9962f"], holo: 1, leaves: 0.34, photo: SUNSET, sun: true, shine: true },
];

const UNLOCKS = ["", "a jacket and the first visa stamp", "sunglasses and a sunset photo", "a gold chain and a gold border", "braids and a foil shimmer", "a crown and a diamond"];

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

function Field({ label, value, top }) {
  return (
    <div style={{ position: "absolute", left: 232, top, width: 270 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.16em", color: SOFT }}>{label}</div>
      <div style={{ marginTop: 2, fontSize: 17, fontWeight: 700, letterSpacing: "0.06em", color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    </div>
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

function Portrait({ level }) {
  const look = LOOKS[level - 1];
  const gradient = look.photo;
  return (
    <svg width="180" height="230" viewBox="0 0 180 230" style={{ display: "block", borderRadius: 14 }}>
      <defs>
        <linearGradient id="pid-sky" x1="0" y1="0" x2="0" y2="1">
          {gradient.map((color, index) => (
            <stop key={color + index} offset={index / (gradient.length - 1)} stopColor={color} />
          ))}
        </linearGradient>
        <linearGradient id="pid-skin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e1ab7c" />
          <stop offset="1" stopColor="#c48556" />
        </linearGradient>
        <linearGradient id="pid-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff1b8" />
          <stop offset="1" stopColor="#c9962f" />
        </linearGradient>
        <clipPath id="pid-clip">
          <rect width="180" height="230" rx="14" />
        </clipPath>
      </defs>
      <g clipPath="url(#pid-clip)">
        <rect width="180" height="230" fill="url(#pid-sky)" />
        {look.sun && (
          <>
            <circle cx="90" cy="150" r="46" fill="#ffd27a" opacity="0.85" />
            <path d="M0 175 H180 V230 H0Z" fill="#3a1050" opacity="0.55" />
            <g fill="#220a38" opacity="0.8">
              <path d="M18 175 L22 110 Q10 100 -4 106 Q10 98 24 104 Q22 92 12 88 Q26 90 26 104 L30 175Z" />
              <path d="M160 175 L156 120 Q170 110 186 116 Q170 108 156 114 Q158 100 168 96 Q152 100 152 114 L148 175Z" />
            </g>
          </>
        )}
        {level >= 6 && (
          <g>
            <ellipse cx="90" cy="38" rx="46" ry="10" fill="none" stroke="url(#pid-gold)" strokeWidth="4" />
            <path d="M90 14 L100 28 L90 42 L80 28Z" fill="#bfeaff" stroke="#fff" strokeWidth="1.5" />
          </g>
        )}
        {/* shoulders */}
        <path d="M6 232 C14 188 52 176 90 176 C128 176 166 188 174 232Z" fill={level >= 2 ? "#f6f5f8" : "#8e7f99"} />
        {level >= 2 && (
          <>
            <path d="M70 178 L90 206 L110 178" fill="none" stroke="#1d2a5c" strokeWidth="5" strokeLinejoin="round" />
            <path d="M28 206 C24 214 22 222 22 232 M152 206 C156 214 158 222 158 232" stroke="#1d2a5c" strokeWidth="4" fill="none" />
          </>
        )}
        {/* neck + head */}
        <rect x="74" y="150" width="32" height="34" rx="10" fill="#b87a4e" />
        <ellipse cx="38" cy="112" rx="8" ry="14" fill="#c48556" />
        <ellipse cx="142" cy="112" rx="8" ry="14" fill="#c48556" />
        <ellipse cx="90" cy="108" rx="52" ry="60" fill="url(#pid-skin)" />
        {level >= 5 ? (
          <g>
            <path d="M36 100 C34 30 146 30 144 100 C134 70 46 70 36 100Z" fill="#241713" />
            {[44, 56, 68, 80, 92, 104, 116, 128, 138].map((x) => (
              <path key={x} d={`M${x} 52 q-3 22 -1 48`} stroke="#3a2820" strokeWidth="3" fill="none" strokeLinecap="round" />
            ))}
          </g>
        ) : (
          <path d="M38 98 C36 30 144 30 142 98 C130 72 50 72 38 98Z" fill="#2a1c18" />
        )}
        {level >= 3 ? (
          <g>
            <rect x="48" y="94" width="38" height="24" rx="9" fill="#15151a" />
            <rect x="94" y="94" width="38" height="24" rx="9" fill="#15151a" />
            <rect x="84" y="100" width="12" height="4" fill="#15151a" />
            <path d="M54 99 L70 99" stroke="#fff" strokeWidth="2" opacity="0.35" strokeLinecap="round" />
          </g>
        ) : (
          <g fill="#2a1c18">
            <ellipse cx="68" cy="106" rx="5" ry="6" />
            <ellipse cx="112" cy="106" rx="5" ry="6" />
          </g>
        )}
        <path d="M72 148 Q90 142 108 148" stroke="#7a4a30" strokeWidth="3" fill="none" strokeLinecap="round" />
        {level >= 4 && (
          <g>
            <path d="M56 184 Q90 222 124 184" stroke="url(#pid-gold)" strokeWidth="4" fill="none" strokeLinecap="round" />
            <circle cx="90" cy="212" r="9" fill="url(#pid-gold)" stroke="#a87a1f" strokeWidth="1" />
            <path d="M90 217 V207 M84 208 Q90 203 96 208" stroke="#7a5314" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        )}
      </g>
    </svg>
  );
}

function Stamp({ size, color, rotate, text, sub, fontSize = 9.5, spacing = 1.1 }) {
  const id = "pid-arc-" + size + text.length;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: `rotate(${rotate}deg)` }}>
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
      <g transform="translate(60 56)" fill={color}>
        <path d="M0 8 C-4 -2 -14 -8 -22 -6 C-14 -2 -8 2 -4 8Z" />
        <path d="M0 8 C4 -2 14 -8 22 -6 C14 -2 8 2 4 8Z" />
        <path d="M0 10 C-2 -6 -2 -14 0 -20 C2 -14 2 -6 0 10Z" />
        <rect x="-1.5" y="6" width="3" height="16" rx="1.5" />
      </g>
      {sub && (
        <text x="60" y="94" textAnchor="middle" fill={color} fontSize="9" fontWeight="700" letterSpacing="1.6" fontFamily="inherit">
          {sub}
        </text>
      )}
    </svg>
  );
}

/** A PALM ID passport page. It reads credits and level from the account, and the more you do, the better it looks. */
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
              padding: foil ? 4 : 0,
              borderRadius: 22,
              backgroundImage: foil ? `linear-gradient(135deg, ${foil[0]}, ${foil[1]}, ${foil[0]}, ${foil[1]})` : "none",
              backgroundSize: "300% 300%",
              animation: look.shine ? "pid-foil 6s linear infinite" : undefined,
              boxShadow: "0 18px 40px rgb(30 8 50 / 0.35), 0 2px 6px rgb(30 8 50 / 0.25)",
              fontFamily: '"Courier New", ui-monospace, monospace',
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: foil ? 18 : 22,
                overflow: "hidden",
                background: `linear-gradient(120deg, ${look.paper[0]}, ${look.paper[1]})`,
                color: INK,
              }}
            >
              {/* palm leaves in the paper */}
              <svg width={W} height={H} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
                <Leaf x={700} y={90} rotate={-150} scale={1.3} opacity={look.leaves} />
                <Leaf x={700} y={90} rotate={-120} scale={1.1} opacity={look.leaves} />
                <Leaf x={720} y={330} rotate={-170} scale={1.2} opacity={look.leaves} />
                <Leaf x={560} y={400} rotate={-20} scale={1} opacity={look.leaves} />
                <Leaf x={240} y={420} rotate={-30} scale={0.9} opacity={look.leaves * 0.8} />
              </svg>

              {look.shine && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, transparent 35%, rgb(255 255 255 / 0.5) 50%, transparent 65%)", backgroundSize: "250% 100%", animation: "pid-sheen 5s ease-in-out infinite", pointerEvents: "none", zIndex: 3 }} />}

              {/* header */}
              <div style={{ position: "absolute", left: 28, top: 22, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 46, height: 46, borderRadius: 11, background: "#5a2a72", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src="/palm.png" alt="" width="32" height="32" />
                </div>
                <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#5a2a72" }}>PaLM</div>
                  <div style={{ marginTop: 3, fontSize: 22, fontWeight: 800, color: "#5a2a72" }}>AI</div>
                </div>
              </div>
              <div style={{ position: "absolute", left: 232, top: 26, right: 110 }}>
                <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "0.22em", color: INK }}>PALM ID</div>
                <div style={{ marginTop: 4, fontSize: 11, letterSpacing: "0.3em", color: SOFT }}>DECENTRALIZED CITIZEN</div>
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 28,
                  top: 20,
                  width: 58,
                  height: 58,
                  borderRadius: 10,
                  opacity: look.holo,
                  backgroundImage: "linear-gradient(135deg, #6fd3ff 0%, #b18cff 30%, #ff8bd0 55%, #ffd36f 80%, #8cffd0 100%)",
                  backgroundSize: "200% 200%",
                  animation: look.shine ? "pid-foil 4s linear infinite" : undefined,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.6)",
                }}
              >
                <img src="/palm.png" alt="" width="36" height="36" style={{ opacity: 0.9 }} />
              </div>

              {/* photo */}
              <div style={{ position: "absolute", left: 28, top: 100, width: 180, height: 230, borderRadius: 14, boxShadow: "0 0 0 3px rgb(255 255 255 / 0.7), 0 4px 12px rgb(60 20 80 / 0.3)" }}>
                <Portrait level={level.number} />
              </div>

              <Field label="NAME" value={holder.toUpperCase()} top={98} />
              <Field label="STATUS" value={look.status.toUpperCase()} top={136} />
              <Field label="NATIONALITY" value="CHAD" top={174} />
              <Field label="ISSUE DATE" value={issueText} top={212} />
              <Field label="EXPIRY" value="NEVER" top={250} />
              <Field label="PASSPORT NO." value={number} top={288} />

              {/* credits live on the card */}
              <div style={{ position: "absolute", left: 520, top: 100, width: 212, borderRadius: 14, background: "rgb(255 255 255 / 0.62)", boxShadow: "inset 0 0 0 1px rgb(90 42 114 / 0.2)", padding: "12px 14px" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.16em", color: SOFT }}>CREDITS</div>
                <div style={{ marginTop: 2, fontSize: 30, fontWeight: 800, color: INK, letterSpacing: "-0.02em" }}>{left}</div>
                <div style={{ marginTop: 2, fontSize: 11, color: SOFT }}>{earned} earned</div>
                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: "0.14em", color: SOFT }}>
                  <span>LEVEL {level.number}</span>
                  <span>{points.toLocaleString()} PTS</span>
                </div>
                <div style={{ marginTop: 4, height: 6, borderRadius: 3, background: "rgb(90 42 114 / 0.18)", overflow: "hidden" }}>
                  <div style={{ width: `${level.share * 100}%`, height: "100%", background: "linear-gradient(90deg, #8c2a7a, #e5476b)" }} />
                </div>
              </div>

              {/* the main stamp arrives at level 2 */}
              {level.number >= 2 && (
                <div style={{ position: "absolute", left: 576, top: 224, opacity: 0.88, mixBlendMode: "multiply" }}>
                  <Stamp size={130} color="#7a2f96" rotate={-8} text="PALM APPROVED * DECENTRALIZED CITIZEN *" />
                </div>
              )}

              {/* one visa stamp per level after the first */}
              <div style={{ position: "absolute", left: 232, top: 332, display: "flex", gap: 8 }}>
                {[2, 3, 4, 5, 6].map((n) =>
                  level.number >= n ? (
                    <div key={n} style={{ mixBlendMode: "multiply" }}>
                      <Stamp size={40} color={["#7a2f96", "#c0306a", "#b8862d", "#2f7a8c", "#4a2fa0"][n - 2]} rotate={[-10, 8, -6, 12, -4][n - 2]} text="PALM ID * PALM ID * PALM *" fontSize={11} spacing={3} sub={`LV ${n}`} />
                    </div>
                  ) : (
                    <div key={n} style={{ width: 40, height: 40, borderRadius: "50%", border: "1.5px dashed rgb(90 42 114 / 0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "rgb(90 42 114 / 0.45)" }}>
                      {n}
                    </div>
                  ),
                )}
              </div>

              {/* machine readable zone */}
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 54, background: "rgb(255 255 255 / 0.5)" }}>
                <svg width={W} height={54} aria-hidden="true">
                  <text x="28" y="22" textLength="704" lengthAdjust="spacing" fontSize="15" fontFamily="inherit" fill={INK}>
                    {mrz("P<PALM<<" + clean(holder))}
                  </text>
                  <text x="28" y="43" textLength="704" lengthAdjust="spacing" fontSize="15" fontFamily="inherit" fill={INK}>
                    {mrz(`${number}<<GLOBAL<<${clean(look.status)}<<${issueMrz}<<NEVER`)}
                  </text>
                </svg>
              </div>
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
