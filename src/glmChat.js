const ORIGIN = "https://ollama1.57.129.151.80.sslip.io";

export function opsBearer(address) {
  try {
    const parsed = JSON.parse(localStorage.getItem("root-web-ops-session") || "null");
    if (!parsed?.token || !parsed?.address) return "";
    if (address && String(parsed.address).toLowerCase() !== String(address).toLowerCase()) return "";
    return parsed.token;
  } catch {
    return "";
  }
}

async function call(path, { address, method = "GET", body } = {}) {
  const headers = {
    "content-type": "application/json",
    "x-wallet": address,
  };
  const token = opsBearer(address);
  if (token) headers.authorization = "Bearer " + token;
  let response;
  try {
    response = await fetch(ORIGIN + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("The conversation store did not answer.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const failure = new Error(data.error || "The conversation store did not answer.");
    failure.status = response.status;
    failure.archived = data.archived === true;
    throw failure;
  }
  return data;
}

export function archiveConversation(address, id) {
  return call("/v1/conversations/" + encodeURIComponent(id) + "/archive", { address, method: "POST" });
}

export function listConversations(address) {
  return call("/v1/conversations", { address });
}

export function loadConversation(address, id) {
  return call("/v1/conversations/" + encodeURIComponent(id), { address });
}

export function removeConversation(address, id) {
  return call("/v1/conversations/" + encodeURIComponent(id), { address, method: "DELETE" });
}

export function sendTurn(address, body) {
  return call("/v1/chat/turn", { address, method: "POST", body });
}

export function watchAvatar(address, body) {
  return call("/v1/avatar/watch", { address, method: "POST", body });
}

export function readAvatarMemory(address) {
  return call("/v1/avatar/memory", { address });
}

export function searchWeb(address, query) {
  return call("/v1/web/search", { address, method: "POST", body: { query } });
}

export function readPage(address, url, offset = 0) {
  return call("/v1/web/fetch", { address, method: "POST", body: { url, offset } });
}

export function writeBrief(address, body) {
  return call("/v1/autoprompt", { address, method: "POST", body });
}

export function readCredits(address) {
  return call("/v1/credits", { address });
}

const PRESENCE_KEY = "root-web-presence-id";

function presenceSession() {
  try {
    let id = localStorage.getItem(PRESENCE_KEY) || "";
    if (!/^anon:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      id = "anon:" + crypto.randomUUID();
      localStorage.setItem(PRESENCE_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export async function readUserStats() {
  const response = await fetch(ORIGIN + "/v1/stats/users", { headers: { "content-type": "application/json" } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Could not read user stats.");
  return data;
}

export async function pingPresence(address) {
  const headers = { "content-type": "application/json" };
  const token = opsBearer(address);
  if (token && address) {
    headers.authorization = "Bearer " + token;
    headers["x-wallet"] = address;
  }
  const session = presenceSession();
  const response = await fetch(ORIGIN + "/v1/presence", {
    method: "POST",
    headers,
    body: JSON.stringify(session ? { session } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Could not update presence.");
  return data;
}

/** Public PALM ID snapshot. No wallet sign-in. */
export function readPalmId(address) {
  const wallet = String(address || "").toLowerCase();
  return fetch(ORIGIN + "/v1/palm-id/" + encodeURIComponent(wallet), {
    headers: { "content-type": "application/json" },
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not read this PALM ID.");
    return data;
  });
}

/** Owner-only TOTP setup. Requires a signed-in Ops session for this wallet. */
export function readPalmOtp(address) {
  const wallet = String(address || "").toLowerCase();
  const headers = {
    "content-type": "application/json",
    "x-wallet": wallet,
  };
  const token = opsBearer(wallet);
  if (token) headers.authorization = "Bearer " + token;
  return fetch(ORIGIN + "/v1/palm-id/" + encodeURIComponent(wallet) + "/otp", {
    headers,
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not open the authenticator.");
    return data;
  });
}

export function listNotes(address, day) {
  const query = day ? "?day=" + encodeURIComponent(day) : "";
  return call("/v1/notes" + query, { address });
}

export function listDueNotes(address) {
  return call("/v1/notes?due=1", { address });
}

export function createNote(address, body) {
  return call("/v1/notes", { address, method: "POST", body });
}

export function updateNote(address, id, body) {
  return call("/v1/notes/" + encodeURIComponent(id), { address, method: "PATCH", body });
}

export function removeNote(address, id) {
  return call("/v1/notes/" + encodeURIComponent(id), { address, method: "DELETE" });
}

export function replaceNotes(address, day, notes) {
  return call("/v1/notes", { address, method: "POST", body: { replace: true, day, notes } });
}

export function readQuests(address) {
  return call("/v1/quests", { address });
}

export function claimQuest(address, kind, id) {
  return call("/v1/quests/claim", { address, method: "POST", body: { kind, id } });
}

const reported = new Set();

/** Tell the Quests service about something done on this page. Quiet if signed out, once per day per event. */
export function reportQuestEvent(event) {
  try {
    const session = JSON.parse(localStorage.getItem("root-web-ops-session") || "null");
    if (!session?.token || !session?.address) return;
    const stamp = new Date().toISOString().slice(0, 10) + ":" + session.address + ":" + event;
    if (reported.has(stamp)) return;
    reported.add(stamp);
    call("/v1/quests/event", { address: session.address, method: "POST", body: { event } }).catch(() => reported.delete(stamp));
  } catch {
    /* storage unavailable */
  }
}
export const PALM_PER_CREDIT = 1000;

export function formatCredits(value) {
  const amount = Number(value) || 0;
  if (amount >= 100) return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (amount >= 1) return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return amount.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function creditTitle(credit) {
  if (!credit || !Number.isFinite(credit.allowance)) return "";
  const rate = Number(credit.palmPerCredit) || PALM_PER_CREDIT;
  return (
    formatCredits(credit.remaining) +
    " of " +
    formatCredits(credit.allowance) +
    " credits left. " +
    rate.toLocaleString() +
    " $PALM held or staked = 1 credit. Resets " +
    String(credit.resetsAt || "").slice(0, 10) +
    "."
  );
}
