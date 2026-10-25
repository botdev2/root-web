const ENDPOINT = "https://ollama1.57.129.151.80.sslip.io/v1/glm";

export async function askGlm({ address, messages }) {
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-wallet": address,
      },
      body: JSON.stringify({ messages }),
    });
  } catch {
    throw new Error("GLM 5.2 cloud did not answer.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "GLM 5.2 cloud did not answer.");
  return data.text || "";
}
