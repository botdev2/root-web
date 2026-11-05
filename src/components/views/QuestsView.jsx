import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useAppState } from "../../AppState.jsx";
import { claimQuest, formatCredits, readQuests } from "../../glmChat.js";
import { Page, Skeleton } from "../ui.jsx";

const LEVELS = [
  { name: "Seed", at: 0 },
  { name: "Sprout", at: 150 },
  { name: "Sapling", at: 400 },
  { name: "Palm", at: 900 },
  { name: "Grove", at: 1800 },
  { name: "Canopy", at: 3200 },
];

const TIER = { easy: "Easy", medium: "Medium", hard: "Hard", epic: "Epic" };

// Each constellation is a skill tree: where its stars sit and which star leads to which.
const SKY_W = 900;
const SKY_H = 470;
const CONSTELLATIONS = [
  {
    id: "speaker",
    name: "The Speaker",
    blurb: "Talk to Hamrin.",
    groups: ["Chat"],
    nodes: {
      "first-words": [90, 310],
      chatterbox: [250, 230],
      centurion: [430, 110],
      legend: [620, 70],
      versatile: [830, 300],
      "ask-away": [370, 340],
      planner: [540, 250],
      "agent-smith": [720, 180],
      collector: [680, 370],
    },
    edges: [
      ["first-words", "chatterbox"],
      ["chatterbox", "centurion"],
      ["centurion", "legend"],
      ["agent-smith", "versatile"],
      ["chatterbox", "ask-away"],
      ["ask-away", "planner"],
      ["planner", "agent-smith"],
      ["planner", "collector"],
    ],
  },
  {
    id: "artisan",
    name: "The Artisan",
    blurb: "Tools and tabs.",
    groups: ["Tools", "Explore"],
    nodes: {
      "prompt-smith": [190, 300],
      scout: [430, 170],
      "prompt-master": [110, 150],
      cartographer: [600, 90],
      explorer: [680, 290],
    },
    edges: [
      ["prompt-smith", "scout"],
      ["prompt-smith", "prompt-master"],
      ["scout", "cartographer"],
      ["scout", "explorer"],
    ],
  },
  {
    id: "scholar",
    name: "The Scholar",
    blurb: "Class is in session.",
    groups: ["Learn"],
    nodes: {
      "class-ops-1": [90, 300],
      "class-defi-2": [250, 215],
      "class-workflows-3": [420, 300],
      "class-privacy-4": [590, 215],
      "class-revenue-5": [760, 300],
      graduate: [425, 95],
    },
    edges: [
      ["class-ops-1", "class-defi-2"],
      ["class-defi-2", "class-workflows-3"],
      ["class-workflows-3", "class-privacy-4"],
      ["class-privacy-4", "class-revenue-5"],
      ["class-workflows-3", "graduate"],
    ],
  },
  {
    id: "flame",
    name: "The Flame",
    blurb: "Come back every day.",
    groups: ["Streaks"],
    nodes: {
      "streak-3": [110, 340],
      "streak-7": [270, 250],
      "streak-14": [450, 170],
      "streak-30": [680, 100],
      "streak-60": [830, 170],
      "daily-30": [810, 380],
      "daily-1": [380, 370],
      "daily-7": [610, 300],
    },
    edges: [
      ["streak-3", "streak-7"],
      ["streak-7", "streak-14"],
      ["streak-14", "streak-30"],
      ["streak-30", "streak-60"],
      ["daily-7", "daily-30"],
      ["streak-7", "daily-1"],
      ["daily-1", "daily-7"],
    ],
  },
];

function levelOf(points) {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i += 1) if (points >= LEVELS[i].at) index = i;
  const current = LEVELS[index];
  const next = LEVELS[index + 1] || null;
  const share = next ? (points - current.at) / (next.at - current.at) : 1;
  return { index, current, next, share: Math.max(0, Math.min(1, share)) };
}

function clock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

function stateOf(item) {
  if (item.claimed) return "claimed";
  if (item.done) return "ready";
  if (item.progress > 0) return "progress";
  return "locked";
}

// A few hundred tiny stars, the same every time.
function scatter(seed, count) {
  let value = seed;
  const next = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
  return Array.from({ length: count }, () => ({ x: next() * SKY_W, y: next() * SKY_H, r: 0.5 + next() * 1.3, d: next() * 6 }));
}

const STARDUST = scatter(7, 70);
const STAR_PATH = "M0,-15 L3.6,-3.6 L15,0 L3.6,3.6 L0,15 L-3.6,3.6 L-15,0 L-3.6,-3.6 Z";

