import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Classroom from "../components/Classroom.jsx";
import { CLASS_ORDER, findClassroom } from "../classroom/episodes.js";

/**
 * PaLM TV: a 24/7 channel that plays Episodes 1-5 back to back with a
 * 30 second break between them. Meant to be a browser source in OBS:
 *   https://chat.useroot.sh/tv
 * Options (query string):
 *   ?start=3     first episode to play (1-5)
 *   ?break=300   seconds between episodes
 *   ?first=20    seconds of break shown before the very first episode
 *   ?reload=6    hours of uptime after which the page refreshes itself (at a break)
 *   ?speed=8     play faster, for testing
 */

const STAGE_W = 1920;
const STAGE_H = 1080;
const MAX_EPISODE_MS = 14 * 60 * 1000;
const BOOT = Date.now();
// Intro board, report card and the gap between them add this much to an episode.
const FRAME_SECONDS = 28;
// The guide shows this many minutes, in five minute columns.
const GUIDE_MINUTES = 60;
const MIN = 60 * 1000;

const LOGO = "/brand/palmlogo_local.png";
const PARTNERS = [
  { name: "0x Protocol", src: "/brand/0x-protocol.png" },
  { name: "SKALE", src: "/brand/skale.png" },
  { name: "Codex", src: "/brand/codex.png" },
  { name: "Google AI", src: "/brand/google-ai.png" },
  { name: "Relay", src: "/brand/relay.svg" },
  { name: "Spectre AI", src: "/brand/spectre-ai.png" },
];

const FACTS = [
  "One wallet signature plus an authenticator code is the whole Ops account. No email, no password.",
  "Ops hosting is flat priced: Plot is $8, Grove is $24 and Canopy is $60 a month.",
  "A read-only deploy key can fetch your code but never change it.",
  "Every commit is an undo button that never runs out.",
  "Deep pools barely flinch. Thin pools lurch, and bots love a lurch.",
  "Private is not invisible. Run the Telemetry check before and after you change your setup.",
  "Holding or staking 1,000 $PALM gives you 1 credit in /root.",
  "Name every revenue stream. Naming it is the first step to growing it.",
  "Blank page after a deploy? Read the logs first.",
  "Start with dust: test with tiny amounts before real value moves through your product.",
];

function param(name, fallback) {
  try {
    const value = new URLSearchParams(window.location.search).get(name);
    if (value === null || value === "") return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  } catch {
    return fallback;
  }
}

