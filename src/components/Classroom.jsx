import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import portrait from "../assets/avatar.png";
import { COLORS, Op, opDuration } from "../classroom/draw.jsx";
import { WIDGETS, WIDGET_DEMOS } from "../classroom/widgets.jsx";
import { CLASS_ORDER, findClassroom, starsOf } from "../classroom/episodes.js";
import { gradeOf, saveProgress } from "../classroom/progress.js";

const CPS = 14; // characters the teacher "says" per second
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const MARKERS = ["ink", "red", "blue", "green", "orange", "purple"];

export function estimateSeconds(episode) {
  let total = 0;
  for (const scene of episode.scenes) {
    total += 3.5;
    for (const step of scene.steps) {
      const text = step.ask ? step.ask.say : step.say || "";
      total += text.length / CPS + 0.8;
      if (step.ask) total += 14;
      if (step.widget) total += 40;
    }
  }
  return total;
}

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

function titleOps(title) {
  return [
    { t: "text", x: 500, y: 62, s: title, anchor: "middle", size: 50, color: "ink" },
    { t: "under", x: 500 - title.length * 11.2, y: 82, w: title.length * 22.4, color: "red", at: 600 },
  ];
}

function introOps(ep) {
  return [
    { t: "text", x: 500, y: 150, s: `Episode ${ep.number}`, anchor: "middle", size: 44, color: "red" },
    { t: "text", x: 500, y: 250, s: ep.title, anchor: "middle", size: 70, color: "ink", at: 500 },
    { t: "under", x: 160, y: 276, w: 680, color: "blue", at: 1100 },
    { t: "text", x: 500, y: 350, s: `about ${ep.minutes} minutes  -  class is in session`, anchor: "middle", size: 34, color: "ink", at: 1500 },
    { t: "icon", n: "book", x: 500, y: 450, size: 84, color: "purple", at: 2100 },
  ];
}

function outroOps(ep, earned, stars) {
  const grade = gradeOf(earned.length, stars.length);
  const ops = [
    { t: "text", x: 500, y: 90, s: "Report card", anchor: "middle", size: 56, color: "ink" },
    { t: "under", x: 360, y: 108, w: 280, color: "red", at: 500 },
    { t: "ring", x: 800, y: 250, rx: 100, ry: 90, color: "red", at: 900 },
    { t: "text", x: 800, y: 285, s: grade, anchor: "middle", size: 100, color: "red", at: 1100 },
  ];
  stars.forEach((star, i) => {
    const y = 175 + i * 60;
    const got = earned.includes(star.id);
    ops.push({ t: "text", x: 130, y, s: star.label, size: 36, color: got ? "ink" : "ink", at: 1500 + i * 450 });
    ops.push(got ? { t: "tick", x: 70, y: y - 8, size: 38, at: 1700 + i * 450 } : { t: "cross", x: 88, y: y - 12, size: 26, at: 1700 + i * 450 });
  });
  ops.push({
    t: "text",
    x: 500,
    y: 520,
    s: `${earned.length} of ${stars.length} stars  -  ${ep.number === 5 ? "course complete" : "see you next class"}`,
    anchor: "middle",
    size: 34,
    color: "blue",
    at: 1600 + stars.length * 450,
  });
  return ops;
}

function Marker({ color, active }) {
  return (
    <span className={`cr-marker ${active ? "is-active" : ""}`} aria-hidden="true">
      <i style={{ background: COLORS[color] }} />
    </span>
  );
}

function WallClock({ progress }) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="17" fill="#f4efe3" stroke="#3a3f4b" strokeWidth="3" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return <line key={i} x1={20 + Math.sin(a) * 13} y1={20 - Math.cos(a) * 13} x2={20 + Math.sin(a) * 15} y2={20 - Math.cos(a) * 15} stroke="#3a3f4b" strokeWidth="1.5" />;
      })}
      <line x1="20" y1="20" x2="20" y2="10" stroke="#3a3f4b" strokeWidth="2.2" strokeLinecap="round" transform={`rotate(${progress * 720} 20 20)`} />
      <line x1="20" y1="20" x2="20" y2="6" stroke="#d4414e" strokeWidth="1.6" strokeLinecap="round" transform={`rotate(${progress * 360} 20 20)`} />
    </svg>
  );
}

