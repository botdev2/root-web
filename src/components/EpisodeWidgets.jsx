import { useEffect, useRef, useState } from "react";

/**
 * Small playable pieces used inside the guided episodes. Each one is optional:
 * finishing it earns a star, but the episode never waits on it.
 */

const btn =
  "rounded-lg border px-2.5 py-1.5 text-left text-[12.5px] transition-colors disabled:cursor-default";

function Star({ on }) {
  return (
    <span className={`ep-star ${on ? "is-on" : ""}`} title={on ? "Star earned" : "Complete this to earn a star"} aria-hidden="true">
      ★
    </span>
  );
}

function Frame({ title, done, children }) {
  return (
    <div className="ep-widget mt-3 rounded-xl border border-[var(--stroke)] bg-[color-mix(in_srgb,var(--bg)_55%,transparent)] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[10.5px] uppercase tracking-[0.16em] text-[var(--faint)]">{title}</span>
        <Star on={done} />
      </div>
      {children}
    </div>
  );
}

const STOPS = [
  {
    id: "wallet",
    name: "Wallet",
    mark: "◈",
    line: "Your address is the account. One free signature opens Ops and Hamrin. No email, no password, no name.",
  },
  {
    id: "harness",
    name: "Harness",
    mark: "✦",
    line: "This app. Hamrin plans, the agent writes files and runs git in your repository, and every change is a commit.",
  },
  {
    id: "hub",
    name: "Ops Hub",
    mark: "⑂",
    line: "Git owned by your address. Every project in the sidebar is a Hub repository. There is no username to make.",
  },
  {
    id: "hosting",
    name: "Hosting",
    mark: "▣",
    line: "Ops builds that repository (Nixpacks, Dockerfile, Static or Dist) and serves it on a public link.",
  },
  {
    id: "domains",
    name: "Domains",
    mark: "◍",
    line: "Ops is the registrant, so you stay off the public record. Pay in USDC, point the name at your site.",
  },
];

/** Tap every stop on the road from wallet to domain. */
export function PipelineMap({ award, done }) {
  const [seen, setSeen] = useState(() => new Set());
  const [pick, setPick] = useState("");
  const stop = STOPS.find((item) => item.id === pick);

  const choose = (id) => {
    setPick(id);
    const next = new Set(seen);
    next.add(id);
    setSeen(next);
    if (next.size === STOPS.length) award("pipeline");
  };

  return (
    <Frame title={`The road · ${seen.size}/${STOPS.length} visited`} done={done}>
      <div className="ep-track" aria-hidden="true">
        <i />
      </div>
      <div className="flex flex-wrap items-stretch gap-1.5">
        {STOPS.map((item, index) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => choose(item.id)}
              className={`${btn} flex min-w-[78px] flex-col items-center gap-0.5 text-center ${
                pick === item.id
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : seen.has(item.id)
                    ? "border-[var(--stroke)] text-[var(--ink)]"
                    : "border-[var(--stroke)] text-[var(--muted)] hover:bg-[var(--hover)]"
              }`}
            >
              <span className={`text-[16px] leading-none ${seen.has(item.id) ? "" : "ep-nudge"}`}>{item.mark}</span>
              <span>{item.name}</span>
            </button>
            {index < STOPS.length - 1 && <span className="text-[var(--faint)]">→</span>}
          </div>
        ))}
      </div>
      <p className="mt-2 min-h-[2.6em] text-[12.5px] leading-[1.55] text-[var(--muted)]" aria-live="polite">
        {stop ? stop.line : "Tap a stop to see what it does."}
      </p>
    </Frame>
  );
}

const ROUNDS = [
  { text: "A Next.js app with a package.json and no Dockerfile. Ops should work out the build.", answer: "nixpacks", hint: "Nixpacks detects the framework and builds it for you." },
  { text: "I already ran the build and committed dist/index.html.", answer: "dist", hint: "Dist folder serves what is already built. It runs no build." },
  { text: "The repository has its own Dockerfile.", answer: "dockerfile", hint: "A Dockerfile is the recipe, so use it." },
  { text: "Plain HTML, CSS and JavaScript. Nothing to build.", answer: "static", hint: "Static serves the files exactly as they are." },
];

const PACKS = [
  { id: "nixpacks", label: "Nixpacks" },
  { id: "dockerfile", label: "Dockerfile" },
  { id: "static", label: "Static" },
  { id: "dist", label: "Dist folder" },
];

