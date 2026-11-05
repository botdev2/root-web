import { useEffect } from "react";
import { COLORS } from "./draw.jsx";
import { POOL, buy, px, py } from "./poolMath.js";

/**
 * Hands-on parts of a lesson. A widget has two halves: Board draws into the
 * whiteboard SVG, Controls sits under the board with the teacher. Reaching a
 * widget's goal earns a star. Pressing Continue always moves on.
 */

const chip =
  "cr-btn rounded-lg border px-3 py-1.5 text-[13px] transition-colors disabled:opacity-60";

function Continue({ onClick, label = "Continue" }) {
  return (
    <button type="button" onClick={onClick} className="cr-btn cr-btn--solid ml-auto h-9 rounded-lg px-4 text-[13px]">
      {label}
    </button>
  );
}

const money = (n) => `$${Math.round(n).toLocaleString()}`;

/* ---------------------------------------------------------------- swap */

function SwapBoard({ s }) {
  const paid = s.paid || 0;
  const r = buy(paid);
  const start = { x: px(POOL.eth), y: py(POOL.tokens) };
  const end = { x: px(r.eth), y: py(r.tokens) };
  return (
    <g className="bw-live">
      <circle cx={start.x} cy={start.y} r="9" fill={COLORS.green} />
      <text x={start.x - 20} y={start.y - 18} fontSize="26" textAnchor="end" fill={COLORS.green} className="bw-text">
        start
      </text>
      {paid > 0.01 && (
        <>
          <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={COLORS.red} strokeWidth="3" strokeDasharray="7 7" />
          <circle cx={end.x} cy={end.y} r="10" fill={COLORS.red} />
        </>
      )}
      <text x="560" y="190" fontSize="32" fill={COLORS.ink} className="bw-text">
        you pay {paid.toFixed(2)} ETH
      </text>
      <text x="560" y="232" fontSize="32" fill={COLORS.ink} className="bw-text">
        you get {Math.round(r.out)} tokens
      </text>
      <text x="560" y="276" fontSize="36" fill={r.spotMove >= 20 ? COLORS.red : COLORS.blue} className="bw-text">
        price moved +{r.spotMove.toFixed(1)}%
      </text>
    </g>
  );
}

