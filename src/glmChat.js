const ORIGIN = "https://ollama1.57.129.151.80.sslip.io";

async function call(path, { address, method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(ORIGIN + path, {
      method,
      headers: {
        "content-type": "application/json",
        "x-wallet": address,
      },
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