/** Match the build pack to the repository. */
export function BuildPackMatch({ award, done }) {
  const [round, setRound] = useState(0);
  const [wrong, setWrong] = useState("");
  const [right, setRight] = useState("");
  const [firstTry, setFirstTry] = useState(0);
  const [missed, setMissed] = useState(false);
  const timer = useRef(0);
  const finished = round >= ROUNDS.length;
  const current = ROUNDS[Math.min(round, ROUNDS.length - 1)];

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const answer = (id) => {
    if (right || finished) return;
    if (id !== current.answer) {
      setWrong(id);
      setMissed(true);
      return;
    }
    setWrong("");
    setRight(id);
    if (!missed) setFirstTry((value) => value + 1);
    timer.current = window.setTimeout(() => {
      setRight("");
      setMissed(false);
      if (round + 1 >= ROUNDS.length) award("buildpack");
      setRound(round + 1);
    }, 850);
  };

  return (
    <Frame title={finished ? "Build packs · done" : `Build packs · ${round + 1}/${ROUNDS.length}`} done={done}>
      {finished ? (
        <p className="text-[13px] text-[var(--ink)]">
          {firstTry === ROUNDS.length ? "Perfect round. " : `${firstTry} of ${ROUNDS.length} on the first try. `}
          <span className="text-[var(--muted)]">If you are unsure, Nixpacks is the usual first choice.</span>
        </p>
      ) : (
        <>
          <p key={round} className="ep-fade text-[13px] leading-[1.5] text-[var(--ink)]">
            {current.text}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {PACKS.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => answer(pack.id)}
                className={`${btn} text-center ${
                  right === pack.id
                    ? "border-[var(--green)] text-[var(--green)]"
                    : wrong === pack.id
                      ? "ep-shake border-[var(--rose)] text-[var(--rose)]"
                      : "border-[var(--stroke)] hover:bg-[var(--hover)]"
                }`}
              >
                {pack.label}
              </button>
            ))}
          </div>
          <p className="mt-2 min-h-[1.4em] text-[12px] text-[var(--muted)]" aria-live="polite">
            {right ? current.hint : wrong ? "Not that one. Try again." : "Which pack fits?"}
          </p>
        </>
      )}
    </Frame>
  );
}

const PLANS = [
  { id: "plot", name: "Plot", price: 8, sites: 2 },
  { id: "grove", name: "Grove", price: 24, sites: 8 },
  { id: "canopy", name: "Canopy", price: 60, sites: 20 },
];

/** Slide to five sites to find the plan that fits. */
export function PlanPicker({ award, done }) {
  const [count, setCount] = useState(1);
  const plan = PLANS.find((item) => count <= item.sites) || PLANS[2];

  const slide = (value) => {
    setCount(value);
    if (value === 5) award("plans");
  };

  return (
    <Frame title="Plans" done={done}>
      <p className="text-[12.5px] text-[var(--muted)]">
        You are launching <span className="text-[var(--ink)]">5 sites</span>. Slide to 5 and see which plan holds them.
      </p>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="range"
          min="1"
          max="20"
          value={count}
          onChange={(event) => slide(Number(event.target.value))}
          className="ep-range min-w-0 flex-1"
          aria-label="Number of sites"
        />
        <span className="w-16 shrink-0 text-right text-[13px] tabular-nums text-[var(--ink)]">{count} {count === 1 ? "site" : "sites"}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {PLANS.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg border px-2 py-1.5 text-center text-[12px] transition-colors ${
              item.id === plan.id ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--stroke)] text-[var(--faint)]"
            }`}
          >
            <div className="text-[13px]">{item.name}</div>
            <div className="tabular-nums">${item.price}/mo</div>
            <div>{item.sites} sites</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-[var(--muted)]">
        The first 48 hours are free. After that it is a flat price. Traffic, builds and storage are not metered.
      </p>
    </Frame>
  );
}

const SHIP_STEPS = [
  { who: "you", line: "Build a landing page for Ember and Oat and commit it.", ms: 650 },
  { who: "agent", line: "Writing index.html in my-first-repo", ms: 900 },
  { who: "hub", line: "Commit a1b2c3d signed by your wallet", ms: 800 },
  { who: "ops", line: "Build started (Static). Copying files to the host", ms: 1100 },
  { who: "ops", line: "Live at ember-and-oat.example", ms: 700 },
];

/** A pretend deploy, so the whole chain can be watched in ten seconds. */
export function ShipSim({ award, done }) {
  const [shown, setShown] = useState(0);
  const [running, setRunning] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setShown(0);
    for (let i = 0; i < SHIP_STEPS.length; i += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, SHIP_STEPS[i].ms));
      if (!alive.current) return;
      setShown(i + 1);
    }
    setRunning(false);
    award("ship");
  };

  const live = shown >= SHIP_STEPS.length;

  return (
    <Frame title="Ship it · simulation" done={done}>
      <div className="min-h-[7.6em] rounded-lg border border-[var(--stroke-soft)] bg-[var(--input)] px-3 py-2 font-mono text-[12px] leading-[1.7]">
        {shown === 0 && <span className="text-[var(--faint)]">{running ? "…" : "Press Ship it to watch one prompt travel the whole road."}</span>}
        {SHIP_STEPS.slice(0, shown).map((item, index) => (
          <div key={index} className="ep-fade flex gap-2">
            <span className="w-12 shrink-0 text-[var(--accent)]">{item.who}</span>
            <span className={index === SHIP_STEPS.length - 1 ? "text-[var(--green)]" : "text-[var(--muted)]"}>{item.line}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="h-9 rounded-lg bg-[var(--accent)] px-4 text-[13px] text-[var(--bg)] disabled:opacity-50"
        >
          {running ? "Shipping…" : live ? "Ship it again" : "Ship it"}
        </button>
        <span className="text-[11.5px] text-[var(--faint)]">Nothing is deployed. In the real thing, each line is an Ops API call.</span>
      </div>
    </Frame>
  );
}

export const WIDGETS = {
  pipeline: PipelineMap,
  buildpack: BuildPackMatch,
  plans: PlanPicker,
  ship: ShipSim,
};

export const WIDGET_STARS = [
  { id: "pipeline", label: "Walked the road" },
  { id: "buildpack", label: "Matched the build packs" },
  { id: "plans", label: "Picked a plan" },
  { id: "ship", label: "Shipped it" },
];
