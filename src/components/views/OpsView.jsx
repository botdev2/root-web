import { useCallback, useEffect, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useSignMessage } from "wagmi";
import { useAppState } from "../../AppState.jsx";
import {
  OPS_LINKS,
  hubCloneUrl,
  hubRepoUrl,
  opsFetch,
  readOpsSession,
  writeOpsSession,
} from "../../opsApi.js";
import { shortenAddress } from "../../web3/config.js";
import { Card, Field, Ghost, Page, Primary, Row, Section } from "../ui.jsx";

const PACKS = [
  { id: "nixpacks", label: "Nixpacks" },
  { id: "dockerfile", label: "Dockerfile" },
  { id: "static", label: "Static" },
  { id: "dist", label: "Dist folder" },
];

export default function OpsView() {
  const { notice } = useAppState();
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [token, setToken] = useState(() => readOpsSession());
  const [health, setHealth] = useState(null);
  const [apps, setApps] = useState([]);
  const [orders, setOrders] = useState([]);
  const [repos, setRepos] = useState([]);
  const [billing, setBilling] = useState(null);
  const [accountError, setAccountError] = useState("");
  const [step, setStep] = useState(null);
  const [code, setCode] = useState("");
  const [signing, setSigning] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState(null);
  const [searching, setSearching] = useState(false);
  const [name, setName] = useState("");
  const [repository, setRepository] = useState("");
  const [branch, setBranch] = useState("main");
  const [pack, setPack] = useState("nixpacks");
  const [githubToken, setGithubToken] = useState("");
  const [githubRepos, setGithubRepos] = useState([]);
  const [publishing, setPublishing] = useState(false);

  const loadPublic = useCallback(async () => {
    try {
      setHealth(await opsFetch("/api/health"));
    } catch (error) {
      setHealth({ ok: false, error: error.message });
    }
  }, []);

  const loadAccount = useCallback(async (session) => {
    if (!session) {
      setApps([]);
      setOrders([]);
      setRepos([]);
      setBilling(null);
      return;
    }
    try {
      const [appData, orderData, repoData, billData] = await Promise.all([
        opsFetch("/api/apps", { token: session }),
        opsFetch("/api/domains/orders", { token: session }),
        opsFetch("/api/hub/repos", { token: session }),
        opsFetch("/api/billing", { token: session }),
      ]);
      setApps(appData.apps || []);
      setOrders(orderData.orders || []);
      setRepos(repoData.repos || []);
      setBilling(billData);
      setAccountError("");
    } catch (error) {
      if (error.status === 401) {
        writeOpsSession("");
        setToken("");
        setAccountError("The Ops session expired. Sign in again.");
        return;
      }
      setAccountError(error.message);
    }
  }, []);

  useEffect(() => {
    loadPublic();
    const timer = setInterval(loadPublic, 10000);
    return () => clearInterval(timer);
  }, [loadPublic]);

  useEffect(() => {
    loadAccount(token);
    if (!token) return undefined;
    const timer = setInterval(() => loadAccount(token), 10000);
    return () => clearInterval(timer);
  }, [token, loadAccount]);

  const signIn = async () => {
    if (!address) {
      open({ view: "Connect" });
      return;
    }
    setSigning(true);
    setAccountError("");
    try {
      const nonce = await opsFetch("/api/auth/nonce", { method: "POST", body: { address, client: "ops" } });
      const signature = await signMessageAsync({ message: nonce.message });
      const next = await opsFetch("/api/auth/verify", { method: "POST", body: { address, signature } });
      setStep(next);
      setCode("");
      notice(next.step === "enroll" ? "Add the Ops authenticator, then enter the code." : "Enter the Ops authenticator code.");
    } catch (error) {
      setAccountError(error.message);
    } finally {
      setSigning(false);
    }
  };

  const submitCode = async () => {
    if (!step?.challenge) return;
    setSigning(true);
    setAccountError("");
    try {
      const session = await opsFetch("/api/auth/factor", {
        method: "POST",
        body: { challenge: step.challenge, code: code.trim() },
      });
      writeOpsSession(session.token);
      setToken(session.token);
      setStep(null);
      setCode("");
      notice("Signed in to Ops.");
    } catch (error) {
      setAccountError(error.message);
    } finally {
      setSigning(false);
    }
  };

  const signOut = () => {
    writeOpsSession("");
    setToken("");
    setStep(null);
    setGithubToken("");
    setGithubRepos([]);
    notice("Signed out of Ops on this page.");
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
    } catch (error) {
      setAccountError(error.message);
    } finally {
      setSearching(false);
    }
  };

  const readGithub = async () => {
    if (!token) {
      notice("Sign in to Ops first.");
      return;
    }
    setPublishing(true);
    try {
      const data = await opsFetch("/api/github/repos", { token, method: "POST", body: { token: githubToken.trim() } });
      setGithubRepos(data.repos || []);
      notice(`${(data.repos || []).length} repositories visible to that token.`);
    } catch (error) {
      setAccountError(error.message);
    } finally {
      setPublishing(false);
    }
  };

  const publish = async () => {
    if (!token) {
      notice("Sign in to Ops first.");
      return;
    }
    const label = name.trim();
    if (label.length < 2) {
      notice("Name the site with at least 2 characters.");
      return;
    }
    setPublishing(true);
    setAccountError("");
    try {
      const data = await opsFetch("/api/apps", {
        token,
        method: "POST",
        body: {
          source: "github",
          name: label,
          repository: repository.trim(),
          branch: branch.trim() || "main",
          port: pack === "dist" ? "80" : "3000",
          buildPack: pack,
          token: githubToken.trim(),
          autoDeploy: true,
        },
      });
      setGithubToken("");
      setName("");
      setRepository("");
      notice(data.app?.url ? `Build started. It will be at ${data.app.url}` : "Build started.");
      await loadAccount(token);
    } catch (error) {
      setAccountError(error.message);
    } finally {
      setPublishing(false);
    }
  };

  const redeploy = async (site) => {
    setAccountError("");
    try {
      await opsFetch(`/api/apps/${site.id}/redeploy`, { token, method: "POST" });
      notice(`${site.name} is publishing again.`);
      await loadAccount(token);
    } catch (error) {
      setAccountError(error.message);
    }
  };

  const yours = repos.filter((item) => item.space === "yours");
  const shared = repos.filter((item) => item.space !== "yours");

  return (
    <Page wide>
      <div className="mb-4 flex flex-wrap gap-2">
        {OPS_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center rounded-lg border border-[var(--stroke)] px-3 text-[12.5px] hover:bg-[var(--hover)]"
          >
            {link.label}
          </a>
        ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-[11px] text-[var(--faint)]">Hosting</div>
          <div className={`mt-1 text-[18px] ${health?.ok ? "text-[var(--green)]" : "text-[var(--rose)]"}`}>
            {health == null ? "Checking" : health.ok ? "Online" : "Offline"}
          </div>
          <p className="mt-1 text-[12px] text-[var(--muted)]">Live probe of /api/health every 10 seconds.</p>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] text-[var(--faint)]">Wallet</div>
          <div className="mt-1 text-[18px]">{address ? shortenAddress(address) : "Not connected"}</div>
          <p className="mt-1 text-[12px] text-[var(--muted)]">The same address owns the sites, the domains, and the Hub git.</p>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] text-[var(--faint)]">Plan</div>
          <div className="mt-1 text-[18px]">{planLine(billing)}</div>
          <p className="mt-1 text-[12px] text-[var(--muted)]">48 hours free, then Plot, Grove, or Canopy. Paid on Ops.</p>
        </Card>
      </div>

      {accountError && <p className="mb-4 text-[13px] text-[var(--rose)]">{accountError}</p>}

      <Section title="Account">
        <Card>
          <Row label="Ops session" value={token ? "Signed in on this page" : "Signature, then the authenticator code"}>
            {token ? (
              <Ghost onClick={signOut}>Sign out</Ghost>
            ) : (
              <Primary onClick={signIn}>{signing ? "Waiting…" : isConnected ? "Sign in" : "Connect wallet"}</Primary>
            )}
          </Row>
          {step && (
            <div className="space-y-3 px-4 py-3">
              {step.step === "enroll" && (
                <div className="text-[12.5px] leading-5 text-[var(--muted)]">
                  First sign-in for this address. Add this secret in an authenticator
                  {step.otpauth ? (
                    <>
                      {" "}
                      or <a className="text-[var(--ink)] underline" href={step.otpauth}>open the otpauth link</a>
                    </>
                  ) : null}
                  . Secret: <span className="text-[var(--ink)]">{step.secret}</span>
                </div>
              )}
              {step.step === "code" && (
                <div className="text-[12.5px] text-[var(--muted)]">Enter the current code from the Ops authenticator.</div>
              )}
              <div className="flex flex-wrap items-end gap-2">
                <div className="w-40">
                  <Field label="Code" value={code} onChange={setCode} placeholder="123456" />
                </div>
                <Primary onClick={submitCode}>{signing ? "Checking…" : "Confirm"}</Primary>
              </div>
            </div>
          )}
        </Card>
      </Section>

      <Section title="Your sites">
        {apps.length === 0 ? (
          <Card className="px-4 py-3 text-[13px] text-[var(--muted)]">
            {token ? "This address has no sites yet." : "Sign in to load the sites for this wallet."}
          </Card>
        ) : (
          <div className="space-y-2">
            {apps.map((site) => (
              <Card key={site.id} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px]">{site.name}</div>
                    <div className={`text-[11px] ${site.status === "Live" ? "text-[var(--green)]" : "text-[var(--muted)]"}`}>
                      {site.status} · {site.source}
                      {site.branch ? ` · ${site.branch}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {site.url && (
                      <a href={site.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center text-[12.5px] underline">
                        Open
                      </a>
                    )}
                    {site.repository && (
                      <a
                        href={`https://github.com/${site.repository}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center text-[12.5px] underline"
                      >
                        {site.repository}
                      </a>
                    )}
                    {token && <Ghost onClick={() => redeploy(site)}>Redeploy</Ghost>}
                  </div>
                </div>
                {site.domains?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
                    {site.domains.map((item) => (
                      <a key={item.host} href={item.url} target="_blank" rel="noreferrer" className="underline">
                        {item.host}
                      </a>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Publish a GitHub repository">
        <Card className="space-y-3 p-4">
          <p className="text-[12.5px] leading-5 text-[var(--muted)]">
            A personal access token is sent once so Ops can install a read-only deploy key. The token is not stored here or on Ops.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Site name" value={name} onChange={setName} placeholder="landing" />
            <Field label="Repository" value={repository} onChange={setRepository} placeholder="owner/name" />
            <Field label="Branch" value={branch} onChange={setBranch} placeholder="main" />
            <label className="block">
              <div className="mb-1.5 text-[11px] text-[var(--faint)]">Build</div>
              <select
                value={pack}
                onChange={(event) => setPack(event.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 text-[14px] outline-none"
              >
                {PACKS.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>
          <Field label="GitHub token" value={githubToken} onChange={setGithubToken} type="password" placeholder="ghp_… or github_pat_…" />
          <div className="flex flex-wrap gap-2">
            <Ghost onClick={readGithub}>{publishing ? "Working…" : "List repositories"}</Ghost>
            <Primary onClick={publish}>{publishing ? "Working…" : "Publish"}</Primary>
          </div>
          {githubRepos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {githubRepos.slice(0, 16).map((repo) => (
                <Ghost
                  key={repo.name}
                  active={repository === repo.name}
                  onClick={() => {
                    setRepository(repo.name);
                    setBranch(repo.defaultBranch || "main");
                  }}
                >
                  {repo.name}
                </Ghost>
              ))}
            </div>
          )}
        </Card>
      </Section>

      <Section title="Domains">
        <Card className="mb-2 space-y-3 p-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1">
              <Field label="Search" value={query} onChange={setQuery} placeholder="name or name.com" />
            </div>
            <Ghost onClick={runSearch}>{searching ? "Searching…" : "Search"}</Ghost>
            <a href={OPS_LINKS[1].href} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center text-[12.5px] underline">
              Register on Ops
            </a>
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
        {orders.length > 0 && (
          <div className="space-y-2">
            {orders.map((order) => (
              <Card key={order.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="text-[13px]">{order.domain}</div>
                  <div className="text-[11px] text-[var(--muted)]">{order.status} · {order.usdc} USDC</div>
                </div>
                <a href={OPS_LINKS[1].href} target="_blank" rel="noreferrer" className="text-[12.5px] underline">
                  Domains
                </a>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Ops Hub">
        {token && repos.length === 0 && <Card className="px-4 py-3 text-[13px] text-[var(--muted)]">No repositories for this address yet.</Card>}
        {!token && <Card className="mb-2 px-4 py-3 text-[13px] text-[var(--muted)]">Sign in to list the git owned by this address.</Card>}
        <RepoList title="Yours" items={yours} />
        <RepoList title="Shared" items={shared} />
      </Section>

    </Page>
  );
}

function planLine(billing) {
  if (!billing) return "Sign in to read it";
  if (billing.plan?.name) return billing.plan.name;
  if (billing.free) return "Free window";
  return "No plan";
}

function RepoList({ title, items }) {
  if (!items.length) return null;
  return (
    <div className="mb-2 space-y-2">
      <div className="text-[11px] text-[var(--faint)]">{title}</div>
      {items.map((repo) => (
        <Card key={`${repo.owner}/${repo.name}`} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <a href={hubRepoUrl(repo.owner, repo.name)} target="_blank" rel="noreferrer" className="text-[13px] underline">
              {repo.owner}/{repo.name}
            </a>
            <div className="truncate text-[11px] text-[var(--muted)]">{repo.about || repo.branch || "main"}</div>
          </div>
          <a href={hubCloneUrl(repo.owner, repo.name)} target="_blank" rel="noreferrer" className="shrink-0 text-[12px] text-[var(--faint)]">
            git
          </a>
        </Card>
      ))}
    </div>
  );
}
