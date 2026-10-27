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

export function readOpsSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY) || "";
  } catch {
    return "";
  }
}

export function writeOpsSession(token) {
  try {
    if (token) sessionStorage.setItem(SESSION_KEY, token);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode */
  }
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