/** Every page load starts at Episode 1, unless ?start=N says otherwise. */
function startIndex() {
  const asked = param("start", 1);
  return asked >= 1 && asked <= CLASS_ORDER.length ? Math.floor(asked) - 1 : 0;
}
const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.max(0, Math.floor(seconds % 60))).padStart(2, "0")}`;
const hhmm = (ms) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
const dayLabel = (ms) => new Date(ms).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });

/** How long one airing lasts: the lesson plus its intro and report card. */
function airingMs(ep, speed) {
  return ((ep.minutes * 60 + FRAME_SECONDS) * 1000) / speed;
}

function Logo({ className = "" }) {
  return <span className={`tv-logo ${className}`} style={{ backgroundImage: `url(${LOGO})` }} role="img" aria-label="PaLM AI" />;
}

/** Channel bug: the logo on the left, local time and date on the right. Always on screen. */
function Bug({ now }) {
  return (
    <>
      <div className="tv-bug">
        <Logo />
      </div>
      <div className="tv-clock">
        <b>{hhmm(now)}</b>
        <span>{dayLabel(now)}</span>
      </div>
    </>
  );
}

function Stinger({ kicker, title }) {
  return (
    <div className="tv-stinger">
      <div className="tv-stinger-sweep" />
      <Logo className="tv-logo--xl" />
      <div className="tv-stinger-kicker">{kicker}</div>
      <div className="tv-stinger-title">{title}</div>
    </div>
  );
}

/** A proper programme guide: one row per episode, five minute columns, a NOW line. */
function Guide({ airings, now }) {
  const windowStart = Math.floor(now / (5 * MIN)) * 5 * MIN;
  const windowEnd = windowStart + GUIDE_MINUTES * MIN;
  const pct = (ms) => ((ms - windowStart) / (GUIDE_MINUTES * MIN)) * 100;
  const ticks = Array.from({ length: GUIDE_MINUTES / 5 }, (_, i) => windowStart + i * 5 * MIN);
  const nowPct = Math.max(0, Math.min(100, pct(now)));

  return (
    <div className="tv-guide">
      <div className="tv-guide-head">
        <span>PaLM TV guide</span>
        <span>{dayLabel(now)}</span>
      </div>
      <div className="tv-guide-grid">
        <div className="tv-guide-line tv-guide-line--ruler">
          <div className="tv-guide-chan tv-guide-chan--ruler">Episodes</div>
          <div className="tv-guide-cells tv-guide-cells--ruler">
            {ticks.map((t) => (
              <span key={t} style={{ left: `${pct(t)}%` }}>
                {hhmm(t)}
              </span>
            ))}
          </div>
        </div>
        {CLASS_ORDER.map((id) => {
          const ep = findClassroom(id);
          return (
            <div className="tv-guide-line" key={id}>
              <div className="tv-guide-chan">
                <b>{ep.number}</b>
                <span>{ep.title}</span>
              </div>
              <div className="tv-guide-cells">
                {airings
                  .filter((slot) => slot.ep.id === id && slot.end > windowStart && slot.start < windowEnd)
                  .map((slot) => {
                    const left = Math.max(0, pct(slot.start));
                    const right = Math.min(100, pct(slot.end));
                    return (
                      <div
                        key={slot.key}
                        className={`tv-prog ${slot.state === "next" ? "is-next" : ""} ${slot.state === "past" ? "is-past" : ""}`}
                        style={{ left: `${left}%`, width: `${right - left}%` }}
                      >
                        {hhmm(slot.start)}
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
        <div className="tv-guide-now" style={{ left: `calc(440px + (100% - 440px) * ${nowPct / 100})` }}>
          <span>NOW</span>
        </div>
      </div>
    </div>
  );
}

/** The set itself: bezel, speaker grilles, knobs, badge and a power light. The screen sits on top. */
function TvSet() {
  const slots = Array.from({ length: 14 });
  return (
    <div className="tv-set" aria-hidden="true">
      <div className="tv-grille tv-grille--left">
        {slots.map((_, i) => (
          <i key={i} />
        ))}
      </div>
      <div className="tv-grille tv-grille--right">
        {slots.map((_, i) => (
          <i key={i} />
        ))}
      </div>
      <div className="tv-knob tv-knob--a" />
      <div className="tv-knob tv-knob--b" />
      <div className="tv-power" />
    </div>
  );
}
function BreakScreen({ episode, left, total, airings, now }) {
  const radius = 118;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.max(0, Math.min(1, left / total));

  return (
    <div className="tv-break">
      <div className="tv-break-kicker">be right back</div>

      <div className="tv-break-top">
        <div className="tv-break-clock">
          <svg width="290" height="290" viewBox="0 0 290 290" aria-hidden="true">
            <circle cx="145" cy="145" r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="12" />
            <circle
              cx="145"
              cy="145"
              r={radius}
              fill="none"
              stroke="#ffd166"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - fraction)}
              transform="rotate(-90 145 145)"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="tv-break-digits">{clock(left)}</div>
          <div className="tv-break-sub">until class</div>
        </div>

        <div className="tv-break-next">
          <div className="tv-break-label">up next</div>
          <div className="tv-break-title">
            Episode {episode.number}: {episode.title}
          </div>
          <p className="tv-break-blurb">{episode.blurb}</p>
          <ol className="tv-break-scenes">
            {episode.scenes.map((scene, index) => (
              <li key={scene.title} style={{ animationDelay: `${0.25 + index * 0.18}s` }}>
                <span>{index + 1}</span>
                {scene.title}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <Guide airings={airings} now={now} />

      <div className="tv-partners">
        <span>with</span>
        {PARTNERS.map((partner) => (
          <img key={partner.name} src={partner.src} alt={partner.name} />
        ))}
      </div>
    </div>
  );
}

export default function TV() {
  const [index, setIndex] = useState(startIndex);
  const [mode, setMode] = useState("break");
  const [play, setPlay] = useState(0);
  const breakSeconds = Math.max(5, param("break", 300));
  const firstBreak = Math.max(3, param("first", 20));
  const [left, setLeft] = useState(firstBreak);
  const [total, setTotal] = useState(firstBreak);
  const [scale, setScale] = useState(1);
  const [stageEl, setStageEl] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [stinger, setStinger] = useState({ key: "boot", kicker: "welcome to", title: "PaLM TV" });
  const watchdog = useRef(0);

  const episodeId = CLASS_ORDER[index];
  const episode = findClassroom(episodeId);

  // Fit the 1920 x 1080 stage into whatever window OBS gives us.
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    document.title = "PaLM TV";
    document.documentElement.classList.add("tv-html");
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(timer);
      document.documentElement.classList.remove("tv-html");
    };
  }, []);

  // Station idents last a few seconds, then get out of the way.
  useEffect(() => {
    if (!stinger) return undefined;
    const timer = window.setTimeout(() => setStinger(null), 3000);
    return () => window.clearTimeout(timer);
  }, [stinger]);

  // Break countdown.
  useEffect(() => {
    if (mode !== "break") return undefined;
    const timer = window.setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [mode, index]);

  // Break over: refresh now and then to pick up new deploys, otherwise roll the class.
  useEffect(() => {
    if (mode !== "break" || left > 0) return undefined;
    const timer = window.setTimeout(() => {
      const reloadHours = param("reload", 6);
      if (reloadHours > 0 && Date.now() - BOOT > reloadHours * 3600 * 1000) {
        window.location.reload();
        return;
      }
      const ep = findClassroom(CLASS_ORDER[index]);
      setPlay((count) => count + 1);
      setStinger({ key: `ep-${index}-${Date.now()}`, kicker: `now playing  \u00b7  episode ${ep.number}`, title: ep.title });
      setMode("class");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [mode, left, index]);

  const finish = useCallback(() => {
    window.clearTimeout(watchdog.current);
    setIndex((current) => {
      const next = (current + 1) % CLASS_ORDER.length;
      return next;
    });
    setTotal(breakSeconds);
    setLeft(breakSeconds);
    setMode("break");
  }, [breakSeconds]);

  // If an episode ever stalls, move on rather than freeze the stream.
  useEffect(() => {
    if (mode !== "class") return undefined;
    window.clearTimeout(watchdog.current);
    watchdog.current = window.setTimeout(finish, MAX_EPISODE_MS);
    return () => window.clearTimeout(watchdog.current);
  }, [mode, play, finish]);

  // What airs when. The slot after the break is "next", the one before it already "past".
  const airings = useMemo(() => {
    const speed = Math.max(1, param("speed", 1));
    const gap = breakSeconds * 1000;
    const nextStart = now + left * 1000;
    const list = [];
    const prev = findClassroom(CLASS_ORDER[(index + CLASS_ORDER.length - 1) % CLASS_ORDER.length]);
    const prevEnd = nextStart - gap;
    list.push({ key: "prev", ep: prev, start: prevEnd - airingMs(prev, speed), end: prevEnd, state: "past" });
    let at = nextStart;
    for (let i = 0; i < 9; i += 1) {
      const ep = findClassroom(CLASS_ORDER[(index + i) % CLASS_ORDER.length]);
      const end = at + airingMs(ep, speed);
      list.push({ key: `${i}-${ep.id}`, ep, start: at, end, state: i === 0 ? "next" : "later" });
      at = end + gap;
    }
    return list;
  }, [index, now, left, breakSeconds]);

  return (
    <div className="tv-root">
      <div className="tv-stage" style={{ width: STAGE_W, height: STAGE_H, transform: `translate(-50%, -50%) scale(${scale})` }}>
        <TvSet />
        <div ref={setStageEl} className="tv-screen">
          {mode === "break" && <BreakScreen episode={episode} left={left} total={total} airings={airings} now={now} />}
          {mode === "class" && stageEl && (
            <Classroom key={`${episodeId}-${play}`} episodeId={episodeId} tv controls={{}} onEnd={finish} container={stageEl} />
          )}
          <Bug now={now} />
          {stinger && <Stinger key={stinger.key} kicker={stinger.kicker} title={stinger.title} />}
          <div className="tv-glass" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}