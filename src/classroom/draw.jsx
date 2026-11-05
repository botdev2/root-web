import { useEffect } from "react";

/**
 * Whiteboard drawing. Every shape is a hand-wobbled SVG path that is "drawn" by
 * animating its dash offset, and text is wiped in from the left like handwriting.
 * Coordinates live on a 1000 x 560 board.
 */

export const BOARD_W = 1000;
export const BOARD_H = 560;

export const COLORS = {
  ink: "#232a3a",
  red: "#d4414e",
  blue: "#2563c9",
  green: "#16915f",
  orange: "#d97a12",
  purple: "#7149c6",
};

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedOf(key) {
  let h = 2166136261;
  for (const ch of String(key)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

const wob = (r, amount) => (r() - 0.5) * 2 * amount;
const f = (n) => Math.round(n * 10) / 10;

export function linePath(x1, y1, x2, y2, key) {
  const r = rng(seedOf(key));
  const mx = (x1 + x2) / 2 + wob(r, 3);
  const my = (y1 + y2) / 2 + wob(r, 3);
  return `M${f(x1 + wob(r, 1.5))} ${f(y1 + wob(r, 1.5))} Q${f(mx)} ${f(my)} ${f(x2 + wob(r, 1.5))} ${f(y2 + wob(r, 1.5))}`;
}

export function rectPath(x, y, w, h, key) {
  const r = rng(seedOf(key));
  const rr = Math.min(12, w / 4, h / 4);
  const j = (n) => f(n + wob(r, 1.8));
  return [
    `M${j(x + rr)} ${j(y)}`,
    `L${j(x + w - rr)} ${j(y)}`,
    `Q${j(x + w)} ${j(y)} ${j(x + w)} ${j(y + rr)}`,
    `L${j(x + w)} ${j(y + h - rr)}`,
    `Q${j(x + w)} ${j(y + h)} ${j(x + w - rr)} ${j(y + h)}`,
    `L${j(x + rr)} ${j(y + h)}`,
    `Q${j(x)} ${j(y + h)} ${j(x)} ${j(y + h - rr)}`,
    `L${j(x)} ${j(y + rr)}`,
    `Q${j(x)} ${j(y)} ${j(x + rr + 8)} ${j(y - 1)}`,
  ].join(" ");
}

export function ellipsePath(cx, cy, rx, ry, key) {
  const r = rng(seedOf(key));
  const points = [];
  const steps = 44;
  const turn = Math.PI * 2 + 0.55;
  const start = r() * Math.PI * 2;
  for (let i = 0; i <= steps; i += 1) {
    const t = start + (turn * i) / steps;
    const grow = 1 + (i / steps) * 0.03 + wob(r, 0.012);
    points.push(`${f(cx + Math.cos(t) * rx * grow)} ${f(cy + Math.sin(t) * ry * grow)}`);
  }
  return `M${points.join(" L")}`;
}

export function arrowPaths(x1, y1, x2, y2, key) {
  const shaft = linePath(x1, y1, x2, y2, key);
  const r = rng(seedOf(key + "h"));
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const len = 20;
  const spread = 0.5;
  const a = angle + Math.PI - spread + wob(r, 0.06);
  const b = angle + Math.PI + spread + wob(r, 0.06);
  const head = `M${f(x2 + Math.cos(a) * len)} ${f(y2 + Math.sin(a) * len)} L${f(x2)} ${f(y2)} L${f(x2 + Math.cos(b) * len)} ${f(y2 + Math.sin(b) * len)}`;
  return { shaft, head };
}

export function underPath(x, y, w, key) {
  const r = rng(seedOf(key));
  const steps = Math.max(3, Math.round(w / 38));
  let d = `M${f(x)} ${f(y + wob(r, 1))}`;
  for (let i = 1; i <= steps; i += 1) {
    const px = x + (w * i) / steps;
    d += ` Q${f(px - w / steps / 2)} ${f(y + (i % 2 ? -5 : 5) + wob(r, 1.5))} ${f(px)} ${f(y + wob(r, 1.5))}`;
  }
  return d;
}

/** Icons are drawn in a 48 x 48 box. */
const ICONS = {
  wallet: ["M6 14h32a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z", "M6 14l28-6v6", "M42 26h-8a3 3 0 0 0 0 6h8"],
  coin: ["M40 24a16 16 0 1 1-32 0a16 16 0 1 1 32 0", "M24 14v20", "M30 18c-2-3-12-3-12 1s12 2 12 7-10 5-12 1"],
  lock: ["M12 22h24v18H12z", "M16 22v-6a8 8 0 0 1 16 0v6", "M24 29v5"],
  gear: [
    "M24 17a7 7 0 1 1 0 14a7 7 0 0 1 0-14",
    ...Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return `M${f(24 + Math.cos(a) * 12)} ${f(24 + Math.sin(a) * 12)} L${f(24 + Math.cos(a) * 18)} ${f(24 + Math.sin(a) * 18)}`;
    }),
  ],
  clock: ["M24 6a18 18 0 1 1 0 36a18 18 0 0 1 0-36", "M24 14v10l7 4"],
  shield: ["M24 5l15 5v12c0 10-7 17-15 21C16 39 9 32 9 22V10z", "M17 24l5 5 9-10"],
  site: ["M5 9h38v30H5z", "M5 17h38", "M10 13h1", "M15 13h1"],
  phone: ["M15 4h18a3 3 0 0 1 3 3v34a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z", "M21 38h6"],
  key: ["M14 16a8 8 0 1 1 0 16 8 8 0 0 1 0-16z", "M22 24h20", "M36 24v7", "M42 24v5"],
  branch: ["M10 10a4 4 0 1 0 8 0a4 4 0 1 0-8 0", "M14 14v20", "M10 38a4 4 0 1 0 8 0a4 4 0 1 0-8 0", "M30 18a4 4 0 1 0 8 0a4 4 0 1 0-8 0", "M34 22c0 8-20 6-20 12"],
  eye: ["M3 24c6-10 14-15 21-15s15 5 21 15c-6 10-14 15-21 15S9 34 3 24z", "M24 17a7 7 0 1 1 0 14 7 7 0 0 1 0-14"],
  chart: ["M6 6v36h36", "M12 32l9-10 7 6 12-16"],
  bank: ["M4 18L24 6l20 12z", "M10 20v16", "M20 20v16", "M28 20v16", "M38 20v16", "M4 40h40"],
  scale: ["M24 6v34", "M10 40h28", "M8 14h32", "M8 14l-5 14h10z", "M40 14l-5 14h10z"],
  robot: ["M10 16h28v22H10z", "M24 16V8", "M22 7h4", "M18 26h1", "M29 26h1", "M18 33h12"],
  mail: ["M5 11h38v26H5z", "M5 11l19 15 19-15"],
  person: ["M24 8a6 6 0 1 1 0 12 6 6 0 0 1 0-12z", "M10 42c0-10 6-14 14-14s14 4 14 14"],
  repo: ["M4 12h14l4 5h22v24H4z"],
  flag: ["M10 42V6", "M10 8h26l-6 8 6 8H10"],
  drop: ["M24 6c8 10 12 16 12 22a12 12 0 0 1-24 0c0-6 4-12 12-22z"],
  bug: ["M24 14a8 10 0 1 0 0 20a8 10 0 1 0 0-20", "M24 14v20", "M16 20l-8-4", "M32 20l8-4", "M16 28l-8 2", "M32 28l8 2"],
  book: ["M6 8h16c2 0 4 2 4 4v28c0-2-2-4-4-4H6z", "M42 8H28c-2 0-4 2-4 4v28c0-2 2-4 4-4h14z"],
};