export default function Classroom({ episodeId, controls, onClose, onSwitch, tv = false, onEnd, container }) {
  const ep = findClassroom(episodeId);
  const stars = useMemo(() => starsOf(ep), [ep]);
  const qa = useMemo(() => {
    try {
      const value = new URLSearchParams(window.location.search).get("scene");
      return value === null ? null : { scene: Number(value) || 0 };
    } catch {
      return null;
    }
  }, []);

  const [phase, setPhase] = useState(qa ? "class" : "intro");
  const [sceneIdx, setSceneIdx] = useState(qa ? qa.scene : 0);
  const [runKey, setRunKey] = useState(0);
  const [ops, setOps] = useState([]);
  const [say, setSay] = useState("");
  const [pen, setPen] = useState({ x: 500, y: 280, color: "ink", on: false });
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(() => {
    // The TV channel can be sped up for testing with ?speed=8.
    if (!tv) return 1;
    try {
      return Number(new URLSearchParams(window.location.search).get("speed")) || 1;
    } catch {
      return 1;
    }
  });
  const [ask, setAsk] = useState(null);
  const [widget, setWidget] = useState(null);
  const [earned, setEarned] = useState([]);
  const [erasing, setErasing] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const tokenRef = useRef(0);
  const skipGen = useRef(0);
  const pausedRef = useRef(false);
  const speedRef = useRef(1);
  const seq = useRef(0);
  const askResolve = useRef(null);
  const widgetResolve = useRef(null);
  const missed = useRef(false);
  const penTimer = useRef(0);
  const earnedRef = useRef([]);

  pausedRef.current = paused;
  speedRef.current = speed;

  const estimate = useMemo(() => estimateSeconds(ep), [ep]);

  const award = useCallback((id) => {
    if (earnedRef.current.includes(id)) return;
    earnedRef.current = [...earnedRef.current, id];
    setEarned(earnedRef.current);
  }, []);

  const pushOps = useCallback((list) => {
    setOps((prev) => [...prev, ...list.map((op) => ({ id: ++seq.current, op }))]);
  }, []);

  const onPen = useCallback((anchor, color, dur) => {
    setPen({ x: anchor.x, y: anchor.y, color, on: true });
    window.clearTimeout(penTimer.current);
    penTimer.current = window.setTimeout(() => setPen((prev) => ({ ...prev, on: false })), dur + 300);
  }, []);

  /** Wait while honouring pause, speed and a skip press. Returns false if the class moved on. */
  const wait = async (ms, tok, gen = skipGen.current) => {
    let left = ms;
    while (left > 0) {
      if (tokenRef.current !== tok) return false;
      if (skipGen.current !== gen) return true;
      await sleep(40);
      if (!pausedRef.current) left -= 40 * speedRef.current;
    }
    return tokenRef.current === tok;
  };

  const typeLine = async (text, tok, gen = skipGen.current) => {
    let n = 0;
    setSay("");
    while (n < text.length) {
      if (tokenRef.current !== tok) return false;
      if (skipGen.current !== gen) break;
      await sleep(50);
      if (pausedRef.current) continue;
      n = Math.min(text.length, n + CPS * 0.05 * speedRef.current);
      setSay(text.slice(0, Math.floor(n)));
    }
    setSay(text);
    return tokenRef.current === tok;
  };

  const resolvePending = () => {
    askResolve.current?.({ skipped: true });
    askResolve.current = null;
    widgetResolve.current?.();
    widgetResolve.current = null;
  };

  const skip = () => {
    skipGen.current += 1;
    resolvePending();
  };

  const goScene = (index) => {
    skipGen.current += 1;
    resolvePending();
    setPaused(false);
    setPhase("class");
    setSceneIdx(Math.max(0, Math.min(ep.scenes.length - 1, index)));
    setRunKey((value) => value + 1);
  };

  // A new episode starts from the bell.
  useEffect(() => {
    tokenRef.current += 1;
    earnedRef.current = [];
    setEarned([]);
    setSeconds(0);
    setSceneIdx(qa ? qa.scene : 0);
    setPhase(qa ? "class" : "intro");
    setRunKey((value) => value + 1);
  }, [episodeId]);

  // Class clock.
  useEffect(() => {
    if (phase !== "class" || paused) return undefined;
    const timer = window.setInterval(() => setSeconds((value) => value + (speedRef.current || 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase, paused]);

  // Intro board.
  useEffect(() => {
    if (phase !== "intro") return undefined;
    const tok = ++tokenRef.current;
    setOps([]);
    setAsk(null);
    setWidget(null);
    setErasing(false);
    (async () => {
      const shown = introOps(ep);
      let last = 0;
      for (const op of shown) {
        if (!(await wait((op.at ?? 0) - last, tok))) return;
        last = op.at ?? 0;
        pushOps([op]);
      }
    })();
    typeLine(tv ? `Welcome back. Episode ${ep.number} starts now.` : "Take a seat. Class is about to begin, and there's a short quiz at the end.", tok);
    if (tv) {
      (async () => {
        if (!(await wait(4200, tok))) return;
        setPhase("class");
        setSceneIdx(0);
        setRunKey((value) => value + 1);
      })();
    }
    return () => {
      tokenRef.current += 1;
    };
  }, [phase, runKey, episodeId]);

  // The lesson itself.
  useEffect(() => {
    if (phase !== "class") return undefined;
    const tok = ++tokenRef.current;
    const scene = ep.scenes[sceneIdx];
    setOps([]);
    setSay("");
    setAsk(null);
    setWidget(null);
    setErasing(false);

    const runAsk = async (item) => {
      missed.current = false;
      setAsk({ ...item, wrong: -1, solved: -1 });
      const result = tv
        ? await (async () => {
            if (!(await wait(3800, tok))) return null;
            const wrongIndex = item.options.findIndex((_, i) => i !== item.answer);
            setAsk((prev) => (prev ? { ...prev, wrong: wrongIndex } : prev));
            setSay(item.hint);
            if (!(await wait(4600, tok))) return null;
            setAsk((prev) => (prev ? { ...prev, solved: item.answer, wrong: -1 } : prev));
            await wait(900, tok);
            return { ok: true };
          })()
        : await new Promise((resolve) => {
            askResolve.current = resolve;
          });
      askResolve.current = null;
      if (tokenRef.current !== tok) return;
      if (!result?.skipped && !missed.current) award(item.id);
      setAsk((prev) => (prev ? { ...prev, locked: true } : prev));
      pushOps([{ t: "tick", x: 925, y: 78, size: 40 }]);
      await typeLine(item.explain, tok);
      await wait(1500, tok);
      setAsk(null);
    };

    const run = async () => {
      if (qa) {
        const all = [...titleOps(scene.title)];
        let lastWidget = null;
        for (const step of scene.steps) {
          for (const op of step.draw || []) all.push(op);
          if (step.widget) lastWidget = step.widget;
        }
        pushOps(all);
        if (lastWidget) setWidget({ id: lastWidget, s: { ...WIDGETS[lastWidget].initial }, finished: false });
        setSay(scene.steps[scene.steps.length - 1]?.say || "");
        return;
      }

      pushOps(titleOps(scene.title));
      if (!(await wait(1300, tok))) return;

      for (const step of scene.steps) {
        if (tokenRef.current !== tok) return;
        const gen = skipGen.current;
        const text = step.ask ? step.ask.say : step.say;
        const drawOps = (step.draw || []).map((op, i) => ({ ...op, at: op.at ?? i * 480 }));
        if (step.widget) setWidget({ id: step.widget, s: { ...WIDGETS[step.widget].initial }, finished: false });

        const drawing = (async () => {
          let last = 0;
          for (let i = 0; i < drawOps.length; i += 1) {
            if (skipGen.current !== gen) {
              pushOps(drawOps.slice(i));
              return;
            }
            if (!(await wait(drawOps[i].at - last, tok, gen))) return;
            last = drawOps[i].at;
            if (skipGen.current !== gen) {
              pushOps(drawOps.slice(i));
              return;
            }
            pushOps([drawOps[i]]);
          }
          if (drawOps.length) await wait(opDuration(drawOps[drawOps.length - 1]), tok, gen);
        })();
        const typing = text ? typeLine(text, tok, gen) : Promise.resolve(true);
        await Promise.all([drawing, typing]);
        if (tokenRef.current !== tok) return;
        if (tokenRef.current !== tok) return;

        if (step.ask) {
          await runAsk(step.ask);
        } else if (step.widget && tv) {
          for (const frame of WIDGET_DEMOS[step.widget]?.() || []) {
            if (!(await wait(frame.ms, tok))) return;
            setWidget((prev) => (prev ? { ...prev, s: frame.s } : prev));
          }
          award(step.widget);
          if (!(await wait(3200, tok))) return;
          setWidget((prev) => (prev ? { ...prev, finished: true } : prev));
        } else if (step.widget) {
          await new Promise((resolve) => {
            widgetResolve.current = resolve;
          });
          widgetResolve.current = null;
          if (tokenRef.current !== tok) return;
          setWidget((prev) => (prev ? { ...prev, finished: true } : prev));
        } else {
          await wait(step.pause ?? 800, tok);
        }
        if (tokenRef.current !== tok) return;
      }

      if (!(await wait(1000, tok))) return;
      setErasing(true);
      if (!(await wait(1100, tok))) return;
      if (sceneIdx + 1 < ep.scenes.length) {
        setSceneIdx(sceneIdx + 1);
      } else {
        setPhase("outro");
      }
    };
    run();

    return () => {
      tokenRef.current += 1;
    };
  }, [phase, sceneIdx, runKey, episodeId]);

  // Report card.
  useEffect(() => {
    if (phase !== "outro") return undefined;
    const tok = ++tokenRef.current;
    setOps([]);
    setAsk(null);
    setWidget(null);
    setErasing(false);
    if (!tv) saveProgress(ep.id, earnedRef.current.length, stars.length);
    const grade = gradeOf(earnedRef.current.length, stars.length);
    typeLine(
      tv
        ? ep.number === 5
          ? "That's the whole course. Stay tuned, we start again from Episode 1 after a short break."
          : `That's Episode ${ep.number}. Stay tuned, the next class starts after a short break.`
        : grade === "D"
        ? "That one was tricky. Rewatch it any time, the lessons stay put."
        : ep.number === 5
          ? "Class dismissed, and that's the whole course. Well done."
          : "Nicely done. Here's your report card, and your homework.",
      tok,
    );
    (async () => {
      let last = 0;
      for (const op of outroOps(ep, earnedRef.current, stars)) {
        if (!(await wait((op.at ?? 0) - last, tok))) return;
        last = op.at ?? 0;
        pushOps([op]);
      }
      if (tv && (await wait(9000, tok))) onEnd?.();
    })();
    return () => {
      tokenRef.current += 1;
    };
  }, [phase, episodeId]);

  const exit = useCallback(
    (dest) => {
      tokenRef.current += 1;
      controls.openView?.(dest || "help");
      onClose?.();
    },
    [controls, onClose],
  );

  useEffect(() => {
    if (tv) return undefined;
    const onKey = (event) => {
      const tag = event.target?.tagName || "";
      if (event.key === "Escape") {
        event.preventDefault();
        exit();
      } else if (/^(INPUT|SELECT|TEXTAREA)$/.test(tag)) {
        return;
      } else if (event.key === "ArrowRight" && phase === "class") {
        skip();
      } else if (event.key === "ArrowLeft" && phase === "class") {
        goScene(sceneIdx - 1);
      } else if (event.key === " " && tag !== "BUTTON" && phase === "class") {
        event.preventDefault();
        setPaused((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const chooseOption = (index) => {
    if (!ask || ask.locked || ask.solved >= 0) return;
    if (index === ask.answer) {
      setAsk((prev) => ({ ...prev, solved: index }));
      askResolve.current?.({ ok: true });
    } else {
      missed.current = true;
      setAsk((prev) => ({ ...prev, wrong: index }));
      setSay(ask.hint);
    }
  };

  const def = widget ? WIDGETS[widget.id] : null;
  const setWidgetState = (s) => setWidget((prev) => (prev ? { ...prev, s } : prev));
  const finishWidget = () => {
    widgetResolve.current?.();
    widgetResolve.current = null;
  };

  const nextId = CLASS_ORDER[CLASS_ORDER.indexOf(ep.id) + 1];
  const grade = gradeOf(earned.length, stars.length);
  const progress = Math.min(1, seconds / Math.max(60, estimate));
  const sceneTitle = phase === "class" ? ep.scenes[sceneIdx]?.title : phase === "outro" ? "Report card" : "Take a seat";

  return createPortal(
    <div className={`cr-root ${tv ? "cr-root--tv" : ""}`} role="dialog" aria-label={`${ep.label}`}>
      <header className="cr-top">
        {tv ? (
          <div className="tv-spacer" aria-hidden="true" />
        ) : (
          <button type="button" className="cr-btn h-8 rounded-lg px-3 text-[12.5px]" onClick={() => exit()}>
            Leave class
          </button>
        )}
        <div className="min-w-0 flex-1 text-center">
          <div className="cr-kicker">Episode {ep.number}</div>
          <div className="truncate text-[14px] text-[var(--cr-wall-ink)]">{ep.title}</div>
        </div>
        <div className="flex items-center gap-2 text-[12px] tabular-nums text-[var(--cr-wall-ink)]">
          <WallClock progress={progress} />
          <span className="hidden sm:inline">
            {clock(seconds)} / ~{ep.minutes}:00
          </span>
        </div>
      </header>

      <div className="cr-bell" aria-label="Lesson chapters">
        {ep.scenes.map((scene, index) => (
          <button
            key={scene.title}
            type="button"
            onClick={() => goScene(index)}
            title={scene.title}
            className={`cr-bell-dot ${phase === "class" && index === sceneIdx ? "is-now" : ""} ${phase === "outro" || (phase === "class" && index < sceneIdx) ? "is-done" : ""}`}
          >
            <span>{index + 1}</span>
          </button>
        ))}
        <span className="cr-bell-name">{sceneTitle}</span>
      </div>

      <div className="cr-stage">
        <div className="cr-board-wrap">
          <div className="cr-board">
            <svg viewBox="0 0 1000 560" className="cr-svg" role="img" aria-label="Whiteboard">
              {ops.map(({ id, op }) => (
                <Op key={id} id={id} op={op} onPen={onPen} instant={!!qa} />
              ))}
              {def && <def.Board s={widget.s} />}
              <g className={`cr-pen ${pen.on ? "is-on" : ""}`} style={{ transform: `translate(${pen.x}px, ${pen.y}px)` }}>
                <g className="cr-pen-wiggle" transform="rotate(32)">
                  <rect x="-5" y="-50" width="10" height="38" rx="3" fill="#f5f5f2" stroke="#4a4f5c" strokeWidth="1.6" />
                  <rect x="-5" y="-50" width="10" height="12" rx="3" fill={COLORS[pen.color] || COLORS.ink} />
                  <path d="M-4 -12 L0 0 L4 -12 Z" fill={COLORS[pen.color] || COLORS.ink} />
                </g>
              </g>
            </svg>
            {erasing && (
              <div className="cr-erase" aria-hidden="true">
                <div className="cr-erase-layer">
                  <b />
                </div>
              </div>
            )}
          </div>
          <div className="cr-tray" aria-hidden="true">
            {MARKERS.map((name) => (
              <Marker key={name} color={name} active={pen.on && pen.color === name} />
            ))}
            <span className="cr-eraser" />
          </div>
        </div>

        <div className="cr-teacher">
          <div className="cr-face">
            <img src={portrait} alt="" draggable={false} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="cr-say" aria-live="polite">
              {say}
              {phase === "class" && !ask && !(widget && !widget.finished) && say.length > 0 && <span className="tour-caret" />}
            </p>

            {phase === "intro" && !tv && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="cr-btn cr-btn--solid h-10 rounded-lg px-5 text-[13.5px]"
                  onClick={() => {
                    setPhase("class");
                    setSceneIdx(0);
                    setRunKey((value) => value + 1);
                  }}
                >
                  Start class
                </button>
              </div>
            )}

            {ask && (
              <div className="mt-3" role="group" aria-label="Question">
                <div className="mb-1.5 text-[13px] text-[var(--cr-muted)]">{ask.q}</div>
                <div className="flex flex-wrap gap-2">
                  {ask.options.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      disabled={ask.locked}
                      onClick={() => chooseOption(index)}
                      className={`cr-btn rounded-lg px-3 py-1.5 text-left text-[13px] ${
                        ask.solved === index ? "cr-btn--good" : ask.wrong === index ? "cr-shake cr-btn--bad" : ""
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {def && !widget.finished && !tv && (
              <div className="mt-3">
                <def.Controls s={widget.s} set={setWidgetState} award={award} done={earned.includes(widget.id)} finish={finishWidget} />
              </div>
            )}

            {phase === "outro" && !tv && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="mr-1 basis-full text-[13px] text-[var(--cr-muted)]">{ep.homework.text}</div>
                <button type="button" className="cr-btn cr-btn--solid h-10 rounded-lg px-4 text-[13.5px]" onClick={() => exit(ep.homework.view)}>
                  {ep.homework.cta}
                </button>
                {nextId && (
                  <button type="button" className="cr-btn h-10 rounded-lg px-4 text-[13.5px]" onClick={() => onSwitch?.(nextId)}>
                    Next: Episode {findClassroom(nextId).number}
                  </button>
                )}
                <button type="button" className="cr-btn h-10 rounded-lg px-4 text-[13.5px]" onClick={() => exit()}>
                  Back to Help
                </button>
                <span className="ml-auto text-[12px] text-[var(--cr-muted)]">Grade {grade}</span>
              </div>
            )}

            {phase === "class" && !tv && (
              <div className="cr-controls">
                <button type="button" className="cr-btn h-8 rounded-lg px-3 text-[12.5px]" onClick={() => goScene(sceneIdx - 1)}>
                  Back
                </button>
                <button type="button" className="cr-btn h-8 rounded-lg px-3 text-[12.5px]" onClick={() => setPaused((value) => !value)}>
                  {paused ? "Play" : "Pause"}
                </button>
                <button type="button" className="cr-btn h-8 rounded-lg px-3 text-[12.5px]" onClick={skip} title="Finish this line and go on">
                  Next
                </button>
                <button
                  type="button"
                  className="cr-btn h-8 rounded-lg px-3 text-[12.5px]"
                  onClick={() => setSpeed((value) => (value >= 2 ? 1 : value === 1 ? 1.5 : 2))}
                  title="Class speed"
                >
                  {speed}x
                </button>
                <span className="ml-auto text-[12px] tabular-nums text-[var(--cr-muted)]">
                  {earned.length}/{stars.length} stars
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    container || document.body,
  );
}
