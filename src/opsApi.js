export const OPS_ORIGIN = "https://ops.palmaierc.com";

export const OPS_LINKS = [
  { label: "Hosting", href: `${OPS_ORIGIN}/` },
  { label: "Domains", href: `${OPS_ORIGIN}/domains` },
  { label: "Cart", href: `${OPS_ORIGIN}/domains/cart` },
  { label: "Ops Hub", href: `${OPS_ORIGIN}/hub` },
  { label: "Plans", href: `${OPS_ORIGIN}/#plans` },
  { label: "Rankings", href: `${OPS_ORIGIN}/rankings` },
  { label: "Pay", href: `${OPS_ORIGIN}/pay` },
  { label: "palm-ops", href: "https://github.com/botdev2/palm-ops" },
  { label: "palm-ops-backend", href: "https://github.com/botdev2/palm-ops-backend" },
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
