import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useSignMessage } from "wagmi";
import { desktopSeedFiles, projectFolderName } from "../projectSeed.js";
import { opsFetch, readOpsSession, writeOpsSession } from "../opsApi.js";

export default function AddProjectMenu({ open, token, onToken, onCreate, onTemplates, onClose }) {
  const { address, isConnected } = useAccount();
  const { open: openWallet } = useAppKit();
  const { signMessageAsync } = useSignMessage();
  const [name, setName] = useState("my-project");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(null);
  const [code, setCode] = useState("");
  const [created, setCreated] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

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
      setStatus("Sign in to Ops. The repository is created on the Hub for this wallet.");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const row = await onCreate?.({
        name: checked.name,
        about: "A /root project.",
        files: desktopSeedFiles(checked.name),
      });
      setCreated(row || null);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[color-mix(in_srgb,#000_45%,transparent)] p-4" onMouseDown={onClose}>
      <div
        data-add-project
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-[440px] rounded-[18px] border border-[var(--stroke)] bg-[var(--panel)] p-5 shadow-lg"
      >
        <div className="text-[18px]">New repository</div>
        <p className="mt-1 text-[13px] text-[var(--muted)]">Creates a git repository on the Ops Hub for this wallet.</p>
        {created ? (
          <div className="mt-4 space-y-3">
            <div className="text-[14px]">{created.label} is on the Ops Hub.</div>
            <div className="flex flex-col gap-2 text-[13px]">
              {created.href && (
                <a href={created.href} target="_blank" rel="noreferrer" className="underline">
                  Open {created.label}
                </a>
              )}
              {created.remote && (
                <a href={created.remote} target="_blank" rel="noreferrer" className="break-all text-[var(--muted)] underline">
                  {created.remote}
                </a>
              )}
            </div>
            <button type="button" onClick={onClose} className="h-9 rounded-[10px] bg-[var(--accent)] px-3 text-[13px] text-[var(--bg)]">
              Done
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") createFolder();
              }}
              aria-label="Repository name"
              className="mb-3 h-10 w-full rounded-[10px] border border-[var(--stroke)] bg-[var(--input)] px-3 text-[14px] outline-none"
            />
            {!token && !step && (
              <button type="button" onClick={signIn} disabled={busy} className="mb-3 text-[13px] underline">
                {busy ? "Waiting…" : isConnected ? "Sign in to Ops" : "Connect a wallet"}
              </button>
            )}
            {step && (
              <div className="mb-3 space-y-2">
                {step.step === "enroll" && (
                  <div className="text-[12px] leading-5 text-[var(--muted)]">
                    Add this authenticator secret, then enter the code. {step.secret}
                  </div>
                )}
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="123456"
                  className="h-10 w-full rounded-[10px] border border-[var(--stroke)] bg-[var(--input)] px-3 text-[14px] outline-none"
                />
                <button type="button" onClick={confirmCode} disabled={busy} className="text-[13px] underline">
                  {busy ? "Checking…" : "Confirm code"}
                </button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={createFolder}
                disabled={busy}
                className="h-9 rounded-[10px] bg-[var(--accent)] px-3 text-[13px] text-[var(--bg)] disabled:opacity-50"
              >
                {busy ? "Creating…" : "Create on Ops Hub"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onTemplates?.();
                }}
                className="text-[13px] text-[var(--muted)] underline"
              >
                Create from Template
              </button>
            </div>
            {status && <div className="mt-3 text-[12.5px] text-[var(--muted)]">{status}</div>}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