/** A ring that fills as you get closer. Skill level or challenge, same idea. */
function Ring({ size, stroke, value, total, children, tone = "gold" }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const share = total > 0 ? Math.min(1, value / total) : 0;
  return (
    <div className="qv-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={`qv-ring-arc qv-ring-arc--${tone}`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - share)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="qv-ring-body">{children}</div>
    </div>
  );
}

function Reward({ points, perCredit }) {
  return (
    <span className="qv-reward">
      +{points} pts <i>·</i> +{formatCredits(points / perCredit)} cr
    </span>
  );
}

function Trial({ item, perCredit, busy, onClaim, wide = false }) {
  const state = stateOf(item);
  return (
    <div className={`qv-trial is-${state} ${wide ? "qv-trial--wide" : ""} ${item.tier === "epic" ? "qv-trial--epic" : ""}`}>
      <div className="qv-trial-head">
        <Ring size={58} stroke={4} value={item.progress} total={item.target} tone={state === "claimed" ? "bright" : "gold"}>
          <svg width="24" height="24" viewBox="-18 -18 36 36" aria-hidden="true">
            <path d={STAR_PATH} className="qv-trial-star" />
          </svg>
        </Ring>
        <div className="qv-trial-top">
          <div className={`qv-tier qv-tier--${item.tier || "bonus"}`}>{TIER[item.tier] || "Bonus"}</div>
          <div className="qv-trial-title">{item.title}</div>
        </div>
      </div>
      <div className="qv-trial-desc">{item.desc}</div>
      <div className="qv-trial-foot">
        <span className="qv-count">
          {item.progress} / {item.target}
        </span>
        <Reward points={item.points} perCredit={perCredit} />
      </div>
      <div className="qv-trial-act">
        {state === "claimed" ? (
          <span className="qv-done">Unlocked</span>
        ) : state === "ready" ? (
          <button type="button" className="qv-unlock" disabled={busy} onClick={onClaim}>
            {busy ? "…" : "Unlock"}
          </button>
        ) : (
          <span className="qv-wait">In progress</span>
        )}
      </div>
    </div>
  );
}

