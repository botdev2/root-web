export const OPS_ORIGIN = "https://ops.palmaierc.com";

export const OPS_LINKS = [
  { label: "Hosting", href: `${OPS_ORIGIN}/` },
  { label: "Domains", href: `${OPS_ORIGIN}/domains` },
  { label: "Ops Hub", href: `${OPS_ORIGIN}/hub` },
  { label: "Plans", href: `${OPS_ORIGIN}/#plans` },
  { label: "palm-ops", href: "https://github.com/botdev2/palm-ops" },
  { label: "palm-ops-backend", href: "https://github.com/botdev2/palm-ops-backend" },
];

export const OPS_PANELS = [
  {
    id: "hosting",
    label: "Hosting",
    href: `${OPS_ORIGIN}/`,
    detail: "Ship a site from git or a zip. The wallet is the account.",
  },
  {
    id: "domains",
    label: "Domains",
    href: `${OPS_ORIGIN}/domains`,
    detail: "Ops takes the name. You stay off the public record.",
  },
  {
    id: "hub",
    label: "Ops Hub",
    href: `${OPS_ORIGIN}/hub`,
    detail: "Git owned by the address. No username to create.",
  },
];

const SESSION_KEY = "root-web-ops-session";
export const MAX_REPOS = 3;

export function walletKey(address) {
  return String(address || "").toLowerCase().replace(/^0x/, "");
}

function sameWallet(left, right) {
  const a = walletKey(left);
  const b = walletKey(right);
  return a.length === 40 && a === b;
}

function readRawSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || "";
    if (!raw) return null;
    if (raw.startsWith("{")) {
      const parsed = JSON.parse(raw);
      if (parsed?.token && parsed?.address && sameWallet(parsed.address, parsed.address)) return parsed;
      return null;
    }
    return { token: raw, address: "" };
  } catch {
    return null;
  }
}

export function readOpsSession(address) {
  const row = readRawSession();
  if (!row?.token || !sameWallet(row.address, address)) return "";
  return row.token;
}

export function writeOpsSession(token, address) {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    if (!token || !sameWallet(address, address)) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, address }));
  } catch {
    /* private mode */
  }
}

export function reposForWallet(repos, address) {
  const key = walletKey(address);
  const list = Array.isArray(repos) ? repos : [];
  if (list.some((item) => item?.space === "yours" && item.owner !== key)) {
    const error = new Error("Ops returned repositories for a different wallet.");
    error.status = 401;
    throw error;
  }
  return list.filter((item) => item?.space !== "yours" || item.owner === key);
}

export async function claimOpsSession(address) {
  if (!sameWallet(address, address)) {
    writeOpsSession("", "");
    return "";
  }
  const row = readRawSession();
  if (!row?.token) return "";
  if (row.address && !sameWallet(row.address, address)) {
    writeOpsSession("", "");
    return "";
  }
  let me;
  try {
    me = await opsFetch("/api/auth/me", { token: row.token });
  } catch (error) {
    if (error.status === 401) {
      writeOpsSession("", "");
      return "";
    }
    throw error;
  }
  if (me?.guest || !sameWallet(me?.address, address)) {
    writeOpsSession("", "");
    return "";
  }
  writeOpsSession(row.token, me.address);
  return row.token;
}

export async function acceptOpsSession(address, session) {
  const token = session?.token || "";
  if (!token) throw new Error("Ops did not sign this wallet in.");
  const me = await opsFetch("/api/auth/me", { token });
  if (me?.guest || !sameWallet(me?.address, address)) {
    writeOpsSession("", "");
    throw new Error("That session belongs to a different wallet.");
  }
  writeOpsSession(token, me.address);
  return token;
}

export async function signOpsSession(address, signMessageAsync) {
  if (!sameWallet(address, address) || typeof signMessageAsync !== "function") {
    throw new Error("Connect the wallet this account should use.");
  }
  const nonce = await opsFetch("/api/auth/nonce", { method: "POST", body: { address, client: "ops" } });
  const message = String(nonce?.message || "");
  if (!message.toLowerCase().includes("address: " + String(address).toLowerCase())) {
    throw new Error("Ops asked for a different wallet.");
  }
  const signature = await signMessageAsync({ message });
  const next = await opsFetch("/api/auth/verify", { method: "POST", body: { address, signature } });
  if (next?.challenge) return next;
  if (!sameWallet(next?.address, address)) throw new Error("Ops did not sign this wallet in.");
  const token = await acceptOpsSession(address, next);
  return { token, address: next.address };
}

export function hubRepoUrl(owner, name) {
  return `${OPS_ORIGIN}/hub?repo=${encodeURIComponent(`${owner}/${name}`)}`;
}

export function hubCloneUrl(owner, name) {
  return `${OPS_ORIGIN}/hub/${owner}/${name}.git`;
}

export async function createHubProject({ token, name, about, files }) {
  const created = await opsFetch("/api/hub/repos", {
    token,
    method: "POST",
    body: { name, about: about || "A /root project." },
  });
  const owner = created.owner;
  const repo = created.name || name;
  const paths = Object.keys(files || {});
  if (owner && paths.length) {
    const form = new FormData();
    form.append("branch", created.branch || "main");
    form.append("message", "Seed /root project files");
    form.append("manifest", JSON.stringify(paths));
    for (const filePath of paths) {
      form.append("files", new Blob([String(files[filePath] ?? "")], { type: "text/plain" }), filePath);
    }
    await opsUpload(`/api/hub/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/files`, { token, form });
  }
  return created;
}

export async function writeHubFiles({ token, owner, name, branch, message, files }) {
  const paths = Object.keys(files || {});
  if (!owner || !name || !paths.length) throw new Error("Name the repository and the files to commit.");
  const form = new FormData();
  if (branch) form.append("branch", branch);
  form.append("message", String(message || "Update from /root").slice(0, 120));
  form.append("manifest", JSON.stringify(paths));
  for (const filePath of paths) {
    form.append("files", new Blob([String(files[filePath] ?? "")], { type: "text/plain" }), filePath);
  }
  return opsUpload(`/api/hub/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/files`, { token, form });
}

export async function runHubCommand({ token, owner, name, branch, command, cwd }) {
  if (!token || !owner || !name) throw new Error("Open a repository before running a command.");
  return opsFetch(`/api/hub/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/run`, {
    token,
    method: "POST",
    body: { branch: branch || "", command, cwd: cwd || "" },
  });
}

export async function deleteHubFile({ token, owner, name, branch, path }) {
  if (!token || !owner || !name) throw new Error("Open a repository before deleting a file.");
  return opsFetch(`/api/hub/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/delete`, {
    token,
    method: "POST",
    body: { branch: branch || "", path },
  });
}

export async function opsUpload(path, { token, form }) {
  let response;
  try {
    response = await fetch(`${OPS_ORIGIN}${path}`, {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: form,
    });
  } catch {
    throw new Error("Ops did not answer. Check the connection and try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Ops returned ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function opsFetch(path, { token, method = "GET", body } = {}) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  let response;
  try {
    response = await fetch(`${OPS_ORIGIN}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Ops did not answer. Check the connection and try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Ops returned ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return data;
}
