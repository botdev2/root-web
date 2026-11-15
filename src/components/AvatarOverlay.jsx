import { useEffect, useRef, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import portrait from "../assets/avatar.png";
import { sendTurn, watchAvatar } from "../glmChat.js";

const CHAT_KEY = "root-web-avatar-conversation";
const HISTORY_KEY = "root-web-avatar-history";
const POS_KEY = "root-web-avatar-pos";
const PORTRAIT_W = 128;
const PORTRAIT_H = Math.round((PORTRAIT_W * 993) / 871);

function clampPos(x, y) {
  const margin = 12;
  const maxX = Math.max(margin, window.innerWidth - PORTRAIT_W - margin);
  const maxY = Math.max(margin, window.innerHeight - PORTRAIT_H - margin);
  return {
    x: Math.min(maxX, Math.max(margin, x)),
    y: Math.min(maxY, Math.max(margin, y)),
  };
}

function initialPos() {
  try {
    const raw = JSON.parse(localStorage.getItem(POS_KEY) || "null");
    if (raw && Number.isFinite(raw.x) && Number.isFinite(raw.y)) return clampPos(raw.x, raw.y);
  } catch {
    /* ignore */
  }
  const bottom = window.innerWidth >= 768 ? 24 : 92;
  return clampPos(window.innerWidth - PORTRAIT_W - 24, window.innerHeight - PORTRAIT_H - bottom);
}

function walletKey(address) {
  return String(address || "").toLowerCase();
}

function chatKey(address) {
  return CHAT_KEY + ":" + walletKey(address);
}

function historyKey(address) {
  return HISTORY_KEY + ":" + walletKey(address);
}

function readChatId(address) {
  try {
    const scoped = localStorage.getItem(chatKey(address));
    if (scoped) return scoped;
    const legacy = localStorage.getItem(CHAT_KEY) || "";
    if (legacy) {
      localStorage.setItem(chatKey(address), legacy);
      localStorage.removeItem(CHAT_KEY);
    }
    return legacy;
  } catch {
    return "";
  }
}

function writeChatId(address, id) {
  try {
    if (id) localStorage.setItem(chatKey(address), id);
    else localStorage.removeItem(chatKey(address));
  } catch {
    /* ignore */
  }
}

function readHistory(address) {
  try {
    const rows = JSON.parse(localStorage.getItem(historyKey(address)) || "[]");
    return Array.isArray(rows) ? rows.filter((row) => row?.text).slice(-8) : [];
  } catch {
    return [];
  }
}

function writeHistory(address, rows) {
  try {
    localStorage.setItem(historyKey(address), JSON.stringify((rows || []).slice(-8)));
  } catch {
    /* ignore */
  }
}

function deadThread(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    error?.status === 404 ||
    error?.status === 409 ||
    error?.archived === true ||
    message.includes("not on this wallet") ||
    message.includes("archived")
  );
}

function greeting(view, projectLabel) {
  const where = view === "home" ? "home" : String(view || "this screen");
  return projectLabel
    ? `Hey — I can see this chat and ${projectLabel}. I'll jump in if I notice something.`
    : `Hey — I can see this chat and the open repo. I'll jump in if I notice something on ${where}.`;
}

function workspacePayload(workspace) {
  const work = workspace && typeof workspace === "object" ? workspace : {};
  return {
    workTitle: String(work.workTitle || "").slice(0, 80),
    workMode: String(work.workMode || "").slice(0, 16),
    chat: String(work.chat || "").slice(0, 2500),
    files: String(work.files || "").slice(0, 3500),
  };
}