function Constellation({ sky, byId, selectedId, onSelect }) {
  const placed = Object.entries(sky.nodes).filter(([id]) => byId[id]);
  const dust = useMemo(() => scatter(hashOf(sky.id), 26), [sky.id]);
  return (
    <svg className="qv-svg" viewBox={`0 0 ${SKY_W} ${SKY_H}`} role="group" aria-label={sky.name}>
      <defs>
        <filter id="qv-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {STARDUST.map((dot, index) => (
        <circle key={"d" + index} cx={dot.x} cy={dot.y} r={dot.r} className="qv-dust" style={{ animationDelay: `${dot.d}s` }} />
      ))}
      {dust.map((dot, index) => (
        <circle key={"e" + index} cx={dot.x} cy={dot.y} r={dot.r + 0.6} className="qv-dust qv-dust--bright" style={{ animationDelay: `${dot.d}s` }} />
      ))}

      {sky.edges.map(([from, to]) => {
        const a = sky.nodes[from];
        const b = sky.nodes[to];
        if (!a || !b || !byId[from] || !byId[to]) return null;
        const lit = byId[from].claimed && byId[to].claimed;
        const open = byId[from].claimed && !byId[to].claimed;
        return (
          <line
            key={from + to}
            x1={a[0]}
            y1={a[1]}
            x2={b[0]}
            y2={b[1]}
            className={`qv-line ${lit ? "is-lit" : open ? "is-open" : ""}`}
          />
        );
      })}

      {placed.map(([id, [x, y]]) => {
        const item = byId[id];
        const state = stateOf(item);
        const radius = 24;
        const circumference = 2 * Math.PI * radius;
        const share = item.target > 0 ? Math.min(1, item.progress / item.target) : 0;
        const selected = selectedId === id;
        return (
          <g
            key={id}
            transform={`translate(${x} ${y})`}
            className={`qv-node is-${state} ${selected ? "is-selected" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={`${item.title}, ${state}`}
            onClick={() => onSelect(id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(id);
              }
            }}
          >
            <circle r="38" fill="transparent" />
            {selected && <circle r="34" className="qv-select" />}
            <circle r={radius} fill="rgba(8,10,28,0.7)" className="qv-node-disc" />
            <circle r={radius} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
            <circle
              r={radius}
              fill="none"
              className="qv-node-arc"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - (state === "claimed" || state === "ready" ? 1 : share))}
              transform="rotate(-90)"
            />
            <path d={STAR_PATH} className="qv-star" filter={state === "claimed" || state === "ready" ? "url(#qv-glow)" : undefined} />
            <text y="50" textAnchor="middle" className="qv-node-label">
              {item.title}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function hashOf(text) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619) >>> 0;
  }
  return value >>> 0;
}

export default function QuestsView({ token = "", onRefresh }) {
  const { address, isConnected } = useAccount();
  const { notice } = useAppState();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [skyId, setSkyId] = useState(CONSTELLATIONS[0].id);
  const [picked, setPicked] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const load = async () => {
    if (!address || !token) return;
    try {
      const result = await readQuests(address);
      setData(result.quests || null);
      setError("");
    } catch (failure) {
      setError(failure.message || "Quests did not load.");
    }
  };

  useEffect(() => {
    setData(null);
    load();
  }, [address, token]);

  const resetsAt = data ? Date.parse(data.resetsAt) : NaN;
  const left = Number.isFinite(resetsAt) ? resetsAt - now : NaN;
  useEffect(() => {
    if (Number.isFinite(left) && left <= 0) load();
  }, [Number.isFinite(left) && left <= 0]);

  const claim = async (kind, id) => {
    setBusy(kind + ":" + id);
    try {
      const result = await claimQuest(address, kind, id);
      setData(result.quests || data);
      const won = result.awarded;
      if (won) notice?.(`${won.title}: +${won.points} points, +${formatCredits(won.credits)} credits for Hamrin.`);
      onRefresh?.();
    } catch (failure) {
      notice?.(failure.message || "That could not be claimed.");
      load();
    } finally {
      setBusy("");
    }
  };

  const level = useMemo(() => levelOf(data?.points || 0), [data?.points]);
  const perCredit = data?.pointsPerCredit || 2000;
  const byId = useMemo(() => Object.fromEntries((data?.achievements || []).map((item) => [item.id, item])), [data]);

  // Achievements the server knows about but no constellation places yet still get a home.
  const skies = useMemo(() => {
    const placedIds = new Set(CONSTELLATIONS.flatMap((sky) => Object.keys(sky.nodes)));
    const stray = (data?.achievements || []).filter((item) => !placedIds.has(item.id));
    if (!stray.length) return CONSTELLATIONS;
    const nodes = {};
    stray.forEach((item, index) => {
      nodes[item.id] = [110 + (index % 5) * 160, 150 + Math.floor(index / 5) * 140];
    });
    return [...CONSTELLATIONS, { id: "wild", name: "The Wild Stars", blurb: "New skills.", groups: [], nodes, edges: [] }];
  }, [data]);

  const sky = skies.find((item) => item.id === skyId) || skies[0];
  const skyItems = Object.keys(sky.nodes).map((id) => byId[id]).filter(Boolean);
  const selected = byId[picked] && sky.nodes[picked] ? byId[picked] : skyItems.find((item) => item.done && !item.claimed) || skyItems.find((item) => !item.claimed) || skyItems[0];
  const ready = (data ? [...data.daily, data.bonus, ...data.achievements] : []).filter((item) => item.done && !item.claimed).length;
  const unlockedTotal = (data?.achievements || []).filter((item) => item.claimed).length;

  if (!isConnected || !address) {
    return (
      <Page wide>
        <div className="qv-scene qv-note">Connect your wallet to play. Points and credits belong to the address you sign in with.</div>
      </Page>
    );
  }

  if (!token) {
    return (
      <Page wide>
        <div className="qv-scene qv-note">
          Sign in on the Ops tab first. Quests count what you do with your signed-in wallet, so there is nothing to track until you are in.
        </div>
      </Page>
    );
  }

  return (
    <Page wide>
      <div className="qv-scene">
        <div className="qv-starfield" aria-hidden="true" />

        {/* Skill level, like the level ring in a skill menu. */}
        <header className="qv-hero">
          {data ? (
            <>
              <Ring size={132} stroke={6} value={level.share} total={1} tone="bright">
                <div className="qv-level-num">{level.index + 1}</div>
                <div className="qv-level-cap">level</div>
              </Ring>
              <div className="qv-hero-main">
                <div className="qv-title">{level.current.name}</div>
                <div className="qv-sub">
                  {data.points.toLocaleString()} perk points
                  {level.next ? ` · ${(level.next.at - data.points).toLocaleString()} to ${level.next.name}` : " · top of the sky"}
                </div>
                <div className="qv-xp">
                  <div style={{ width: `${level.share * 100}%` }} />
                </div>
              </div>
              <div className="qv-stats">
                <div>
                  <b>{data.streak}</b>
                  <span>day streak</span>
                </div>
                <div>
                  <b>{formatCredits(data.creditsEarned)}</b>
                  <span>credits earned</span>
                </div>
                <div>
                  <b>
                    {unlockedTotal}/{data.achievements.length}
                  </b>
                  <span>stars lit</span>
                </div>
              </div>
            </>
          ) : error ? (
            <div className="qv-sub">{error}</div>
          ) : (
            <Skeleton className="h-[132px] w-full rounded-2xl" />
          )}
        </header>

        <p className="qv-lead">
          Light stars and finish trials to earn perk points. Unlock them and they become Hamrin 1.0 credits ({perCredit.toLocaleString()} points = 1 credit, they never reset).
          {ready > 0 && <em> {ready} ready to unlock.</em>}
        </p>

        <section className="qv-section">
          <div className="qv-section-head">
            <h3>Today's trials</h3>
            <span>{Number.isFinite(left) ? `new trials in ${clock(left)}` : ""}</span>
          </div>
          {data?.trials && (
            <p className="qv-rank">
              <b>{data.trials.name} trials</b> · goals ×{data.trials.goalMult} · rewards ×{data.trials.rewardMult}
              {data.trials.epic ? " · an Epic trial is added every day" : ` · Epic trials unlock at ${LEVELS[3].name} (${data.trials.nextEpicAt} points)`}
            </p>
          )}
          <div className="qv-trials">
            {data
              ? data.daily.map((item) => (
                  <Trial key={item.id} item={item} perCredit={perCredit} busy={busy === "daily:" + item.id} onClaim={() => claim("daily", item.id)} />
                ))
              : [0, 1, 2].map((key) => <Skeleton key={key} className="h-[120px] w-full rounded-2xl" />)}
          </div>
          {data && (
            <div className="mt-3">
              <Trial wide item={data.bonus} perCredit={perCredit} busy={busy === "daily:daily-all"} onClaim={() => claim("daily", "daily-all")} />
            </div>
          )}
        </section>

        <section className="qv-section">
          <div className="qv-section-head">
            <h3>Constellations</h3>
            <span>pick a star to read it</span>
          </div>
          <div className="qv-tabs" role="tablist">
            {skies.map((item) => {
              const own = Object.keys(item.nodes).map((id) => byId[id]).filter(Boolean);
              const lit = own.filter((entry) => entry.claimed).length;
              const waiting = own.some((entry) => entry.done && !entry.claimed);
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={item.id === sky.id}
                  className={`qv-tab ${item.id === sky.id ? "is-on" : ""}`}
                  onClick={() => {
                    setSkyId(item.id);
                    setPicked("");
                  }}
                >
                  <span>{item.name}</span>
                  <small>
                    {lit}/{own.length}
                    {waiting && <i className="qv-dot" />}
                  </small>
                </button>
              );
            })}
          </div>

          <div className="qv-sky">
            {data ? (
              <Constellation sky={sky} byId={byId} selectedId={selected?.id} onSelect={setPicked} />
            ) : (
              <Skeleton className="h-[420px] w-full rounded-2xl" />
            )}
          </div>

          {selected && (
            <div className={`qv-info is-${stateOf(selected)}`}>
              <div className="qv-info-main">
                <div className="qv-info-name">{selected.title}</div>
                <div className="qv-info-desc">{selected.desc}</div>
                <div className="qv-info-bar">
                  <div style={{ width: `${selected.target ? Math.min(100, (selected.progress / selected.target) * 100) : 0}%` }} />
                </div>
                <div className="qv-info-meta">
                  <span className="qv-count">
                    {selected.progress} / {selected.target}
                  </span>
                  <Reward points={selected.points} perCredit={perCredit} />
                </div>
              </div>
              <div className="qv-info-act">
                {selected.claimed ? (
                  <span className="qv-done">Star lit</span>
                ) : selected.done ? (
                  <button type="button" className="qv-unlock qv-unlock--big" disabled={busy === "achievement:" + selected.id} onClick={() => claim("achievement", selected.id)}>
                    {busy === "achievement:" + selected.id ? "…" : "Unlock"}
                  </button>
                ) : (
                  <span className="qv-wait">In progress</span>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </Page>
  );
}
