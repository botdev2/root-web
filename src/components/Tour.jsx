import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppKitState } from "@reown/appkit/react";
import portrait from "../assets/avatar.png";
import { useAppState } from "../AppState.jsx";
import { buildScript } from "../tour/script.js";

export const TOUR_SEEN_KEY = "root-web-tour-seen";

const val = (value, ...args) => (typeof value === "function" ? value(...args) : value);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function visible(node) {
  const box = node.getBoundingClientRect();
  if (box.width <= 0 || box.height <= 0) return false;
  const style = getComputedStyle(node);
  return style.visibility !== "hidden" && style.display !== "none";
}

function pickNodes(target, limit = 8) {
  const groups = Array.isArray(target) ? target : [target];
  for (const selector of groups) {
    if (!selector) continue;
    let nodes = [];
    try {
      nodes = Array.from(document.querySelectorAll(selector)).filter(visible);
    } catch {
      nodes = [];
    }
    if (nodes.length) return nodes.slice(0, limit);
  }
  return [];
}

function measure(target, limit) {
  const nodes = pickNodes(target, limit);
  if (!nodes.length) return null;
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const node of nodes) {
    const box = node.getBoundingClientRect();
    left = Math.min(left, box.left);
    top = Math.min(top, box.top);
    right = Math.max(right, box.right);
    bottom = Math.max(bottom, box.bottom);
  }
  const width = right - left;
  const height = bottom - top;
  const own = nodes.length === 1 ? parseFloat(getComputedStyle(nodes[0]).borderTopLeftRadius) || 12 : 14;
  return { left, top, width, height, radius: Math.min(own, height / 2, 28) };
}

function sameRect(a, b) {
  if (!a || !b) return a === b;
  return (
    Math.abs(a.left - b.left) < 0.6 &&
    Math.abs(a.top - b.top) < 0.6 &&
    Math.abs(a.width - b.width) < 0.6 &&
    Math.abs(a.height - b.height) < 0.6
  );
}

function placeCard(rect, pad, vw, vh, height, step) {
  const margin = 14;
  const mobile = vw < 700;
  const popW = Math.min(392, vw - margin * 2);
  const dockW = Math.min(700, vw - margin * 2);
  const dock = (top) => ({ left: (vw - dockW) / 2, top, width: dockW });
  const bottomDock = () => dock(Math.max(margin, vh - height - 26));
  if (!rect) return bottomDock();
  if (mobile) {
    const centre = rect.top + rect.height / 2;
    return centre > vh / 2 ? dock(margin + 6) : dock(Math.max(margin, vh - height - 14));
  }
  const area = (rect.width + pad * 2) * (rect.height + pad * 2);
  if (step.place === "dock" || area > vw * vh * 0.38) return bottomDock();
  const gap = 22;
  const clampTop = (top) => Math.min(Math.max(margin, top), vh - height - margin);
  const clampLeft = (left) => Math.min(Math.max(margin, left), vw - popW - margin);
  const centreX = rect.left + rect.width / 2;
  const centreY = rect.top + rect.height / 2;
  const options = {
    right: { left: rect.left + rect.width + pad + gap, top: clampTop(centreY - height / 2) },
    left: { left: rect.left - pad - gap - popW, top: clampTop(centreY - height / 2) },
    bottom: { left: clampLeft(centreX - popW / 2), top: rect.top + rect.height + pad + gap },
    top: { left: clampLeft(centreX - popW / 2), top: rect.top - pad - gap - height },
  };
  const order = step.place === "top" ? ["top", "bottom", "right", "left"] : ["right", "left", "bottom", "top"];
  for (const key of order) {
    const spot = options[key];
    if (spot.left >= margin && spot.left + popW <= vw - margin && spot.top >= margin && spot.top + height <= vh - margin) {
      return { ...spot, width: popW };
    }
  }
  return bottomDock();
}

function useViewport() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const fit = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return size;
}

