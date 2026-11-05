import { useCallback, useEffect, useRef, useState } from "react";
import Classroom from "../components/Classroom.jsx";
import { CLASS_ORDER, findClassroom } from "../classroom/episodes.js";

/**
 * ROOT TV: a 24/7 channel that plays Episodes 1-5 back to back with a
 * 30 second break between them. Meant to be a browser source in OBS:
 *   https://chat.useroot.sh/tv
 * Options (query string):
 *   ?start=3     first episode to play (1-5)
 *   ?break=30    seconds between episodes
 *   ?first=8     seconds of break shown before the very first episode
 *   ?reload=6    hours of uptime after which the page refreshes itself (at a break)
 */

const STAGE_W = 1920;
const STAGE_H = 1080;
const MAX_EPISODE_MS = 14 * 60 * 1000;
const STORE_KEY = "root-tv-next";
const BOOT = Date.now();

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

function BreakScreen({ episode, left, total, order }) {
  const [fact, setFact] = useState(() => Math.floor(Math.random() * FACTS.length));
  useEffect(() => {
    const timer = window.setInterval(() => setFact((value) => (value + 1) % FACTS.length), 7000);
    return () => window.clearInterval(timer);
  }, []);

  const radius = 150;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.max(0, Math.min(1, left / total));
  const scenes = episode.scenes.map((scene) => scene.title);

  return (
    <div className="tv-break">
      <div className="tv-break-top">
        <div className="tv-bug">
          <i /> ROOT TV
        </div>
        <div className="tv-break-kicker">be right back</div>
        <div className="tv-break-url">chat.useroot.sh</div>
      </div>

      <div className="tv-break-main">
        <div className="tv-break-clock">
          <svg width="360" height="360" viewBox="0 0 360 360" aria-hidden="true">
            <circle cx="180" cy="180" r={radius} fill="none" stroke="rgba(236,232,223,0.14)" strokeWidth="14" />
            <circle
              cx="180"
              cy="180"
              r={radius}
              fill="none"
              stroke="#d4414e"
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
            {scenes.map((title, index) => (
              <li key={title} style={{ animationDelay: `${0.25 + index * 0.18}s` }}>
                <span>{index + 1}</span>
                {title}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="tv-break-bottom">
        <div className="tv-break-fact" key={fact}>
          {FACTS[fact]}
        </div>
        <div className="tv-break-schedule">
          {order.map((id) => {
            const item = findClassroom(id);
            return (
              <div key={id} className={`tv-chip ${id === episode.id ? "is-next" : ""}`}>
                <b>{item.number}</b>
                <span>{item.title}</span>
              </div>
            );
          })}
        </div>
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
    document.title = "ROOT TV";
    document.documentElement.classList.add("tv-html");
    return () => document.documentElement.classList.remove("tv-html");
  }, []);

  // Break countdown, then roll the next class.
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
      setMode("class");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [mode, left]);

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

  return (
    <div className="tv-root">
      <div
        ref={setStageEl}
        className="tv-stage"
        style={{ width: STAGE_W, height: STAGE_H, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {mode === "break" && <BreakScreen episode={episode} left={left} total={total} order={CLASS_ORDER} />}
        {mode === "class" && stageEl && (
          <Classroom key={`${episodeId}-${play}`} episodeId={episodeId} tv controls={{}} onEnd={finish} container={stageEl} />
        )}
      </div>
    </div>
  );
}