export default function AvatarOverlay({
  open,
  view,
  projectLabel,
  onTour,
  onConnect,
  signedIn = false,
  credit = null,
  workspace = null,
  hidden = false,
}) {
  const { open: openWallet } = useAppKit();
  const { address, isConnected } = useAccount();
  const ready = !!(isConnected && address && signedIn);
  const [talking, setTalking] = useState(true);
  const [draft, setDraft] = useState("");
  const [lines, setLines] = useState([]);
  const [busy, setBusy] = useState(false);
  const [ping, setPing] = useState(false);
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && navigator.onLine === false);
  const [failed, setFailed] = useState(false);
  const [pos, setPos] = useState(initialPos);
  const busyRef = useRef(false);
  const linesRef = useRef([]);
  const creditRef = useRef(credit);
  const typedAt = useRef(0);
  const dragRef = useRef(null);
  const suppressClick = useRef(false);
  const replyRef = useRef(null);
  const scrollerRef = useRef(null);
  const workspaceRef = useRef(workspace);
  creditRef.current = credit;
  linesRef.current = lines;
  workspaceRef.current = workspace;

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    const fit = () => setPos((current) => clampPos(current.x, current.y));
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    window.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("resize", fit);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const held = address ? readHistory(address) : [];
    const next = held.length ? held : [{ role: "assistant", text: greeting(view, projectLabel) }];
    linesRef.current = next;
    setLines(next);
    setTalking(true);
    setFailed(false);
  }, [open, address]);

  useEffect(() => {
    scrollerRef.current?.scrollTo?.(0, scrollerRef.current.scrollHeight);
  }, [lines, talking]);

  const status = offline || failed ? "red" : ready ? "green" : "yellow";
  const statusLabel = status === "green" ? "Available" : status === "red" ? "Unavailable" : "Standard";
  const statusTone =
    status === "green"
      ? { hi: "#8eecc0", lo: "#2ea85c", glow: "rgba(60,186,106,0.85)" }
      : status === "red"
        ? { hi: "#ffb4b4", lo: "#d63a3a", glow: "rgba(226,75,75,0.8)" }
        : { hi: "#ffe58a", lo: "#e2b30e", glow: "rgba(240,196,25,0.85)" };

  const remember = (next) => {
    const kept = next.filter((row) => row?.text).slice(-8);
    linesRef.current = kept;
    setLines(kept);
    if (address) writeHistory(address, kept);
  };

  const speak = async (text) => {
    const said = String(text || "").trim();
    if (!said || busyRef.current) return;
    if (!isConnected || !address) {
      remember([...linesRef.current, { role: "assistant", text: "Connect a wallet and I can talk." }]);
      if (onConnect) onConnect();
      else openWallet({ view: "Connect" });
      return;
    }
    if (!signedIn) {
      remember([...linesRef.current, { role: "assistant", text: "Approve the wallet signature and I'm in." }]);
      if (onConnect) onConnect();
      else openWallet({ view: "Connect" });
      return;
    }
    if (credit && Number.isFinite(credit.remaining) && credit.remaining <= 0) {
      remember([...linesRef.current, { role: "assistant", text: "Hamrin credits on this wallet are used up, so I can't answer until they refill." }]);
      return;
    }
    busyRef.current = true;
    setBusy(true);
    const pending = [...linesRef.current, { role: "user", text: said }];
    remember(pending);
    const turn = async (conversationId) =>
      sendTurn(address, {
        conversationId,
        projectId: "__avatar__",
        projectLabel: projectLabel || "",
        view: view || "home",
        title: "Avatar",
        mode: "ask",
        text: said,
        brain: {},
        autoprompt: false,
        ...workspacePayload(workspaceRef.current),
      });
    try {
      let conversationId = readChatId(address);
      let result;
      try {
        result = await turn(conversationId);
      } catch (error) {
        if (!deadThread(error)) throw error;
        writeChatId(address, "");
        result = await turn("");
      }
      const id = result.conversation?.id || "";
      if (id) writeChatId(address, id);
      setFailed(false);
      const reply = String(result.text || "").replace(/\s+/g, " ").trim() || "I lost that one.";
      remember([...pending, { role: "assistant", text: reply }]);
    } catch (error) {
      setFailed(true);
      remember([...pending, { role: "assistant", text: error.message || "I could not answer." }]);
    } finally {
      busyRef.current = false;
      setBusy(false);
      setTalking(true);
      requestAnimationFrame(() => replyRef.current?.focus());
    }
  };

  useEffect(() => {
    if (!open || hidden || !ready || !address) return undefined;
    let cancelled = false;
    const observe = () => {
      watchAvatar(address, {
        view: view || "home",
        projectLabel: projectLabel || "",
        conversationId: readChatId(address),
        nudge: false,
        ...workspacePayload(workspaceRef.current),
      }).catch(() => {});
    };
    const offer = async () => {
      if (cancelled || busyRef.current || document.hidden) return;
      if (Date.now() - typedAt.current < 20_000) return;
      const left = creditRef.current;
      if (left && Number.isFinite(left.remaining) && left.remaining <= 0) return;
      try {
        const data = await watchAvatar(address, {
          view: view || "home",
          projectLabel: projectLabel || "",
          conversationId: readChatId(address),
          nudge: true,
          ...workspacePayload(workspaceRef.current),
        });
        const advice = String(data?.advice || "").replace(/\s+/g, " ").trim();
        if (cancelled || !advice) return;
        const last = linesRef.current[linesRef.current.length - 1];
        if (last?.role === "assistant" && last.text === advice) return;
        remember([...linesRef.current, { role: "assistant", text: advice }]);
        setTalking(true);
        setPing(true);
        window.setTimeout(() => setPing(false), 1600);
        const id = data.conversation?.id;
        if (id) writeChatId(address, id);
      } catch {
        /* stay quiet if a nudge misses */
      }
    };
    observe();
    const soon = window.setTimeout(offer, 14000);
    let loop;
    const tick = () => {
      loop = window.setTimeout(() => {
        offer();
        tick();
      }, 50000 + Math.floor(Math.random() * 28000));
    };
    const start = window.setTimeout(tick, 22000);
    return () => {
      cancelled = true;
      window.clearTimeout(soon);
      window.clearTimeout(start);
      window.clearTimeout(loop);
    };
  }, [open, hidden, ready, address, view, projectLabel]);

  if (!open || hidden) return null;

  const bubbleAbove = pos.y > 220;

  return (
    <div className="fixed z-[70]" style={{ left: pos.x, top: pos.y, width: PORTRAIT_W }}>
      <div
        className={`pointer-events-none absolute right-0 flex w-max max-w-[260px] flex-col items-end gap-2 ${
          bubbleAbove ? "bottom-full mb-2" : "top-full mt-2"
        }`}
      >
        {talking && (
          <div className="pointer-events-auto frost-panel w-[min(260px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[var(--stroke)] shadow-lg">
            <div ref={scrollerRef} className="flex max-h-[220px] flex-col gap-1.5 overflow-y-auto px-3 py-2.5">
              {lines.map((row, index) => (
                <div
                  key={index}
                  className={`avatar-pop max-w-[95%] rounded-2xl px-2.5 py-1.5 text-left text-[13px] leading-5 ${
                    row.role === "user"
                      ? "ml-auto bg-[var(--accent)] text-[var(--bg)]"
                      : "mr-auto bg-[var(--bubble)] text-[var(--ink)]"
                  }`}
                >
                  {row.text}
                </div>
              ))}
              {busy && (
                <div className="mr-auto rounded-2xl bg-[var(--panel)] px-2.5 py-1.5 text-[13px] text-[var(--faint)]">…</div>
              )}
            </div>
            {onTour && lines.length <= 1 && (
              <button
                type="button"
                onClick={() => onTour()}
                className="mx-3 mb-2 h-8 w-[calc(100%-1.5rem)] rounded-lg border border-[var(--stroke)] text-[12px] text-[var(--muted)] hover:bg-[var(--hover)]"
              >
                Start the tour
              </button>
            )}
            <form
              className="border-t border-[var(--stroke)] p-2"
              onSubmit={(event) => {
                event.preventDefault();
                const text = draft.trim();
                if (!text || busy) return;
                setDraft("");
                speak(text);
              }}
            >
              <input
                ref={replyRef}
                autoFocus
                value={draft}
                onChange={(event) => {
                  typedAt.current = Date.now();
                  setDraft(event.target.value);
                }}
                placeholder={ready ? "Talk to me" : "Connect a wallet to talk"}
                className="h-10 w-full bg-transparent px-2 text-[13px] outline-none"
              />
            </form>
          </div>
        )}
      </div>
      <div className={`relative ${ping ? "avatar-nudge" : ""}`} style={{ width: PORTRAIT_W, height: PORTRAIT_H }}>
        <button
          type="button"
          aria-label="Avatar"
          className="block h-full w-full cursor-grab touch-none overflow-hidden rounded-[32px] shadow-lg active:cursor-grabbing"
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            dragRef.current = { x: event.clientX, y: event.clientY, originX: pos.x, originY: pos.y, moved: false };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag) return;
            const dx = event.clientX - drag.x;
            const dy = event.clientY - drag.y;
            if (!drag.moved && Math.hypot(dx, dy) < 5) return;
            drag.moved = true;
            const next = clampPos(drag.originX + dx, drag.originY + dy);
            drag.next = next;
            setPos(next);
          }}
          onPointerUp={() => {
            const drag = dragRef.current;
            dragRef.current = null;
            if (!drag?.moved || !drag.next) return;
            suppressClick.current = true;
            try {
              localStorage.setItem(POS_KEY, JSON.stringify(drag.next));
            } catch {
              /* ignore */
            }
          }}
          onClick={() => {
            if (suppressClick.current) {
              suppressClick.current = false;
              return;
            }
            if (!busy) setTalking((value) => !value);
          }}
        >
          <img
            src={portrait}
            alt=""
            width={871}
            height={993}
            draggable={false}
            className="pointer-events-none h-full w-full object-cover"
          />
        </button>
        <span
          className="pointer-events-none absolute -bottom-1 left-1.5 z-10 h-5 w-5 rounded-full border-0"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${statusTone.hi}, ${statusTone.lo} 72%)`,
            boxShadow: `0 0 6px 1px ${statusTone.glow}, 0 0 14px 3px ${statusTone.glow}`,
          }}
          title={statusLabel}
          aria-label={statusLabel}
        />
      </div>
    </div>
  );
}
