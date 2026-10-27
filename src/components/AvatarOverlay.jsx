import { useRef, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import portrait from "../assets/avatar.png";
import { sendTurn } from "../glmChat.js";

const CHAT_KEY = "root-web-avatar-conversation";

export default function AvatarOverlay({ open, view, projectLabel }) {
  const { open: openWallet } = useAppKit();
  const { address, isConnected } = useAccount();
  const [talking, setTalking] = useState(false);
  const [draft, setDraft] = useState("");
  const [line, setLine] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

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
      setLine(String(result.text || "").replace(/\s+/g, " ").trim() || "I lost that one.");
    } catch (error) {
      setLine(error.message || "I could not answer.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed bottom-[92px] right-3 z-[70] flex flex-col items-end gap-2 md:bottom-6 md:right-6">
      {talking && (
        <form
          className="pointer-events-auto frost-panel w-[min(260px,calc(100vw-1.5rem))] rounded-2xl border border-[var(--stroke)] p-2"
          onSubmit={(event) => {
            event.preventDefault();
            const text = draft.trim();
            if (!text) return;
            setDraft("");
            setTalking(false);
            speak(text);
          }}
        >
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={isConnected ? "Talk" : "Connect a wallet to talk"}
            className="h-10 w-full bg-transparent px-2 text-[13px] outline-none"
          />
        </form>
      )}
      {line && (
        <div className="pointer-events-auto max-w-[240px] rounded-2xl border border-[var(--stroke)] bg-[var(--panel)] px-3 py-2 text-left text-[13px] leading-5 text-[var(--ink)] shadow-lg">
          {line}
        </div>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => setTalking((value) => !value)}
        className="pointer-events-auto overflow-hidden rounded-2xl shadow-lg disabled:opacity-70"
        aria-label="Avatar"
      >
        <img src={portrait} alt="" width={112} height={112} className="h-28 w-28 object-cover object-top" draggable={false} />
      </button>
    </div>
  );
}
