import { useCallback, useEffect, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useSignMessage } from "wagmi";
import { useAppState } from "../../AppState.jsx";
import {
  OPS_PANELS,
  acceptOpsSession,
  hubCloneUrl,
  hubRepoUrl,
  opsFetch,
  reposForWallet,
  signOpsSession,
  writeOpsSession,
} from "../../opsApi.js";
import { shortenAddress } from "../../web3/config.js";
import { Card, Field, Ghost, Page, Primary, Section } from "../ui.jsx";

export default function PluginsView({ token: boundToken = "", onToken }) {
  const { notice } = useAppState();
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [token, setToken] = useState(boundToken);
  const [apps, setApps] = useState([]);
  const [orders, setOrders] = useState([]);
  const [repos, setRepos] = useState([]);
  const [error, setError] = useState("");
  const [step, setStep] = useState(null);
  const [code, setCode] = useState("");
  const [signing, setSigning] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setToken(boundToken || "");
  }, [boundToken]);

  const remember = (next) => {
    if (!next) writeOpsSession("", "");
    setToken(next || "");
    onToken?.(next || "");
  };

  const load = useCallback(async (session) => {
    if (!session) {
      setApps([]);
      setOrders([]);
      setRepos([]);
      return;
    }
    try {
      const [appData, orderData, repoData] = await Promise.all([
        opsFetch("/api/apps", { token: session }),
        opsFetch("/api/domains/orders", { token: session }),
        opsFetch("/api/hub/repos", { token: session }),
      ]);
      setApps(appData.apps || []);
      setOrders(orderData.orders || []);
      if (!address) return;
      setRepos(reposForWallet(repoData.repos, address).filter((item) => item.space === "yours"));
      setError("");
    } catch (err) {
      if (err.status === 401) {
        writeOpsSession("", "");
        setToken("");
        onToken?.("");
        setError("The Ops session expired. Sign in again.");
        return;
      }
      setError(err.message);
    }
  }, [onToken, address]);

  useEffect(() => {
    load(token);
  }, [token, load]);

  const signIn = async () => {
    if (!address) {
      open({ view: "Connect" });
      return;
    }
    setSigning(true);
    setError("");
    try {
      const next = await signOpsSession(address, signMessageAsync);
      if (next?.challenge) {
        setStep(next);
        setCode("");
        notice(next.step === "enroll" ? "Add the Ops authenticator, then enter the code." : "Enter the Ops authenticator code.");
        return;
      }
      remember(next.token);
      setStep(null);
      notice("Signed in to Ops.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSigning(false);
    }
  };

  const submitCode = async () => {
    if (!step?.challenge) return;
    setSigning(true);
    setError("");
    try {
      const session = await opsFetch("/api/auth/factor", {
        method: "POST",
        body: { challenge: step.challenge, code: code.trim() },
      });
      remember(await acceptOpsSession(address, session));
      setStep(null);
      setCode("");
      notice("Signed in to Ops.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSigning(false);
    }
  };

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 2) {
      notice("Type at least two characters.");
      return;
    }
    setSearching(true);
    try {
      setSearch(await opsFetch(`/api/domains/search?q=${encodeURIComponent(q)}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const hosting = OPS_PANELS[0];
  const domains = OPS_PANELS[1];
  const hub = OPS_PANELS[2];

  return (
    <Page wide>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[22px]">Plugins</div>
          <p className="mt-1 text-[13px] text-[var(--muted)]">
            Hosting, domains, and Ops Hub for {address ? shortenAddress(address) : "this wallet"}.
          </p>
        </div>
        {token ? (
          <Ghost
            onClick={() => {
              remember("");
              setStep(null);
              notice("Signed out of Ops on this page.");
            }}
          >
            Sign out
          </Ghost>
        ) : (
          <Primary onClick={signIn}>{signing ? "Waiting…" : isConnected ? "Sign in" : "Connect wallet"}</Primary>
        )}
      </div>

      {error && <p className="mb-4 text-[13px] text-[var(--rose)]">{error}</p>}

      {step && (
        <Card className="mb-4 space-y-3 p-4">
          <div className="text-[12.5px] leading-5 text-[var(--muted)]">
            {step.step === "enroll"
              ? "First sign-in for this address. Add the secret in an authenticator, then enter the code."
              : "Enter the current code from the Ops authenticator."}
          </div>
          {step.step === "enroll" && step.secret && <div className="text-[13px]">{step.secret}</div>}
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-40">
              <Field label="Code" value={code} onChange={setCode} placeholder="123456" />
            </div>
            <Primary onClick={submitCode}>{signing ? "Checking…" : "Confirm"}</Primary>
          </div>
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <PanelLink panel={hosting} />
        <PanelLink panel={domains} />
        <PanelLink panel={hub} />
      </div>

      <Section title="Hosting">
        <PanelHead panel={hosting} />
        {apps.length === 0 ? (
          <Card className="px-4 py-3 text-[13px] text-[var(--muted)]">
            {token ? "This address has no sites yet." : "Sign in to load the sites for this wallet."}
          </Card>
        ) : (
          <div className="space-y-2">
            {apps.map((site) => (
              <Card key={site.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="text-[14px]">{site.name}</div>
                  <div className="text-[11px] text-[var(--muted)]">
                    {site.status}
                    {site.source ? ` · ${site.source}` : ""}
                  </div>
                </div>
                {site.url && (
                  <a href={site.url} target="_blank" rel="noreferrer" className="text-[12.5px] underline">
                    Open
                  </a>
                )}
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Domains">
        <PanelHead panel={domains} />
        <Card className="mb-2 space-y-3 p-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[180px] flex-1">
              <Field label="Search" value={query} onChange={setQuery} placeholder="name or name.com" />
            </div>
            <Ghost onClick={runSearch}>{searching ? "Searching…" : "Search"}</Ghost>
          </div>
          {search && (
            <div className="space-y-1">
              {(search.results || []).map((item) => (
                <div key={item.domain} className="flex items-center justify-between gap-3 text-[13px]">
                  <span>{item.domain}</span>
                  <span className={item.available ? "text-[var(--green)]" : "text-[var(--muted)]"}>
                    {item.available ? `${item.usdc} USDC` : "Taken"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
        {orders.length === 0 ? (
          <Card className="px-4 py-3 text-[13px] text-[var(--muted)]">
            {token ? "No domains on this address yet." : "Sign in to load domains for this wallet."}
          </Card>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <Card key={order.id} className="px-4 py-3">
                <div className="text-[13px]">{order.domain}</div>
                <div className="text-[11px] text-[var(--muted)]">
                  {order.status} · {order.usdc} USDC
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Ops Hub">
        <PanelHead panel={hub} />
        {repos.length === 0 ? (
          <Card className="px-4 py-3 text-[13px] text-[var(--muted)]">
            {token ? "No repositories for this address yet." : "Sign in to load the git owned by this wallet."}
          </Card>
        ) : (
          <div className="space-y-2">
            {repos.map((repo) => (
              <Card key={`${repo.owner}/${repo.name}`} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <a href={hubRepoUrl(repo.owner, repo.name)} target="_blank" rel="noreferrer" className="text-[13px] underline">
                    {repo.owner}/{repo.name}
                  </a>
                  <div className="truncate text-[11px] text-[var(--muted)]">{repo.about || repo.branch || "main"}</div>
                </div>
                <a href={hubCloneUrl(repo.owner, repo.name)} target="_blank" rel="noreferrer" className="shrink-0 text-[12px] underline">
                  Clone
                </a>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </Page>
  );
}

function PanelLink({ panel }) {
  return (
    <a href={panel.href} target="_blank" rel="noreferrer" className="block">
      <Card className="h-full p-4 hover:bg-[var(--hover)]">
        <div className="text-[15px]">{panel.label}</div>
        <p className="mt-1 text-[12.5px] leading-5 text-[var(--muted)]">{panel.detail}</p>
      </Card>
    </a>
  );
}

function PanelHead({ panel }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <p className="text-[12.5px] text-[var(--muted)]">{panel.detail}</p>
      <a href={panel.href} target="_blank" rel="noreferrer" className="shrink-0 text-[12px] underline">
        Open
      </a>
    </div>
  );
}