export const ICON_NAMES = Object.keys(ICONS);

const DEFAULT_DUR = {
  box: 1000,
  arrow: 650,
  line: 600,
  ring: 850,
  icon: 950,
  under: 550,
  tick: 420,
  cross: 480,
  path: 1200,
  dot: 350,
  note: 450,
};

export function opDuration(op) {
  if (op.dur) return op.dur;
  if (op.t === "text") return Math.min(2800, Math.max(550, String(op.s).length * 52));
  return DEFAULT_DUR[op.t] || 700;
}

const textWidth = (op) => String(op.s).length * (op.size || 34) * 0.46;

/** Where the marker should be when this shape starts being drawn. */
export function opAnchor(op) {
  switch (op.t) {
    case "text": {
      const w = textWidth(op);
      return { x: op.anchor === "middle" ? op.x - w / 2 : op.x, y: op.y };
    }
    case "box":
      return { x: op.x, y: op.y };
    case "arrow":
    case "line":
      return { x: op.x1, y: op.y1 };
    case "ring":
      return { x: op.x - op.rx, y: op.y };
    case "icon":
      return { x: op.x - (op.size || 60) / 2, y: op.y };
    case "under":
      return { x: op.x, y: op.y };
    case "dot":
    case "tick":
    case "cross":
    case "note":
      return { x: op.x, y: op.y };
    default:
      return { x: op.x ?? 500, y: op.y ?? 280 };
  }
}