function SwapControls({ s, set, award, done, finish }) {
  const r = buy(s.paid || 0);
  useEffect(() => {
    if (r.spotMove >= 20) award("swap");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.spotMove >= 20]);
  return (
    <div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="5"
          step="0.05"
          value={s.paid || 0}
          onChange={(event) => set({ ...s, paid: Number(event.target.value) })}
          className="cr-range min-w-0 flex-1"
          aria-label="ETH to pay into the pool"
        />
        <span className="w-24 shrink-0 text-right text-[13px] tabular-nums">{(s.paid || 0).toFixed(2)} ETH</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <p className="text-[12.5px] text-[var(--cr-muted)]">
          {done
            ? `The price moved ${r.spotMove.toFixed(0)}% from one trade. Small pools slip fast, so depth matters.`
            : "Goal: push the price up by 20% with a single buy."}
        </p>
        <Continue onClick={finish} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- cadence */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MODES = ["Manual", "Hourly", "Daily", "Weekly"];
const RUNS = { Manual: 0, Hourly: 168, Daily: 7, Weekly: 1 };

function CadenceBoard({ s }) {
  const mode = s.mode || "Manual";
  const runs = RUNS[mode];
  return (
    <g className="bw-live">
      <text x="60" y="392" fontSize="30" fill={COLORS.ink} className="bw-text">
        one week of runs
      </text>
      {DAYS.map((day, i) => {
        const x = 70 + i * 128;
        const marks =
          mode === "Hourly" ? Array.from({ length: 24 }, (_, h) => h) : mode === "Daily" ? [0] : mode === "Weekly" && i === 0 ? [0] : [];
        return (
          <g key={day}>
            <rect x={x} y="410" width="112" height="86" rx="8" fill="none" stroke={COLORS.ink} strokeWidth="2.6" />
            <text x={x + 56} y="436" fontSize="22" textAnchor="middle" fill={COLORS.ink} opacity="0.7" className="bw-text">
              {day}
            </text>
            {mode === "Hourly"
              ? marks.map((h) => (
                  <line key={h} x1={x + 8 + h * 4} y1="448" x2={x + 8 + h * 4} y2="486" stroke={COLORS.purple} strokeWidth="2" />
                ))
              : marks.map((h) => <circle key={h} cx={x + 56} cy="466" r="9" fill={COLORS.purple} />)}
          </g>
        );
      })}
      <text x="60" y="534" fontSize="32" fill={COLORS.blue} className="bw-text">
        {mode === "Manual" ? "runs only when you press Run" : `${runs} run${runs === 1 ? "" : "s"} a week`}
      </text>
    </g>
  );
}

function CadenceControls({ s, set, award, done, finish }) {
  const mode = s.mode || "Manual";
  const pick = (next) => {
    set({ ...s, mode: next });
    if (next === "Daily") award("cadence");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {MODES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => pick(item)}
            className={`${chip} ${mode === item ? "cr-btn--on" : ""}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <p className="text-[12.5px] text-[var(--cr-muted)]">
          {done
            ? "Daily catches yesterday's changes without paying for 168 runs. Every run spends credits."
            : "Goal: a nightly review of yesterday's commits. Which cadence is enough?"}
        </p>
        <Continue onClick={finish} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- leak */

export const LEAK_BUCKETS = [
  { id: "ops", label: "Ops handles it", color: "green", x: 170 },
  { id: "you", label: "You handle it", color: "orange", x: 500 },
  { id: "public", label: "Always public", color: "red", x: 830 },
];

export const LEAK_ITEMS = [
  { s: "email sign-up", to: "ops", why: "There isn't one. A wallet signature replaces it." },
  { s: "domain registrant", to: "ops", why: "Ops is the registrant, so the record shows Ops." },
  { s: "your IP address", to: "you", why: "That's your connection. A VPN and the Telemetry check are yours to run." },
  { s: "wallet history", to: "public", why: "Every transaction on a chain is public forever. Use separate wallets." },
  { s: "git name + email", to: "you", why: "Set a neutral identity in your own git before you commit." },
  { s: "GitHub token", to: "ops", why: "Ops uses it once to add a read-only deploy key, then forgets it." },
  { s: "taxes + the law", to: "you", why: "Privacy tools don't move your legal duties. Those stay with you." },
];

function LeakBoard({ s }) {
  const placed = s.placed || [];
  const rows = { ops: 0, you: 0, public: 0 };
  return (
    <g className="bw-live">
      {placed.map((p) => {
        const bucket = LEAK_BUCKETS.find((b) => b.id === p.to);
        const row = rows[p.to]++;
        const y = 205 + row * 54;
        return (
          <g key={p.s} className="bw-pop">
            <text x={bucket.x} y={y} fontSize="30" textAnchor="middle" fill={COLORS[bucket.color]} className="bw-text">
              {p.s}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function LeakControls({ s, set, award, done, finish }) {
  const placed = s.placed || [];
  const index = placed.length;
  const item = LEAK_ITEMS[index];
  const wrong = s.wrong || "";
  const answer = (id) => {
    if (!item) return;
    if (id !== item.to) {
      set({ ...s, wrong: id, misses: (s.misses || 0) + 1, miss: true });
      return;
    }
    const first = s.miss ? s.first || 0 : (s.first || 0) + 1;
    const next = { ...s, placed: [...placed, { s: item.s, to: item.to }], wrong: "", miss: false, first, why: item.why };
    set(next);
    if (next.placed.length === LEAK_ITEMS.length && first >= 5) award("leak");
  };
  const finished = index >= LEAK_ITEMS.length;
  return (
    <div>
      {!finished ? (
        <>
          <div className="mb-2 text-[13px]">
            Where does <span className="cr-hand text-[19px]">{item.s}</span> belong?
          </div>
          <div className="flex flex-wrap gap-2">
            {LEAK_BUCKETS.map((b) => (
              <button key={b.id} type="button" onClick={() => answer(b.id)} className={`${chip} ${wrong === b.id ? "cr-shake cr-btn--bad" : ""}`}>
                {b.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
      <div className="mt-2 flex items-center gap-3">
        <p className="text-[12.5px] text-[var(--cr-muted)]">
          {wrong && item
            ? "Not that one. Think about who controls it."
            : finished
              ? `${s.first || 0} of ${LEAK_ITEMS.length} on the first try. ${done ? "Nicely sorted." : "Worth a second look at the red and orange columns."}`
              : s.why || "Sort all seven."}
        </p>
        <Continue onClick={finish} label={finished ? "Continue" : "Skip"} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- revenue */

const SALE_PRICE = 25;

function hosting(sites) {
  if (sites <= 2) return { name: "Plot", cost: 8 };
  if (sites <= 8) return { name: "Grove", cost: 24 };
  return { name: "Canopy", cost: 60 };
}

export function revenueOf(s) {
  const recurring = (s.subs ?? 20) * (s.price ?? 15);
  const oneoff = (s.sales ?? 10) * SALE_PRICE;
  const plan = hosting(s.sites ?? 3);
  return { recurring, oneoff, plan, net: recurring + oneoff - plan.cost };
}

function RevenueBoard({ s }) {
  const r = revenueOf(s);
  const bars = [
    { label: "subscriptions", value: r.recurring, color: COLORS.blue },
    { label: "one-off sales", value: r.oneoff, color: COLORS.orange },
    { label: `hosting (${r.plan.name})`, value: r.plan.cost, color: COLORS.red },
    { label: "left over", value: Math.max(0, r.net), color: COLORS.green, negative: r.net < 0 },
  ];
  const top = Math.max(300, ...bars.map((b) => b.value));
  const scale = 300 / top;
  return (
    <g className="bw-live">
      <line x1="70" y1="470" x2="930" y2="470" stroke={COLORS.ink} strokeWidth="3" strokeLinecap="round" />
      {bars.map((bar, i) => {
        const h = Math.max(2, bar.value * scale);
        const x = 110 + i * 205;
        return (
          <g key={bar.label}>
            <rect x={x} y={470 - h} width="130" height={h} rx="6" fill={bar.color} opacity="0.88" style={{ transition: "y 0.35s ease, height 0.35s ease" }} />
            <text x={x + 65} y={470 - h - 12} fontSize="32" textAnchor="middle" fill={bar.color} className="bw-text">
              {bar.negative ? `-${money(-r.net)}` : money(bar.value)}
            </text>
            <text x={x + 65} y="508" fontSize="25" textAnchor="middle" fill={COLORS.ink} className="bw-text">
              {bar.label}
            </text>
          </g>
        );
      })}
      <text x="70" y="152" fontSize="30" fill={COLORS.ink} className="bw-text">
        one month
      </text>
    </g>
  );
}

function Slider({ label, value, min, max, step = 1, format, onChange }) {
  return (
    <label className="block min-w-0">
      <div className="mb-0.5 flex justify-between gap-2 text-[12px] text-[var(--cr-muted)]">
        <span>{label}</span>
        <span className="tabular-nums text-[var(--cr-ink)]">{format ? format(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="cr-range w-full" />
    </label>
  );
}

function RevenueControls({ s, set, award, done, finish }) {
  const v = { subs: s.subs ?? 20, price: s.price ?? 15, sales: s.sales ?? 10, sites: s.sites ?? 3 };
  const r = revenueOf(v);
  useEffect(() => {
    if (r.net >= 200) award("revenue");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.net >= 200]);
  const upd = (key) => (value) => set({ ...s, ...v, [key]: value });
  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <Slider label="subscribers" value={v.subs} min={0} max={100} onChange={upd("subs")} />
        <Slider label="monthly price" value={v.price} min={5} max={50} format={money} onChange={upd("price")} />
        <Slider label={`one-off sales at ${money(SALE_PRICE)}`} value={v.sales} min={0} max={100} onChange={upd("sales")} />
        <Slider label="sites you host" value={v.sites} min={1} max={20} onChange={upd("sites")} />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <p className="text-[12.5px] text-[var(--cr-muted)]">
          {done ? `${money(r.net)} a month left over. Flat hosting kept the cost still while revenue grew.` : "Goal: leave $200 a month after hosting."}
        </p>
        <Continue onClick={finish} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ registry */

/* ---------------------------------------------------------- build packs */

export const PACKS = [
  { id: "nixpacks", label: "Nixpacks", color: "blue" },
  { id: "dockerfile", label: "Dockerfile", color: "purple" },
  { id: "static", label: "Static", color: "green" },
  { id: "dist", label: "Dist", color: "orange" },
];

export const PACK_ITEMS = [
  { s: "a Node app with a package.json", to: "nixpacks", why: "Nixpacks reads your project files and works out the build by itself." },
  { s: "a repo with its own Dockerfile", to: "dockerfile", why: "A Dockerfile means you decide every build step." },
  { s: "plain HTML, CSS and images", to: "static", why: "Nothing to build, so Static just serves the files." },
  { s: "a folder you already built", to: "dist", why: "Dist serves a build output you made yourself." },
];

function PackBoard({ s }) {
  const placed = s.placed || [];
  return (
    <g className="bw-live">
      {PACKS.map((pack, i) => {
        const x = 40 + i * 235;
        return (
          <g key={pack.id}>
            <rect x={x} y="130" width="215" height="70" rx="10" fill="none" stroke={COLORS[pack.color]} strokeWidth="3.4" />
            <text x={x + 107} y="176" fontSize="34" textAnchor="middle" fill={COLORS[pack.color]} className="bw-text">
              {pack.label}
            </text>
          </g>
        );
      })}
      {placed.map((p) => {
        const i = PACKS.findIndex((pack) => pack.id === p.to);
        return (
          <g key={p.s} className="bw-pop">
            <text x={40 + i * 235 + 107} y="250" fontSize="26" textAnchor="middle" fill={COLORS.ink} className="bw-text">
              {p.s.split(" ").slice(0, 3).join(" ")}
            </text>
            <text x={40 + i * 235 + 107} y="282" fontSize="26" textAnchor="middle" fill={COLORS.ink} className="bw-text">
              {p.s.split(" ").slice(3).join(" ")}
            </text>
          </g>
        );
      })}
      {placed.length >= PACK_ITEMS.length && (
        <g className="bw-pop">
          <text x="500" y="420" fontSize="40" textAnchor="middle" fill={COLORS.blue} className="bw-text">
            when unsure, Nixpacks usually guesses right
          </text>
        </g>
      )}
    </g>
  );
}

function PackControls({ s, set, award, done, finish }) {
  const placed = s.placed || [];
  const index = placed.length;
  const item = PACK_ITEMS[index];
  const wrong = s.wrong || "";
  const answer = (id) => {
    if (!item) return;
    if (id !== item.to) {
      set({ ...s, wrong: id, miss: true });
      return;
    }
    const first = s.miss ? s.first || 0 : (s.first || 0) + 1;
    const next = { ...s, placed: [...placed, { s: item.s, to: item.to }], wrong: "", miss: false, first, why: item.why };
    set(next);
    if (next.placed.length === PACK_ITEMS.length && first >= 3) award("packs");
  };
  const finished = index >= PACK_ITEMS.length;
  return (
    <div>
      {!finished && (
        <>
          <div className="mb-2 text-[13px]">
            Which pack builds <span className="cr-hand text-[19px]">{item.s}</span>?
          </div>
          <div className="flex flex-wrap gap-2">
            {PACKS.map((pack) => (
              <button key={pack.id} type="button" onClick={() => answer(pack.id)} className={`${chip} ${wrong === pack.id ? "cr-shake cr-btn--bad" : ""}`}>
                {pack.label}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="mt-2 flex items-center gap-3">
        <p className="text-[12.5px] text-[var(--cr-muted)]">
          {wrong && item
            ? "Not that one. What does the project already contain?"
            : finished
              ? `${s.first || 0} of ${PACK_ITEMS.length} on the first try. ${done ? "Nicely matched." : "Worth a second look."}`
              : s.why || "Match all four."}
        </p>
        <Continue onClick={finish} label={finished ? "Continue" : "Skip"} />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- plans */

export const PLAN_CARDS = [
  { id: "plot", label: "Plot", price: 8, cap: 2, color: "green" },
  { id: "grove", label: "Grove", price: 24, cap: 8, color: "blue" },
  { id: "canopy", label: "Canopy", price: 60, cap: 20, color: "purple" },
];
const PLAN_ROUNDS = [2, 6, 14];
const planFor = (sites) => PLAN_CARDS.find((plan) => sites <= plan.cap);

function PlanBoard({ s }) {
  const round = Math.min(s.round || 0, PLAN_ROUNDS.length - 1);
  const sites = PLAN_ROUNDS[round];
  const right = planFor(sites);
  const finished = (s.round || 0) >= PLAN_ROUNDS.length;
  return (
    <g className="bw-live">
      {PLAN_CARDS.map((plan, i) => {
        const x = 50 + i * 305;
        const wrong = s.wrong === plan.id;
        const good = s.picked === plan.id && !wrong;
        const stroke = wrong ? COLORS.red : good ? COLORS.green : COLORS[plan.color];
        return (
          <g key={plan.id}>
            <rect x={x} y="130" width="270" height="215" rx="12" fill="none" stroke={stroke} strokeWidth={wrong || good ? 5 : 3.4} />
            <text x={x + 135} y="188" fontSize="46" textAnchor="middle" fill={COLORS[plan.color]} className="bw-text">
              {plan.label}
            </text>
            <text x={x + 135} y="248" fontSize="40" textAnchor="middle" fill={COLORS.ink} className="bw-text">
              ${plan.price} a month
            </text>
            <text x={x + 135} y="300" fontSize="30" textAnchor="middle" fill={COLORS.ink} opacity="0.75" className="bw-text">
              up to {plan.cap} sites
            </text>
          </g>
        );
      })}
      <text x="500" y="430" fontSize="46" textAnchor="middle" fill={COLORS.orange} className="bw-text">
        {finished ? "flat price, no surprises" : `you run ${sites} sites`}
      </text>
      {!finished && s.picked && s.picked === right.id && (
        <text x="500" y="490" fontSize="34" textAnchor="middle" fill={COLORS.green} className="bw-text">
          that's the cheapest that fits
        </text>
      )}
    </g>
  );
}

function PlanControls({ s, set, award, done, finish }) {
  const round = s.round || 0;
  const finished = round >= PLAN_ROUNDS.length;
  const sites = PLAN_ROUNDS[Math.min(round, PLAN_ROUNDS.length - 1)];
  const right = planFor(sites);
  const answer = (plan) => {
    if (finished) return;
    if (plan.id !== right.id) {
      set({ ...s, wrong: plan.id, miss: true });
      return;
    }
    const first = s.miss ? s.first || 0 : (s.first || 0) + 1;
    const next = { ...s, round: round + 1, wrong: "", picked: "", miss: false, first };
    set(next);
    if (next.round >= PLAN_ROUNDS.length && first >= 2) award("plans");
  };
  return (
    <div>
      {!finished && (
        <>
          <div className="mb-2 text-[13px]">
            You run <span className="cr-hand text-[19px]">{sites} sites</span>. Which is the cheapest plan that fits?
          </div>
          <div className="flex flex-wrap gap-2">
            {PLAN_CARDS.map((plan) => (
              <button key={plan.id} type="button" onClick={() => answer(plan)} className={`${chip} ${s.wrong === plan.id ? "cr-shake cr-btn--bad" : ""}`}>
                {plan.label} (${plan.price})
              </button>
            ))}
          </div>
        </>
      )}
      <div className="mt-2 flex items-center gap-3">
        <p className="text-[12.5px] text-[var(--cr-muted)]">
          {s.wrong && !finished
            ? "That one is either too small or too big. Count the sites."
            : finished
              ? `${s.first || 0} of ${PLAN_ROUNDS.length} on the first try. ${done ? "You can size a plan now." : "Plans only change when you outgrow them."}`
              : `Round ${round + 1} of ${PLAN_ROUNDS.length}.`}
        </p>
        <Continue onClick={finish} label={finished ? "Continue" : "Skip"} />
      </div>
    </div>
  );
}
export const WIDGETS = {
  packs: { label: "Matched the build packs", initial: { placed: [], first: 0 }, Board: PackBoard, Controls: PackControls },
  plans: { label: "Sized a plan", initial: { round: 0, first: 0 }, Board: PlanBoard, Controls: PlanControls },
  swap: { label: "Moved the price", initial: { paid: 0 }, Board: SwapBoard, Controls: SwapControls },
  cadence: { label: "Chose a cadence", initial: { mode: "Manual" }, Board: CadenceBoard, Controls: CadenceControls },
  leak: { label: "Sorted the leaks", initial: { placed: [], first: 0 }, Board: LeakBoard, Controls: LeakControls },
  revenue: { label: "Cleared $200 a month", initial: { subs: 20, price: 15, sales: 10, sites: 3 }, Board: RevenueBoard, Controls: RevenueControls },
};

/**
 * Scripted play-throughs used by the TV channel, where nobody is clicking.
 * Each list is a series of widget states with the pause (ms) before each one.
 */
export const WIDGET_DEMOS = {
  swap: () => [0.4, 1.0, 1.8, 2.6, 3.4].map((paid, i) => ({ s: { paid }, ms: i ? 1200 : 900 })),
  cadence: () => [
    { s: { mode: "Hourly" }, ms: 1800 },
    { s: { mode: "Weekly" }, ms: 2200 },
    { s: { mode: "Daily" }, ms: 2200 },
  ],
  leak: () =>
    LEAK_ITEMS.map((item, i) => ({
      s: { placed: LEAK_ITEMS.slice(0, i + 1).map((it) => ({ s: it.s, to: it.to })), first: i + 1, why: item.why },
      ms: i ? 1300 : 900,
    })),
  revenue: () => [
    { s: { subs: 20, price: 15, sales: 10, sites: 3 }, ms: 900 },
    { s: { subs: 40, price: 15, sales: 10, sites: 3 }, ms: 1600 },
    { s: { subs: 40, price: 20, sales: 20, sites: 3 }, ms: 1600 },
    { s: { subs: 40, price: 20, sales: 20, sites: 9 }, ms: 1800 },
    { s: { subs: 60, price: 20, sales: 30, sites: 9 }, ms: 1800 },
  ],
  packs: () =>
    PACK_ITEMS.map((item, i) => ({
      s: { placed: PACK_ITEMS.slice(0, i + 1).map((it) => ({ s: it.s, to: it.to })), first: i + 1, why: item.why },
      ms: i ? 1500 : 900,
    })),
  plans: () => [1, 2, 3].map((round, i) => ({ s: { round, first: round }, ms: i ? 1900 : 1200 })),
};