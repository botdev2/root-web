import { useEffect, useRef, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import portrait from "../assets/avatar.png";
import { sendTurn } from "../glmChat.js";

const CHAT_KEY = "root-web-avatar-conversation";
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

export default function AvatarOverlay({ open, view, projectLabel, onTour, hidden = false }) {
  const { open: openWallet } = useAppKit();
  const { address, isConnected } = useAccount();
  const [talking, setTalking] = useState(false);
  const [draft, setDraft] = useState("");
  const [line, setLine] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && navigator.onLine === false);
  const [failed, setFailed] = useState(false);
  const [pos, setPos] = useState(initialPos);
  const busyRef = useRef(false);
  const dragRef = useRef(null);
  const suppressClick = useRef(false);
  const replyRef = useRef(null);

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

  const status = offline || failed ? "red" : isConnected && address ? "green" : "yellow";
  const statusLabel = status === "green" ? "Available" : status === "red" ? "Unavailable" : "Standard";
  const statusTone =
    status === "green"
      ? { hi: "#8eecc0", lo: "#2ea85c", glow: "rgba(60,186,106,0.85)" }
      : status === "red"
        ? { hi: "#ffb4b4", lo: "#d63a3a", glow: "rgba(226,75,75,0.8)" }
        : { hi: "#ffe58a", lo: "#e2b30e", glow: "rgba(240,196,25,0.85)" };

  const speak = async (text) => {
    const said = String(text || "").trim();
    if (!said || busyRef.current) return;
    if (!isConnected || !address) {
      setLine("Connect a wallet and I can talk.");
      openWallet({ view: "Connect" });
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setLine("…");
    try {
      let conversationId = "";
      try {
        conversationId = localStorage.getItem(CHAT_KEY) || "";
      } catch {
        conversationId = "";
      }
      const where = `The person is on the ${view || "home"} screen${projectLabel ? `, repository ${projectLabel}` : ""}.`;
      const result = await sendTurn(address, {
        conversationId,
        projectId: "__avatar__",
        projectLabel: "Avatar",
        projectRemote: "",
        title: "Avatar",
        mode: "ask",
        text:
          "You are the companion in the corner of this app. " +
          "Reply in one or two short spoken sentences. No markdown, no lists, no tools.\n" +
          `${where} ${said}`,
        brain: {},
        files: "",
        autoprompt: false,
      });
      const id = result.conversation?.id || "";
      if (id) {
        try {
          localStorage.setItem(CHAT_KEY, id);
        } catch {
          /* ignore */
        }
      }
      setFailed(false);
      setLine(String(result.text || "").replace(/\s+/g, " ").trim() || "I lost that one.");
    } catch (error) {
      setFailed(true);
      setLine(error.message || "I could not answer.");
    } finally {
      busyRef.current = false;
      setBusy(false);
      setTalking(true);
      requestAnimationFrame(() => replyRef.current?.focus());
    }
  };

  if (!open || hidden) return null;

  const bubbleAbove = pos.y > 96;

  return (
    <div className="fixed z-[70]" style={{ left: pos.x, top: pos.y, width: PORTRAIT_W }}>
      <div
        className={`pointer-events-none absolute right-0 flex w-max max-w-[240px] flex-col items-end gap-2 ${
          bubbleAbove ? "bottom-full mb-2" : "top-full mt-2"
        }`}
      >
        {line && (
          <div className="pointer-events-auto max-w-[240px] rounded-2xl border border-[var(--stroke)] bg-[var(--panel)] px-3 py-2 text-left text-[13px] leading-5 text-[var(--ink)] shadow-lg">
            {line}
          </div>
        )}
        {talking && !line && onTour && (
          <div className="pointer-events-auto max-w-[240px] rounded-2xl border border-[var(--stroke)] bg-[var(--panel)] px-3 py-2.5 text-left text-[13px] leading-5 text-[var(--ink)] shadow-lg">
            <div>Want a guided tour? I'll show you around and help you ship your first commit.</div>
            <button
              type="button"
              onClick={() => {
                setTalking(false);
                onTour();
              }}
              className="mt-2 h-9 w-full rounded-lg bg-[var(--accent)] text-[12.5px] text-[var(--bg)]"
            >
              Start the tour
            </button>
          </div>
        )}
        {(talking || line) && (
          <form
            className="pointer-events-auto frost-panel w-[min(240px,calc(100vw-1.5rem))] rounded-2xl border border-[var(--stroke)] p-2"
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
              onChange={(event) => setDraft(event.target.value)}
              placeholder={isConnected ? "Reply" : "Connect a wallet to talk"}
              className="h-10 w-full bg-transparent px-2 text-[13px] outline-none"
            />
          </form>
        )}
      </div>
      <div className="relative" style={{ width: PORTRAIT_W, height: PORTRAIT_H }}>
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
