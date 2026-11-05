import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Classroom from "../components/Classroom.jsx";
import { CLASS_ORDER, findClassroom } from "../classroom/episodes.js";

/**
 * PaLM TV: a 24/7 channel that plays Episodes 1-5 back to back with a
 * 30 second break between them. Meant to be a browser source in OBS:
 *   https://chat.useroot.sh/tv
 * Options (query string):
 *   ?start=3     first episode to play (1-5)
 *   ?break=30    seconds between episodes
 *   ?first=8     seconds of break shown before the very first episode
 *   ?reload=6    hours of uptime after which the page refreshes itself (at a break)
 *   ?speed=8     play faster, for testing
 */

const STAGE_W = 1920;
const STAGE_H = 1080;
const MAX_EPISODE_MS = 14 * 60 * 1000;
const STORE_KEY = "root-tv-next";
const BOOT = Date.now();
// Intro board, report card and the gap between them add this much to an episode.
const FRAME_SECONDS = 28;

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

function startIndex() {
  const asked = param("start", 0);
  if (asked >= 1 && asked <= CLASS_ORDER.length) return asked - 1;
  try {
    const stored = Number(window.localStorage.getItem(STORE_KEY));
    if (Number.isInteger(stored) && stored >= 0 && stored < CLASS_ORDER.length) return stored;
  } catch {
    /* storage unavailable */
  }
  return 0;
}

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.max(0, Math.floor(seconds % 60))).padStart(2, "0")}`;
const hhmm = (ms) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function Logo({ className = "" }) {
  return <span className={`tv-logo ${className}`} style={{ backgroundImage: `url(${LOGO})` }} role="img" aria-label="PaLM AI" />;
}

/** Channel bug: logo and LIVE tag on the left, local time on the right. Always on air. */
function Bug({ now }) {
  return (
    <>
      <div className="tv-bug">
        <Logo />
        <span className="tv-live">
          <i /> LIVE
        </span>
      </div>
      <div className="tv-clock">
        <b>{hhmm(now)}</b>
        <span>on air</span>
      </div>
    </>
  );
}

function Ticker({ items }) {
  const line = items.join("   \u2022   ");
  return (
    <div className="tv-ticker">
      <div className="tv-ticker-tag">PaLM TV</div>
      <div className="tv-ticker-view">
        <div className="tv-ticker-run">
          <span>{line}</span>
          <span aria-hidden="true">{line}</span>
        </div>
      </div>
    </div>
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

function BreakScreen({ episode, left, total, schedule }) {
  const [fact, setFact] = useState(() => Math.floor(Math.random() * FACTS.length));
  useEffect(() => {
    const timer = window.setInterval(() => setFact((value) => (value + 1) % FACTS.length), 7000);
    return () => window.clearInterval(timer);
  }, []);

  const radius = 150;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.max(0, Math.min(1, left / total));

  return (
    <div className="tv-break">
      <div className="tv-break-kicker">be right back</div>

      <div className="tv-break-main">
        <div className="tv-break-clock">
          <svg width="360" height="360" viewBox="0 0 360 360" aria-hidden="true">
            <circle cx="180" cy="180" r={radius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="14" />
            <circle
              cx="180"
              cy="180"
              r={radius}
              fill="none"
              stroke="#ffd166"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - fraction)}
              transform="rotate(-90 180 180)"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="tv-break-digits">{clock(left)}</div>
          <div className="tv-break-sub">until class</div>
        </div>

        <div className="tv-break-next">
          <div className="tv-break-label">up next</div>
          <div className="tv-break-epno">Episode {episode.number}</div>
          <div className="tv-break-title">{episode.title}</div>
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

      <div className="tv-break-fact" key={fact}>
        {FACTS[fact]}
      </div>

      <div className="tv-guide">
        <div className="tv-guide-tag">TV guide</div>
        {schedule.map((slot, index) => (
          <div key={slot.key} className={`tv-guide-slot ${index === 0 ? "is-next" : ""}`}>
            <b>{hhmm(slot.at)}</b>
            <span>
              Ep {slot.ep.number} Â· {slot.ep.title}
            </span>
          </div>
        ))}
      </div>

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
  const breakSeconds = Math.max(5, param("break", 30));
  const firstBreak = Math.max(3, param("first", 8));
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
    const timer = window.setInterval(() => setNow(Date.now()), 5000);
    return () => {
      window.clearInterval(timer);
      document.documentElement.classList.remove("tv-html");
    };
  }, []);

  // Station idents last a couple of seconds, then get out of the way.
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
      setPlay((count) => count + 1);
      setStinger({ key: `ep-${index}-${Date.now()}`, kicker: `now playing  \u00b7  episode ${findClassroom(CLASS_ORDER[index]).number}`, title: findClassroom(CLASS_ORDER[index]).title });
      setMode("class");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [mode, left, index]);

  const finish = useCallback(() => {
    window.clearTimeout(watchdog.current);
    setIndex((current) => {
      const next = (current + 1) % CLASS_ORDER.length;
      try {
        window.localStorage.setItem(STORE_KEY, String(next));
      } catch {
        /* storage unavailable */
      }
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

  // What is on next, and when. While a class is running the next slot starts after it ends.
  const schedule = useMemo(() => {
    const slots = [];
    const speed = Math.max(1, param("speed", 1));
    let at = mode === "break" ? now + left * 1000 : now + (episode.minutes * 60 + FRAME_SECONDS) * 1000 / speed + breakSeconds * 1000;
    for (let i = 0; i < 4; i += 1) {
      const slotIndex = (mode === "break" ? index + i : index + 1 + i) % CLASS_ORDER.length;
      const ep = findClassroom(CLASS_ORDER[slotIndex]);
      slots.push({ key: `${slotIndex}-${i}`, ep, at });
      at += ((ep.minutes * 60 + FRAME_SECONDS) * 1000) / speed + breakSeconds * 1000;
    }
    return slots;
  }, [mode, index, now, left, episode.minutes, breakSeconds]);

  const upNext = mode === "break" ? episode : schedule[0].ep;
  const tickerItems = useMemo(
    () => [
      `Up next: Episode ${upNext.number}, ${upNext.title}`,
      "ops.palmaierc.com: anonymous hosting, domains and git on one wallet",
      FACTS[(index * 3) % FACTS.length],
      "Try the harness at chat.useroot.sh",
      FACTS[(index * 3 + 1) % FACTS.length],
      "PaLM AI: Utility. Innovation. Revenue.",
      FACTS[(index * 3 + 2) % FACTS.length],
    ],
    [upNext.number, upNext.title, index],
  );

  return (
    <div className="tv-root">
      <div
        ref={setStageEl}
        className="tv-stage"
        style={{ width: STAGE_W, height: STAGE_H, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {mode === "break" && <BreakScreen episode={episode} left={left} total={total} schedule={schedule} />}
        {mode === "class" && stageEl && (
          <Classroom key={`${episodeId}-${play}`} episodeId={episodeId} tv controls={{}} onEnd={finish} container={stageEl} />
        )}
        <Bug now={now} />
        <Ticker key={`${upNext.number}-${index}`} items={tickerItems} />
        {stinger && <Stinger key={stinger.key} kicker={stinger.kicker} title={stinger.title} />}
      </div>
    </div>
  );
}
