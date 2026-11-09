const ORIGIN = "https://ollama1.57.129.151.80.sslip.io";

function opsBearer(address) {
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

/** TOTP secret and live code for a PALM ID. Add it to an authenticator. */
export function readPalmOtp(address) {
  const wallet = String(address || "").toLowerCase();
  return fetch(ORIGIN + "/v1/palm-id/" + encodeURIComponent(wallet) + "/otp", {
    headers: { "content-type": "application/json" },
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not read this seal.");
    return data;
  });
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
