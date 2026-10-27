import { useEffect, useRef, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { AVATAR_MOODS, AVATAR_STYLES, loadAvatar, saveAvatar, speakingMood } from "../avatarLook.js";
import { sendTurn } from "../glmChat.js";
import AvatarPortrait from "./AvatarPortrait.jsx";

const CHAT_KEY = "root-web-avatar-conversation";

export default function AvatarOverlay({ open, onClose, view, projectLabel }) {
  const { open: openWallet } = useAppKit();
  const { address, isConnected } = useAccount();
  const [look, setLook] = useState(loadAvatar);
  const [panel, setPanel] = useState("");
  const [draft, setDraft] = useState("");
  const [line, setLine] = useState("");
  const [busy, setBusy] = useState(false);
  const [watching, setWatching] = useState(false);
  const lookRef = useRef(look);
  lookRef.current = look;

  useEffect(() => {
    saveAvatar(look);
  }, [look]);

  const speak = async (text, { watch = false } = {}) => {
    const current = lookRef.current;
    const said = String(text || "").trim();
    if (!said || busy) return;
    if (!isConnected || !address) {
      setLine("Connect a wallet and I can talk.");
      openWallet({ view: "Connect" });
      return;
    }
    setBusy(true);
    setLook((prev) => ({ ...prev, mood: speakingMood() }));
    setLine(watch ? "Looking…" : "…");
    try {
      let conversationId = "";
      try {
        conversationId = localStorage.getItem(CHAT_KEY) || "";
      } catch {
        conversationId = "";
      }
      const name = current.name.trim() || "Avatar";
      const cue = watch
        ? `The person is on the ${view || "home"} screen${projectLabel ? `, repository ${projectLabel}` : ""}. ${said}`
        : said;
      const result = await sendTurn(address, {
        conversationId,
        projectId: "__avatar__",
        projectLabel: name,
        projectRemote: "",
        title: name,
        mode: "ask",
        text:
          `You are ${name}, a companion sitting in the corner of this app. ` +
          `Look: ${current.style}, ${current.hair}, ${current.eyes}, ${current.outfit}, vibe ${current.vibe}. ${current.notes} ` +
          "Reply in one or two short spoken sentences. No markdown, no lists, no tools.\n" +
          cue,
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
      setLine(String(result.text || "").replace(/\s+/g, " ").trim() || "I lost that one.");
    } catch (error) {
      setLine(error.message || "I could not answer.");
    } finally {
      setBusy(false);
      setLook((prev) => ({ ...prev, mood: "neutral" }));
    }
  };

  const speakRef = useRef(speak);
  speakRef.current = speak;

  useEffect(() => {
    if (!open || !watching) return undefined;
    const moods = ["pleased", "focused", "alert", "thinking"];
    const spin = setInterval(() => {
      setLook((prev) => ({ ...prev, mood: moods[Math.floor(Math.random() * moods.length)] }));
    }, 3000);
    const glance = setInterval(() => {
      speakRef.current("Say one short observation about where they are in the app. Do not invent files or tasks.", { watch: true });
    }, 28000);
    return () => {
      clearInterval(spin);
      clearInterval(glance);
    };
  }, [open, watching]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed bottom-[92px] right-3 z-[70] flex flex-col items-end gap-2 md:bottom-6 md:right-6">
      {panel === "look" && (
        <form
          className="pointer-events-auto frost-panel w-[min(320px,calc(100vw-1.5rem))] rounded-2xl border border-[var(--stroke)] p-3 text-left shadow-lg"
          onSubmit={(event) => {
            event.preventDefault();
            setPanel("");
          }}
        >
          <div className="mb-2 text-[13px]">Look</div>
          <label className="mb-2 block text-[11px] text-[var(--faint)]">
            Name
            <input
              value={look.name}
              onChange={(event) => {
                const name = event.target.value.slice(0, 32);
                setLook((prev) => ({ ...prev, name }));
              }}
              className="mt-1 h-9 w-full rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-2 text-[13px] text-[var(--ink)] outline-none"
            />
          </label>
          <div className="mb-2 flex flex-wrap gap-1">
            {AVATAR_STYLES.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setLook((prev) => ({ ...prev, style }))}
                className={`h-8 rounded-lg border px-2 text-[11px] ${
                  look.style === style ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--stroke)] text-[var(--muted)]"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
          <LookField label="Hair" value={look.hair} onChange={(hair) => setLook((prev) => ({ ...prev, hair }))} />
          <LookField label="Eyes" value={look.eyes} onChange={(eyes) => setLook((prev) => ({ ...prev, eyes }))} />
          <LookField label="Outfit" value={look.outfit} onChange={(outfit) => setLook((prev) => ({ ...prev, outfit }))} />
          <LookField label="Vibe" value={look.vibe} onChange={(vibe) => setLook((prev) => ({ ...prev, vibe }))} />
          <LookField label="Notes" value={look.notes} onChange={(notes) => setLook((prev) => ({ ...prev, notes }))} />
          <div className="mb-2 flex flex-wrap gap-1">
            {AVATAR_MOODS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setLook((prev) => ({ ...prev, mood: id }))}
                className={`h-8 rounded-lg border px-2 text-[11px] ${
                  look.mood === id ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--stroke)] text-[var(--muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="submit" className="h-8 rounded-lg bg-[var(--accent)] px-3 text-[12px] text-[var(--bg)]">
            Done
          </button>
        </form>
      )}
      {panel === "talk" && (
        <form
          className="pointer-events-auto frost-panel w-[min(280px,calc(100vw-1.5rem))] rounded-2xl border border-[var(--stroke)] p-2"
          onSubmit={(event) => {
            event.preventDefault();
            const text = draft.trim();
            if (!text) return;
            setDraft("");
            setPanel("");
            speak(text);
          }}
        >
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={isConnected ? `Talk to ${look.name || "Avatar"}` : "Connect a wallet to talk"}
            className="h-10 w-full bg-transparent px-2 text-[13px] outline-none"
          />
        </form>
      )}
      {line && (
        <div className="pointer-events-auto max-w-[260px] rounded-2xl border border-[var(--stroke)] bg-[var(--panel)] px-3 py-2 text-left text-[13px] leading-5 text-[var(--ink)] shadow-lg">
          {line}
        </div>
      )}
      <div className="pointer-events-auto flex items-end gap-2">
        <div className="mb-2 flex flex-col gap-1">
          <Mini label="Look" onClick={() => setPanel((value) => (value === "look" ? "" : "look"))} />
          <Mini label={watching ? "Watching" : "Watch"} onClick={() => setWatching((value) => !value)} />
          <Mini label="Talk" onClick={() => setPanel((value) => (value === "talk" ? "" : "talk"))} />
          <Mini label="Hide" onClick={onClose} />
        </div>
        <button type="button" onClick={() => setPanel((value) => (value === "talk" ? "" : "talk"))} className="rounded-full shadow-lg" aria-label={look.name || "Avatar"}>
          <AvatarPortrait look={look} />
          <div className="mt-1 text-center text-[11px] text-[var(--ink)]">{look.name || "Avatar"}</div>
        </button>
      </div>
    </div>
  );
}

function LookField({ label, value, onChange }) {
  return (
    <label className="mb-2 block text-[11px] text-[var(--faint)]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, 80))}
        className="mt-1 h-9 w-full rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-2 text-[13px] text-[var(--ink)] outline-none"
      />
    </label>
  );
}

function Mini({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 rounded-lg border border-[var(--stroke)] bg-[var(--panel)] px-2 text-[11px] text-[var(--ink)] hover:bg-[var(--hover)]"
    >
      {label}
    </button>
  );
}