export default function Tour({ live, controls, onClose, autoplay = false }) {
  const { setMode } = useAppState();
  const { open: walletOpen } = useAppKitState();
  const script = useMemo(() => buildScript(), []);
  const liveRef = useRef(live);
  liveRef.current = live;
  const flags = useRef({ startedAt: Date.now(), sawSending: false, sawWaiting: false, blocked: "", repoName: "", waitStart: 0 }).current;
  const run = useRef(0);
  const cardRef = useRef(null);
  const viewport = useViewport();

  const [phase, setPhase] = useState("intro");
  const [leaving, setLeaving] = useState(false);
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(autoplay);
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState(0);
  const [typedDone, setTypedDone] = useState(false);
  const [rect, setRect] = useState(null);
  const [cursor, setCursor] = useState({ x: -60, y: -60, show: false, tap: 0 });
  const [caption, setCaption] = useState("");
  const [cardHeight, setCardHeight] = useState(240);
  const [, setSecond] = useState(0);

  const step = script[index];
  const stepLive = live;
  const title = phase === "steps" ? val(step.title, stepLive, flags) : "";
  const body = phase === "steps" ? val(step.body, stepLive, flags) || "" : "";
  const target = phase === "steps" ? val(step.target, stepLive, flags) : null;
  const waitDone = !step.wait || step.wait.until(stepLive, flags);
  const waiting = phase === "steps" && !!step.wait && !waitDone;
  if (waiting) {
    flags.sawWaiting = true;
    if (!flags.waitStart) flags.waitStart = Date.now();
  }

  useEffect(() => {
    if (live.sending) flags.sawSending = true;
  }, [live.sending, flags]);

  const markSeen = () => {
    try {
      localStorage.setItem(TOUR_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const exit = useCallback(
    (finished) => {
      run.current += 1;
      if (document.querySelector("[data-add-project]")) {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      }
      markSeen();
      onClose?.(!!finished);
    },
    [onClose],
  );

  const makeCtx = (token) => {
    const alive = () => run.current === token;
    const moveTo = async (node) => {
      const box = node.getBoundingClientRect();
      setCursor((prev) => ({ ...prev, x: box.left + Math.min(box.width / 2, 120), y: box.top + box.height / 2, show: true }));
      await sleep(900);
    };
    const click = async (node) => {
      await moveTo(node);
      if (!alive()) return;
      setCursor((prev) => ({ ...prev, tap: prev.tap + 1 }));
      await sleep(300);
      if (alive()) node.click();
      await sleep(200);
    };
    const typeInto = async (node, text, options = {}) => {
      await moveTo(node);
      if (!alive()) return false;
      node.focus();
      await sleep(260);
      const proto = node instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setValue = Object.getOwnPropertyDescriptor(proto, "value").set;
      setValue.call(node, "");
      node.dispatchEvent(new Event("input", { bubbles: true }));
      const speed = options.speed || 24;
      for (let i = 1; i <= text.length; i += 1) {
        if (!alive()) return false;
        setValue.call(node, text.slice(0, i));
        node.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(speed + Math.random() * speed * 0.5);
      }
      await sleep(350);
      return alive();
    };
    const waitFor = async (check, ms = 5000) => {
      const end = Date.now() + ms;
      while (Date.now() < end) {
        if (!alive()) return false;
        const found = check();
        if (found) return found;
        await sleep(120);
      }
      return false;
    };
    return {
      alive,
      flags,
      live: () => liveRef.current,
      controls: { ...controls, setMode },
      q: (selector) => document.querySelector(selector),
      sleep,
      waitFor,
      click,
      typeInto,
      caption: (text) => setCaption(text),
    };
  };

  const settle = (list, from, direction = 1) => {
    let next = from + direction;
    while (next >= 0 && next < list.length && list[next].skipIf?.(liveRef.current, flags)) next += direction;
    return next;
  };

  const enterStep = async (next) => {
    const token = ++run.current;
    const upcoming = script[next];
    flags.sawWaiting = false;
    flags.waitStart = 0;
    setIndex(next);
    setTyped(0);
    setTypedDone(false);
    setCaption("");
    setCursor((prev) => ({ ...prev, show: false }));
    setBusy(true);
    try {
      await upcoming.enter?.(makeCtx(token));
    } catch {
      /* a step setup must never stop the tour */
    }
    if (run.current !== token) return;
    setBusy(false);
    const nodes = pickNodes(val(upcoming.target, liveRef.current, flags), upcoming.limit || 8);
    nodes[0]?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  };

  const finish = () => {
    run.current += 1;
    setCursor((prev) => ({ ...prev, show: false }));
    setCaption("");
    setBusy(false);
    markSeen();
    controls.setNavOpen(false);
    setLeaving(false);
    setPhase("outro");
  };

  const advance = (from) => {
    const next = settle(script, from);
    if (next >= script.length) finish();
    else enterStep(next);
  };

  const begin = () => {
    if (leaving || phase !== "intro") return;
    setLeaving(true);
    window.setTimeout(() => {
      setPhase("steps");
      setLeaving(false);
      enterStep(settle(script, -1));
    }, 900);
  };

  const primary = async () => {
    if (busy || phase !== "steps") return;
    if (step.wait && !waitDone) return;
    if (!step.act) {
      advance(index);
      return;
    }
    const token = run.current;
    setBusy(true);
    let result;
    try {
      result = await step.act(makeCtx(token));
    } catch {
      result = "stay";
    }
    if (run.current !== token) return;
    setBusy(false);
    setCursor((prev) => ({ ...prev, show: false }));
    if (result === "stay") return;
    if (result && result.goto) {
      const next = script.findIndex((item) => item.id === result.goto);
      if (next >= 0) enterStep(next);
      else advance(index);
      return;
    }
    advance(index);
  };

  const primaryRef = useRef(primary);
  primaryRef.current = primary;
  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  const back = () => {
    if (busy || phase !== "steps") return;
    const limit = script.findIndex((item) => item.id === "repo-open");
    if (index > limit) return;
    const previous = settle(script, index, -1);
    if (previous >= 0) enterStep(previous);
  };

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        exit(false);
      } else if (event.key === "ArrowRight" && phase === "steps") {
        primaryRef.current();
      } else if (event.key === "ArrowLeft" && phase === "steps") {
        back();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => () => {
    run.current += 1;
  }, []);

  useEffect(() => {
    if (phase !== "intro" || !auto) return undefined;
    const timer = window.setTimeout(() => begin(), 9600);
    return () => window.clearTimeout(timer);
  }, [phase, auto]);

  // The words arrive one at a time.
  useEffect(() => {
    if (phase !== "steps") return undefined;
    setTyped(0);
    setTypedDone(false);
    const text = val(script[index].body, liveRef.current, flags) || "";
    const stride = Math.max(1, Math.round(text.length / 240));
    let at = 0;
    const timer = window.setInterval(() => {
      at += stride;
      if (at >= text.length) {
        setTyped(text.length);
        setTypedDone(true);
        window.clearInterval(timer);
      } else {
        setTyped(at);
      }
    }, 17);
    return () => window.clearInterval(timer);
  }, [phase, index]);

  // The spotlight follows its target, even while the layout moves.
  const pad = step.pad ?? 8;
  useEffect(() => {
    if (phase !== "steps") return undefined;
    let frame = 0;
    const loop = () => {
      const next = measure(target, step.limit || 8);
      setRect((prev) => (sameRect(prev, next) ? prev : next));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [phase, index, JSON.stringify(target)]);

  useEffect(() => {
    if (!cardRef.current || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => setCardHeight(Math.round(entry.contentRect.height)));
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [phase]);

  useEffect(() => {
    if (!waiting) return undefined;
    const timer = window.setInterval(() => setSecond((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [waiting]);

  // Gates open on their own once the real thing happens.
  useEffect(() => {
    if (phase !== "steps" || busy || !step.wait || !waitDone || step.act) return undefined;
    if (!flags.sawWaiting && !step.wait.eager) return undefined;
    const timer = window.setTimeout(() => advanceRef.current(index), step.wait.settle || 900);
    return () => window.clearTimeout(timer);
  }, [phase, busy, waitDone, index]);

  // Autoplay reads at a human pace, then moves on.
  useEffect(() => {
    if (!auto || phase !== "steps" || busy || !typedDone) return undefined;
    if (step.wait && !waitDone) return undefined;
    if (step.wait && !step.act && (flags.sawWaiting || step.wait.eager)) return undefined;
    const delay = step.act ? 1500 : Math.max(2600, body.length * 36);
    const timer = window.setTimeout(() => primaryRef.current(), delay);
    return () => window.clearTimeout(timer);
  }, [auto, phase, busy, typedDone, waitDone, index]);

  const committed = !!(live.lastCommit && live.lastCommit.at >= flags.startedAt);

  if (walletOpen) return null;

  const vw = viewport.w;
  const vh = viewport.h;
  const spot = rect
    ? { left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, borderRadius: rect.radius + pad * 0.6 }
    : { left: vw / 2, top: vh / 2, width: 0, height: 0, borderRadius: 0 };
  const card = placeCard(rect, pad, vw, vh, cardHeight, step);
  const lastIndex = settle(script, index) >= script.length;
  const ctaLabel = val(step.cta, live, flags) || (lastIndex ? "Finish" : "Next");
  const progress = Math.round((index / Math.max(1, script.length - 1)) * 100);
  const backLimit = script.findIndex((item) => item.id === "repo-open");
  const shown = typedDone ? body : body.slice(0, typed);
  const waitedFor = flags.waitStart ? Math.max(0, Math.round((Date.now() - flags.waitStart) / 1000)) : 0;

  let blockers = null;
  if (phase === "steps") {
    if (step.interactive && rect) {
      const l = Math.max(0, spot.left);
      const t = Math.max(0, spot.top);
      const r = Math.min(vw, spot.left + spot.width);
      const b = Math.min(vh, spot.top + spot.height);
      blockers = (
        <>
          <div className="tour-block" style={{ left: 0, top: 0, width: vw, height: t }} />
          <div className="tour-block" style={{ left: 0, top: b, width: vw, height: Math.max(0, vh - b) }} />
          <div className="tour-block" style={{ left: 0, top: t, width: l, height: Math.max(0, b - t) }} />
          <div className="tour-block" style={{ left: r, top: t, width: Math.max(0, vw - r), height: Math.max(0, b - t) }} />
        </>
      );
    } else {
      blockers = <div className="tour-block" style={{ inset: 0 }} />;
    }
  }

  return createPortal(
    <>
      {phase === "intro" && (
        <>
          <Bars leaving={leaving} />
          <div className={`tour-cinema ${leaving ? "is-leaving" : ""}`} role="dialog" aria-label="Welcome to /root">
            <div className="tour-glow" />
            <Petals />
            <div className="tour-sweep" />
            <div className="tour-stage">
              <img src="/palm.png" alt="" className="tour-logo" />
              <div className="tour-word">/root</div>
              <div className="tour-kicker" style={{ marginTop: 20, animationDelay: "2.7s" }}>
                PALM Ops × Root
              </div>
              <p className="tour-line" style={{ animationDelay: "3.2s", marginTop: 12 }}>
                Build in a decentralized, anonymous way.
              </p>
              <p className="tour-line" style={{ animationDelay: "4.3s", marginTop: 6 }}>
                No account, no email, no name. Your wallet is the only key.
              </p>
              <p className="tour-line" style={{ animationDelay: "5.4s", marginTop: 6 }}>
                Your repositories live on the PALM Ops Hub. Thinking on GLM 5.2.
              </p>
              <button type="button" className="tour-begin" style={{ animationDelay: "6.6s" }} onClick={begin}>
                Begin
              </button>
            </div>
            <button type="button" className="tour-skip" onClick={() => exit(false)}>
              Skip
            </button>
          </div>
        </>
      )}

      {phase === "outro" && (
        <>
          <Bars leaving={leaving} />
          <div className={`tour-cinema tour-cinema--outro ${leaving ? "is-leaving" : ""}`} role="dialog" aria-label="Good luck">
            <div className="tour-glow" />
            <Petals />
            <div className="tour-sweep" />
            <div className="tour-stage">
              <div className="tour-kicker">{committed ? "First commit" : "That's the tour"}</div>
              <div className="tour-big">Good luck.</div>
              <p className="tour-line" style={{ animationDelay: "2.2s" }}>
                {committed
                  ? "Your first file is committed to the PALM Ops Hub, signed by a wallet and nobody else. Nobody asked who you are. Keep it that way."
                  : "A wallet, a repository, a prompt. That's all it takes. No account, no name. Go build something."}
              </p>
              <button
                type="button"
                className="tour-begin"
                style={{ animationDelay: "3.2s" }}
                onClick={() => {
                  setLeaving(true);
                  window.setTimeout(() => exit(true), 800);
                }}
              >
                Keep building
              </button>
            </div>
          </div>
        </>
      )}

      {phase === "steps" && (
        <div className="tour-root" role="dialog" aria-label="Guided tour">
          {blockers}
          <div className="tour-dim" style={spot} />
          {rect && <div className="tour-ring" style={spot} />}

          <div ref={cardRef} className="tour-card" style={card}>
            <div className="tour-progress">
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="flex gap-3.5 p-4 md:p-[18px]">
              <div className="tour-face">
                <img src={portrait} alt="" draggable={false} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-[10.5px] uppercase tracking-[0.18em] text-[var(--faint)]">{step.chapter}</span>
                  <button
                    type="button"
                    onClick={() => exit(false)}
                    className="text-[11px] text-[var(--faint)] hover:text-[var(--ink)]"
                  >
                    Skip tour
                  </button>
                </div>
                <div key={step.id} className="tour-rise">
                  <h3 className="text-[18px] leading-[1.25] tracking-[-0.01em] text-[var(--ink)]">{title}</h3>
                  <p
                    className="mt-1.5 min-h-[3.2em] text-[13.5px] leading-[1.6] text-[var(--muted)]"
                    onClick={() => setTypedDone(true)}
                    aria-live="polite"
                  >
                    {shown}
                    {!typedDone && <span className="tour-caret" />}
                  </p>
                </div>

                {waiting && (
                  <div className="mt-2 flex items-center gap-2 text-[12px] text-[var(--amber)]">
                    <span className="relative inline-flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--amber)] opacity-70" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--amber)]" />
                    </span>
                    <span>{step.wait.text}</span>
                    {waitedFor > 3 && <span className="tabular-nums text-[var(--faint)]">{waitedFor}s</span>}
                  </div>
                )}
                {!waiting && caption && <div className="mt-2 text-[12px] text-[var(--amber)]">{caption}</div>}

                <div className="mt-3.5 flex items-center gap-2">
                  {index > 0 && index <= backLimit && (
                    <button
                      type="button"
                      onClick={back}
                      disabled={busy}
                      className="h-9 rounded-lg border border-[var(--stroke)] px-3 text-[12.5px] text-[var(--ink)] hover:bg-[var(--hover)] disabled:opacity-40"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAuto((value) => !value)}
                    title="Autoplay also creates the repository and sends the prompt"
                    className={`h-9 rounded-lg border px-2.5 text-[12px] ${
                      auto ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--stroke)] text-[var(--muted)] hover:bg-[var(--hover)]"
                    }`}
                  >
                    Autoplay{auto ? " · on" : ""}
                  </button>
                  <span className="flex-1" />
                  {!(step.wait && !step.act) || waitDone ? (
                    <button
                      type="button"
                      onClick={primary}
                      disabled={busy || (step.wait && !waitDone)}
                      className="h-9 rounded-lg bg-[var(--accent)] px-4 text-[13px] text-[var(--bg)] disabled:opacity-50"
                    >
                      {busy ? "Working…" : ctaLabel}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="tour-cursor" style={{ left: cursor.x, top: cursor.y, opacity: cursor.show ? 1 : 0 }} aria-hidden="true">
            {cursor.tap > 0 && <span key={cursor.tap} className="tour-tap" />}
            <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
              <path d="M2 2v19l5.2-4.6 3.4 7.4 3.4-1.6-3.4-7.2H18L2 2z" fill="#fff" stroke="#141210" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}

function Petals() {
  const petals = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        key: i,
        style: {
          left: `${Math.round(Math.random() * 100)}%`,
          "--s": `${14 + Math.round(Math.random() * 14)}px`,
          "--d": `${11 + Math.random() * 9}s`,
          "--w": `-${(Math.random() * 16).toFixed(1)}s`,
          "--x": `${Math.round(40 + Math.random() * 110)}px`,
        },
      })),
    [],
  );
  return (
    <div className="tour-petals" aria-hidden="true">
      {petals.map((petal) => (
        <span key={petal.key} className="tour-petal" style={petal.style} />
      ))}
    </div>
  );
}

function Bars({ leaving }) {
  return (
    <>
      <div className={`tour-bar tour-bar--top ${leaving ? "is-leaving" : ""}`} />
      <div className={`tour-bar tour-bar--bottom ${leaving ? "is-leaving" : ""}`} />
    </>
  );
}
