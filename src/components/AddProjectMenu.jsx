import { useEffect, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useSignMessage } from "wagmi";
import { desktopSeedFiles, projectFolderName } from "../projectSeed.js";
import { opsFetch, readOpsSession, writeOpsSession } from "../opsApi.js";

export default function AddProjectMenu({ open, token, onToken, recents = [], onCreate, onTemplates, onClose }) {
  const { address, isConnected } = useAccount();
  const { open: openWallet } = useAppKit();
  const { signMessageAsync } = useSignMessage();
  const [query, setQuery] = useState("");
  const [name, setName] = useState("my-project");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.target?.closest?.("[data-add-project]")) return;
      onClose?.();
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open, onClose]);

  if (!open) return null;

  const needle = query.trim().toLowerCase();
  const shown = recents.filter((item) => !needle || String(item.label || "").toLowerCase().includes(needle)).slice(0, 4);

  const signIn = async () => {
    if (!isConnected || !address) {
      openWallet({ view: "Connect" });
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const nonce = await opsFetch("/api/auth/nonce", { method: "POST", body: { address, client: "ops" } });
      const signature = await signMessageAsync({ message: nonce.message });
      const next = await opsFetch("/api/auth/verify", { method: "POST", body: { address, signature } });
      setStep(next);
      setCode("");
      setStatus(next.step === "enroll" ? "Add the Ops authenticator, then enter the code." : "Enter the Ops authenticator code.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async () => {
    if (!step?.challenge) return;
    setBusy(true);
    setStatus("");
    try {
      const session = await opsFetch("/api/auth/factor", {
        method: "POST",
        body: { challenge: step.challenge, code: code.trim() },
      });
      writeOpsSession(session.token);
      onToken?.(session.token);
      setStep(null);
      setCode("");
      setStatus("Signed in to Ops.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const createFolder = async () => {
    const checked = projectFolderName(name);
    if (checked.error) {
      setStatus(checked.error);
      return;
    }
    const session = token || readOpsSession();
    if (!session) {
      setStatus("Sign in to Ops. The folder is created on the Hub for this wallet.");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      await onCreate?.({
        name: checked.name,
        about: "A /root project.",
        files: desktopSeedFiles(checked.name),
      });
      onClose?.();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-add-project
      className="absolute right-0 top-9 z-40 w-[300px] rounded-[14px] border border-[var(--stroke)] bg-[var(--panel)] p-3 shadow-lg"
    >
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search folders, repos..."
        className="mb-2 h-9 w-full rounded-[10px] border border-[var(--stroke)] bg-[var(--input)] px-3 text-[13px] outline-none"
      />
      <div className="mb-1 px-1 text-[11px] text-[var(--faint)]">Recents</div>
      {shown.length === 0 && <div className="px-1 pb-2 text-[12px] text-[var(--muted)]">No recent folders yet.</div>}
      {shown.map((item) => (
        <div key={item.id} className="truncate px-1 py-1 text-[12.5px]">
          {item.label}
        </div>
      ))}
      <div className="mb-1 mt-2 px-1 text-[11px] text-[var(--faint)]">Repos</div>
      <button
        type="button"
        onClick={() => {
          onClose?.();
          onTemplates?.();
        }}
        className="flex w-full flex-col rounded-[10px] px-2 py-1.5 text-left hover:bg-[var(--hover)]"
      >
        <span className="text-[13px]">Create from Template</span>
        <span className="text-[11px] text-[var(--muted)]">Astro, React, APIs, and more</span>
      </button>
      <div className="mb-1 mt-2 px-1 text-[11px] text-[var(--faint)]">New Folder</div>
      <div className="px-1">
        <div className="mb-1 text-[11px] text-[var(--muted)]">Created on the Ops Hub for this wallet</div>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") createFolder();
          }}
          className="mb-2 h-9 w-full rounded-[10px] border border-[var(--stroke)] bg-[var(--input)] px-3 text-[13px] outline-none"
        />
        {!token && !step && (
          <button type="button" onClick={signIn} disabled={busy} className="mb-2 text-[12.5px] underline">
            {busy ? "Waiting…" : isConnected ? "Sign in to Ops" : "Connect a wallet"}
          </button>
        )}
        {step && (
          <div className="mb-2 space-y-1">
            {step.step === "enroll" && (
              <div className="text-[11px] leading-4 text-[var(--muted)]">
                Add this authenticator secret, then enter the code. {step.secret}
              </div>
            )}
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="123456"
              className="h-9 w-full rounded-[10px] border border-[var(--stroke)] bg-[var(--input)] px-3 text-[13px] outline-none"
            />
            <button type="button" onClick={confirmCode} disabled={busy} className="text-[12.5px] underline">
              {busy ? "Checking…" : "Confirm code"}
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={createFolder}
          disabled={busy}
          className="h-9 rounded-[10px] bg-[var(--accent)] px-3 text-[13px] text-[var(--bg)] disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create folder"}
        </button>
        {status && <div className="mt-2 text-[12px] text-[var(--muted)]">{status}</div>}
      </div>
    </div>
  );
}
