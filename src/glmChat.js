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
  if (!response.ok) throw new Error(data.error || "The conversation store did not answer.");
  return data;
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

export function readCredits(address) {
  return call("/v1/credits", { address });
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
