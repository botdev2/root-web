import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useSignMessage } from "wagmi";
import { useAppState } from "../AppState.jsx";
import { acceptOpsSession, opsFetch, publishHubSite, readHubApps, readOpsSession, signOpsSession } from "../opsApi.js";
import { projectFolderName } from "../projectSeed.js";
import { SHIP_KINDS, shipFiles } from "../shipScaffold.js";
import { authenticatorUrl } from "../version.js";
import { GUIDE_SEEN_KEY } from "./FirstRunGuide.jsx";

const STEPS = [
  { id: 1, label: "App" },
  { id: 2, label: "Repo" },
  { id: 3, label: "Live" },
];

function markGuideSeen() {
  try {
    localStorage.setItem(GUIDE_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export default function ShipFlow({ open, onClose, opsToken, onOpsToken, onCreateProject, onOpenOps }) {
  const { completeOnboarding, notice } = useAppState();
  const { address, isConnected } = useAccount();
  const { open: openWallet } = useAppKit();
  const { signMessageAsync } = useSignMessage();
  const [step, setStep] = useState(1);
  const [kindId, setKindId] = useState("landing");
  const [name, setName] = useState("my-site");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [factor, setFactor] = useState(null);
  const [code, setCode] = useState("");
  const [project, setProject] = useState(null);
  const [site, setSite] = useState(null);

  const session = readOpsSession(address);
  const token = opsToken || session;
  const signedIn = !!token;
  const authHref = authenticatorUrl(address);

  useEffect(() => {
    if (open && session && !opsToken) onOpsToken?.(session);
  }, [open, session, opsToken, onOpsToken]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setStatus("");
    setFactor(null);
    setCode("");
    setBusy(false);
    setProject(null);
    setSite(null);
  }, [open]);

  const kind = useMemo(() => SHIP_KINDS.find((item) => item.id === kindId) || SHIP_KINDS[0], [kindId]);
  const checked = projectFolderName(name);

  const close = () => {
    markGuideSeen();
    onClose?.();
  };

  const signIn = async () => {
    if (!isConnected || !address) {
      openWallet({ view: "Connect" });
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const next = await signOpsSession(address, signMessageAsync);
      if (next?.challenge) {
        setFactor(next);
        setCode("");
        setStatus(next.step === "enroll" ? "Add the authenticator on this site, then enter the code." : "Enter the authenticator code.");
        return;
      }
      onOpsToken?.(next.token);
      setFactor(null);
      setStatus("Signed in to Ops.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async () => {
    if (!factor?.challenge) return;
    setBusy(true);
    setStatus("");
    try {
      const next = await opsFetch("/api/auth/factor", {
        method: "POST",
        body: { challenge: factor.challenge, code: code.trim() },
      });
      const bound = await acceptOpsSession(address, next);
      onOpsToken?.(bound);
      setFactor(null);
      setCode("");
      setStatus("Signed in to Ops.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const goApp = () => {
    if (checked.error) {
      setStatus(checked.error);
      return;
    }
    completeOnboarding("skills");
    setStatus("");
    setStep(2);
  };

  const goRepo = async () => {
    if (checked.error) {
      setStatus(checked.error);
      return;
    }
    if (!isConnected || !address) {
      openWallet({ view: "Connect" });
      return;
    }
    if (!signedIn) {
      await signIn();
      return;
    }
    setBusy(true);
    setStatus("Creating the Hub repo and committing the files that compile…");
    try {
      const files = shipFiles(checked.name, kind.id);
      const row = await onCreateProject?.({
        name: checked.name,
        about: `${kind.title} that compiles. Pushed from /root.`,
        files,
      });
      setProject(row || null);
      completeOnboarding("repos");
      setStatus("");
      setStep(3);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  const goLive = async () => {
    if (!signedIn) {
      await signIn();
      return;
    }
    const owner = project?.owner;
    const repo = project?.label || checked.name;
    if (!owner || !repo) {
      setStatus("Create the repository first.");
      setStep(2);
      return;
    }
    setBusy(true);
    setStatus("Ops is compiling the Docker image from that repo…");
    try {
      const data = await publishHubSite({
        token,
        name: repo,
        owner,
        repo,
        branch: project.branch || "main",
      });
      let next = data.app || null;
      setSite(next);
      notice(next?.url ? `Build started. It will be at ${next.url}` : "Build started.");
      const started = Date.now();
      while (Date.now() - started < 180_000) {
        await new Promise((resolve) => window.setTimeout(resolve, 4000));
        const apps = await readHubApps(token);
        const match = apps.find((item) => item.id === next?.id || item.name === repo);
        if (match) {
          next = match;
          setSite(match);
        }
        if (match?.url && String(match.status || "").toLowerCase() === "live") break;
      }
      completeOnboarding("github");
      setStatus(next?.url ? "Live." : "Build started. Open the URL when Ops finishes compiling.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const primary =
    step === 1
      ? { label: "Make this app", run: goApp, disabled: busy || !!checked.error }
      : step === 2
        ? {
            label: busy
              ? "Working…"
              : !isConnected
                ? "Connect wallet"
                : !signedIn
                  ? factor
                    ? "Confirm code"
                    : "Sign in to Ops"
                  : "Connect the repo",
            run: factor ? confirmCode : goRepo,
            disabled: busy,
          }
        : {
            label: busy ? "Compiling…" : site?.url ? "Push again" : "Push live",
            run: goLive,
            disabled: busy,
          };

  return createPortal(
    <div className="guide-backdrop" role="dialog" aria-modal="true" aria-label="Ship a live app" onMouseDown={close}>
      <div className="guide-card ship-card" onMouseDown={(event) => event.stopPropagation()}>
        <div className="text-[10.5px] uppercase tracking-[0.22em] text-[var(--faint)]">From this page</div>
        <h2 className="mt-2 text-[clamp(24px,4vw,32px)] leading-[1.12] tracking-[-0.02em] text-[var(--ink)]">Ship a live app.</h2>
        <p className="mt-3 text-[14px] leading-[1.65] text-[var(--muted)]">
          Three steps. Wallet only. The repo lives on Ops Hub. Ops compiles it. You never log into GitHub or a host dashboard.
        </p>

        <div className="ship-rail" role="tablist" aria-label="Ship steps">
          {STEPS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={step === item.id}
              className={step === item.id ? "on" : step > item.id ? "done" : ""}
              onClick={() => {
                if (item.id < step || (item.id === 3 && project) || (item.id === 2 && !checked.error)) setStep(item.id);
              }}
            >
              <span>{item.id}</span>
              {item.label}
            </button>
          ))}
        </div>

        {step === 1 && (
          <div>
            <label className="block">
              <div className="mb-1.5 text-[11px] text-[var(--faint)]">App name</div>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") goApp();
                }}
                aria-label="App name"
                className="h-11 w-full rounded-xl border border-[var(--stroke)] bg-[var(--input)] px-3 text-[15px] outline-none"
              />
            </label>
            {checked.error && <div className="mt-2 text-[12px] text-[var(--muted)]">{checked.error}</div>}
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {SHIP_KINDS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setKindId(item.id)}
                  className={`rounded-xl border px-3 py-3 text-left ${
                    kindId === item.id ? "border-[var(--accent)] bg-[var(--hover)]" : "border-[var(--stroke)] hover:bg-[var(--hover)]"
                  }`}
                >
                  <div className="text-[14px]">{item.title}</div>
                  <div className="mt-1 text-[12px] leading-5 text-[var(--muted)]">{item.detail}</div>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[12.5px] text-[var(--faint)]">Vite + React + Dockerfile. Ops will compile this. It is not a stub.</p>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-[14px] leading-[1.65] text-[var(--muted)]">
              Creates <span className="text-[var(--ink)]">{checked.name || "the app"}</span> on Ops Hub for this wallet and commits the files that compile.
            </p>
            {!isConnected && <p className="mt-3 text-[13px] text-[var(--muted)]">Connect the wallet. That is the account.</p>}
            {isConnected && !signedIn && !factor && (
              <p className="mt-3 text-[13px] text-[var(--muted)]">Sign a message, then the authenticator on this site. Nothing else to log into.</p>
            )}
            {factor && (
              <div className="mt-3 space-y-2">
                {factor.step === "enroll" && (
                  <p className="text-[12.5px] leading-5 text-[var(--muted)]">
                    Add this secret in the in-app authenticator, then enter the code. {factor.secret}
                  </p>
                )}
                {authHref && (
                  <a href={authHref} className="text-[13px] underline">
                    Open authenticator
                  </a>
                )}
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="h-11 w-full rounded-xl border border-[var(--stroke)] bg-[var(--input)] px-3 text-[15px] outline-none"
                />
              </div>
            )}
            {project?.remote && (
              <p className="mt-3 break-all text-[12px] text-[var(--faint)]">{project.remote}</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="text-[14px] leading-[1.65] text-[var(--muted)]">
              Ops builds the Docker image from <span className="text-[var(--ink)]">{project?.label || checked.name}</span>. Stay here.
            </p>
            {site?.url && (
              <div className="mt-4 rounded-xl border border-[var(--stroke)] bg-[var(--input)] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--faint)]">
                  {String(site.status || "").toLowerCase() === "live" ? "Live" : site.status || "Building"}
                </div>
                <a href={site.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-[15px] underline">
                  {site.url}
                </a>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={primary.run}
            disabled={primary.disabled}
            className="h-10 rounded-xl bg-[var(--accent)] px-5 text-[13.5px] text-[var(--bg)] disabled:opacity-50"
          >
            {primary.label}
          </button>
          {step === 3 && site?.url && (
            <a
              href={site.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-xl border border-[var(--stroke)] px-4 text-[13.5px] text-[var(--ink)] hover:bg-[var(--hover)]"
            >
              Open site
            </a>
          )}
          {step === 3 && (
            <button
              type="button"
              onClick={() => {
                close();
                onOpenOps?.();
              }}
              className="h-10 rounded-xl border border-[var(--stroke)] px-4 text-[13.5px] text-[var(--ink)] hover:bg-[var(--hover)]"
            >
              Ops
            </button>
          )}
          <button type="button" onClick={close} className="h-10 px-3 text-[13.5px] text-[var(--muted)]">
            Later
          </button>
        </div>
        {status && <div className="mt-3 text-[12.5px] leading-5 text-[var(--muted)]">{status}</div>}
      </div>
    </div>,
    document.body,
  );
}