const stroke = (op) => COLORS[op.color] || COLORS.ink;

function Draw({ d, color, width = 3.6, dur, delay = 0, dashed, instant }) {
  return (
    <path
      d={d}
      pathLength="1"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={instant ? undefined : dashed ? "bw-fade" : "bw-draw"}
      style={{
        strokeDasharray: dashed ? "0.02 0.025" : 1,
        animationDuration: instant ? undefined : `${dur}ms`,
        animationDelay: instant ? undefined : `${delay}ms`,
      }}
    />
  );
}

export function Op({ op, id, onPen, instant }) {
  const dur = opDuration(op);
  const color = stroke(op);

  useEffect(() => {
    if (instant) return;
    const anchor = opAnchor(op);
    onPen?.(anchor, op.color || "ink", dur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  switch (op.t) {
    case "text": {
      const size = op.size || 34;
      const w = textWidth(op) + 24;
      const x0 = op.anchor === "middle" ? op.x - w / 2 : op.x - 6;
      const clip = `bw-clip-${id}`;
      return (
        <g>
          <defs>
            <clipPath id={clip}>
              <rect
                x={x0}
                y={op.y - size * 1.1}
                width={w}
                height={size * 1.7}
                className={instant ? undefined : "bw-wipe"}
                style={{ animationDuration: instant ? undefined : `${dur}ms` }}
              />
            </clipPath>
          </defs>
          <text
            x={op.x}
            y={op.y}
            textAnchor={op.anchor === "middle" ? "middle" : "start"}
            fontSize={size}
            fill={color}
            className="bw-text"
            clipPath={`url(#${clip})`}
            transform={op.rot ? `rotate(${op.rot} ${op.x} ${op.y})` : undefined}
          >
            {op.s}
          </text>
        </g>
      );
    }
    case "box": {
      const d = rectPath(op.x, op.y, op.w, op.h, id);
      const cx = op.x + op.w / 2;
      return (
        <g>
          {op.fill && <rect x={op.x} y={op.y} width={op.w} height={op.h} rx="12" fill={op.fill} opacity="0.5" className={instant ? undefined : "bw-fade"} style={{ animationDelay: `${dur * 0.6}ms` }} />}
          <Draw d={d} color={color} dur={dur} instant={instant} dashed={op.dashed} />
          {op.label && (
            <text
              x={cx}
              y={op.y + op.h * (op.sub ? 0.62 : 0.74)}
              textAnchor="middle"
              fontSize={op.size || 36}
              fill={color}
              className={`bw-text ${instant ? "" : "bw-fade"}`}
              style={{ animationDelay: `${dur * 0.55}ms` }}
            >
              {op.label}
            </text>
          )}
          {op.sub && (
            <text
              x={cx}
              y={op.y + op.h * 0.86}
              textAnchor="middle"
              fontSize={op.subSize || 24}
              fill={COLORS.ink}
              opacity="0.8"
              className={`bw-text ${instant ? "" : "bw-fade"}`}
              style={{ animationDelay: `${dur * 0.7}ms` }}
            >
              {op.sub}
            </text>
          )}
        </g>
      );
    }
    case "arrow": {
      const { shaft, head } = arrowPaths(op.x1, op.y1, op.x2, op.y2, id);
      return (
        <g>
          <Draw d={shaft} color={color} dur={dur * 0.75} instant={instant} dashed={op.dashed} />
          <Draw d={head} color={color} dur={dur * 0.3} delay={dur * 0.7} instant={instant} />
        </g>
      );
    }
    case "line":
      return <Draw d={linePath(op.x1, op.y1, op.x2, op.y2, id)} color={color} dur={dur} instant={instant} dashed={op.dashed} width={op.w || 3.6} />;
    case "ring":
      return <Draw d={ellipsePath(op.x, op.y, op.rx, op.ry, id)} color={color} dur={dur} instant={instant} dashed={op.dashed} />;
    case "under":
      return <Draw d={underPath(op.x, op.y, op.w, id)} color={color} dur={dur} instant={instant} width={3} />;
    case "icon": {
      const size = op.size || 60;
      const scale = size / 48;
      const paths = ICONS[op.n] || [];
      return (
        <g transform={`translate(${op.x - size / 2} ${op.y - size / 2}) scale(${scale})`}>
          {paths.map((d, i) => (
            <Draw key={i} d={d} color={color} width={3.2 / scale} dur={dur * 0.8} delay={(dur * 0.2 * i) / Math.max(1, paths.length)} instant={instant} />
          ))}
        </g>
      );
    }
    case "tick": {
      const s = op.size || 36;
      return <Draw d={`M${op.x} ${op.y} l${s * 0.35} ${s * 0.4} l${s * 0.7} ${-s * 0.9}`} color={COLORS[op.color] || COLORS.green} width={5} dur={dur} instant={instant} />;
    }
    case "cross": {
      const s = (op.size || 60) / 2;
      return (
        <g>
          <Draw d={`M${op.x - s} ${op.y - s} L${op.x + s} ${op.y + s}`} color={COLORS[op.color] || COLORS.red} width={6} dur={dur * 0.55} instant={instant} />
          <Draw d={`M${op.x + s} ${op.y - s} L${op.x - s} ${op.y + s}`} color={COLORS[op.color] || COLORS.red} width={6} dur={dur * 0.55} delay={dur * 0.45} instant={instant} />
        </g>
      );
    }
    case "path":
      return <Draw d={op.d} color={color} dur={dur} instant={instant} dashed={op.dashed} width={op.w || 3.6} />;
    case "dot":
      return <circle cx={op.x} cy={op.y} r={op.r || 9} fill={color} className={instant ? undefined : "bw-pop"} />;
    case "note": {
      const rot = op.rot ?? -2;
      return (
        <g transform={`rotate(${rot} ${op.x + op.w / 2} ${op.y + op.h / 2})`} className={instant ? undefined : "bw-pop"}>
          <rect x={op.x + 4} y={op.y + 5} width={op.w} height={op.h} rx="4" fill="#000" opacity="0.12" />
          <rect x={op.x} y={op.y} width={op.w} height={op.h} rx="4" fill={op.fill || "#fff1a1"} />
          {(op.lines || []).map((line, i) => (
            <text key={i} x={op.x + 16} y={op.y + 34 + i * 32} fontSize={op.size || 26} fill={COLORS[op.color] || COLORS.ink} className="bw-text">
              {line}
            </text>
          ))}
        </g>
      );
    }
    default:
      return null;
  }
}
