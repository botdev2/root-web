export const APP_VERSION = "0.2.7";
export const APP_CHANNEL = "stable";

export function publicIdUrl(address, origin = typeof window !== "undefined" ? window.location.origin : "https://chat.useroot.sh") {
  const wallet = String(address || "").toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(wallet)) return "";
  return `${origin.replace(/\/$/, "")}/id/${wallet}`;
}

export function parsePublicId(href = typeof window !== "undefined" ? window.location.href : "") {
  try {
    const url = new URL(href);
    const path = url.pathname.match(/^\/id\/(0x[a-fA-F0-9]{40})\/?$/);
    if (path) return path[1].toLowerCase();
    const query = url.searchParams.get("id") || "";
    if (/^0x[a-fA-F0-9]{40}$/.test(query)) return query.toLowerCase();
  } catch {
    /* ignore */
  }
  return "";
}
