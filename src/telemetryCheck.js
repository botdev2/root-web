const TRACKER_COOKIE = [
  "_ga",
  "_gid",
  "_gat",
  "_gcl",
  "_fbp",
  "_fbc",
  "_ttp",
  "_uetsid",
  "_uetvid",
  "muid",
  "muc_ads",
  "personalization_id",
  "ide",
  "__gads",
  "__gpi",
  "_clck",
  "_clsk",
  "_hj",
  "ajs_",
  "mp_",
  "amp_",
  "hubspotutk",
  "_pin",
  "_scid",
  "_twq",
];

const TRACKER_HOSTS = [
  "google-analytics.com",
  "googletagmanager.com",
  "googleadservices.com",
  "doubleclick.net",
  "googlesyndication.com",
  "facebook.net",
  "connect.facebook.net",
  "hotjar.com",
  "clarity.ms",
  "segment.io",
  "segment.com",
  "mixpanel.com",
  "amplitude.com",
  "fullstory.com",
  "mouseflow.com",
  "crazyegg.com",
  "ads-twitter.com",
  "ads.linkedin.com",
  "bat.bing.com",
  "taboola.com",
  "outbrain.com",
  "scorecardresearch.com",
  "quantserve.com",
  "adnxs.com",
  "demdex.net",
  "omtrdc.net",
  "analytics.tiktok.com",
  "snapads.com",
  "sc-static.net",
];

const TRACKER_GLOBALS = ["gtag", "ga", "fbq", "dataLayer", "mixpanel", "amplitude", "hj", "_paq", "pintrk", "ttq", "twq", "uetq", "snaptr"];

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isTrackerHost(host) {
  return TRACKER_HOSTS.some((item) => host === item || host.endsWith("." + item));
}

function isTrackerCookie(name) {
  const key = name.toLowerCase();
  return TRACKER_COOKIE.some((item) => key === item || key.startsWith(item));
}

function readCookies() {
  if (!document.cookie) return [];
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split("=")[0]);
}

function storageBytes(store) {
  try {
    let bytes = 0;
    const keys = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      keys.push(key);
      bytes += (key || "").length + (store.getItem(key) || "").length;
    }
    return { keys, bytes };
  } catch {
    return { keys: [], bytes: 0 };
  }
}

function trackerGlobals() {
  const found = [];
  for (const name of TRACKER_GLOBALS) {
    try {
      if (window[name]) found.push(name);
    } catch {
      /* blocked */
    }
  }
  return found;
}

function thirdPartyHosts() {
  const own = location.hostname;
  const hosts = new Set();
  const trackers = new Set();
  for (const entry of performance.getEntriesByType("resource")) {
    const host = hostOf(entry.name);
    if (!host || host === own) continue;
    hosts.add(host);
    if (isTrackerHost(host)) trackers.add(host);
  }
  return { hosts: [...hosts], trackers: [...trackers] };
}

function privateAddress(ip) {
  if (!ip) return true;
  const value = ip.toLowerCase();
  if (value === "::1" || value === "0.0.0.0" || value.startsWith("127.") || value.startsWith("fe80:") || value.startsWith("fc") || value.startsWith("fd")) {
    return true;
  }
  if (value.includes(":")) return false;
  const parts = value.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;
  const [a, b] = parts;
  if (a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31)) return true;
  if (a === 169 && b === 254) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function webrtcAddresses() {
  return new Promise((resolve) => {
    const found = new Set();
    let pc;
    const finish = () => {
      try {
        pc?.close();
      } catch {
        /* ignore */
      }
      resolve([...found]);
    };
    const timer = setTimeout(finish, 2800);
    try {
      pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pc.createDataChannel("probe");
      pc.onicecandidate = (event) => {
        const line = event.candidate?.candidate || "";
        const match = line.match(/([0-9]{1,3}(?:\.[0-9]{1,3}){3}|[a-f0-9:]{2,})/i);
        if (match) found.add(match[1]);
        if (!event.candidate) {
          clearTimeout(timer);
          finish();
        }
      };
      pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(finish);
    } catch {
      clearTimeout(timer);
      finish();
    }
  });
}

async function lookupIp() {
  const attempts = [
    async () => {
      const response = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(5000) });
      const body = await response.json();
      if (!body?.success && !body?.ip) throw new Error("lookup failed");
      return {
        ip: body.ip || "",
        place: [body.city, body.country].filter(Boolean).join(", "),
        isp: body.connection?.isp || body.connection?.org || "",
        vpn: Boolean(body.security?.vpn),
        proxy: Boolean(body.security?.proxy),
        tor: Boolean(body.security?.tor),
        hosting: Boolean(body.security?.hosting),
        source: "ipwho.is",
      };
    },
    async () => {
      const response = await fetch("https://get.geojs.io/v1/ip/geo.json", { signal: AbortSignal.timeout(5000) });
      const body = await response.json();
      return {
        ip: body.ip || "",
        place: [body.city, body.country].filter(Boolean).join(", "),
        isp: body.organization || "",
        vpn: false,
        proxy: false,
        tor: false,
        hosting: false,
        source: "geojs.io",
      };
    },
  ];
  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (result.ip) return result;
    } catch {
      /* try the next lookup */
    }
  }
  return null;
}

function browserVerdict({ trackerCookies, globals, trackerHosts }) {
  const score = trackerCookies.length * 2 + globals.length * 2 + trackerHosts.length;
  if (score >= 6) {
    return { tone: "bad", title: "Bloated with trackers", detail: "Tracker cookies, scripts, or analytics hosts are active in this browser session." };
  }
  if (score >= 2) {
    return { tone: "warn", title: "Some trackers", detail: "A few tracker cookies or third-party analytics hosts showed up." };
  }
  return { tone: "ok", title: "Clean", detail: "No tracker cookies or known analytics hosts showed up on this site." };
}

function networkVerdict({ https, secure, lookup, publicLeak }) {
  if (!https || !secure) {
    return { tone: "bad", title: "Unsecure", detail: "This page is not on a secure connection." };
  }
  if (lookup?.proxy && !lookup.vpn && !lookup.tor) {
    return { tone: "bad", title: "Unsecure", detail: "This address is flagged as an open proxy." };
  }
  if (publicLeak) {
    return { tone: "warn", title: "Leaking", detail: "The browser exposes a public network address to scripts through WebRTC." };
  }
  if (lookup?.vpn || lookup?.tor) {
    return { tone: "ok", title: "Secure", detail: lookup.tor ? "The connection is HTTPS and the address is a Tor exit." : "The connection is HTTPS and the address is on a VPN or relay." };
  }
  return { tone: "ok", title: "Secure", detail: "The connection is HTTPS and the browser did not hand a public address to scripts." };
}

export async function runTelemetryCheck({ lookupNetwork }) {
  const cookies = readCookies();
  const trackerCookies = cookies.filter(isTrackerCookie);
  const local = storageBytes(localStorage);
  const session = storageBytes(sessionStorage);
  const globals = trackerGlobals();
  const parties = thirdPartyHosts();
  const https = location.protocol === "https:";
  const secure = window.isSecureContext === true;
  const gpc = navigator.globalPrivacyControl === true;
  const dnt = navigator.doNotTrack === "1" || window.doNotTrack === "1";
  const link = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let usage = null;
  try {
    usage = await navigator.storage?.estimate?.();
  } catch {
    usage = null;
  }
  let workers = 0;
  try {
    workers = (await navigator.serviceWorker?.getRegistrations?.())?.length || 0;
  } catch {
    workers = 0;
  }
  const addresses = await webrtcAddresses();
  const publicAddresses = addresses.filter((ip) => !privateAddress(ip));
  const privateAddresses = addresses.filter((ip) => privateAddress(ip));
  const lookup = lookupNetwork ? await lookupIp() : null;
  const browser = browserVerdict({ trackerCookies, globals, trackerHosts: parties.trackers });
  const network = networkVerdict({ https, secure, lookup, publicLeak: publicAddresses.length > 0 });
  return {
    browser,
    network,
    cookies,
    trackerCookies,
    localKeys: local.keys.length,
    localBytes: local.bytes,
    sessionKeys: session.keys.length,
    sessionBytes: session.bytes,
    usage,
    workers,
    globals,
    hosts: parties.hosts,
    trackerHosts: parties.trackers,
    https,
    secure,
    gpc,
    dnt,
    cookiesEnabled: navigator.cookieEnabled,
    link: link
      ? { type: link.effectiveType || "", rtt: link.rtt, downlink: link.downlink, saveData: Boolean(link.saveData) }
      : null,
    publicAddresses,
    privateAddresses,
    lookup,
    lookedUp: Boolean(lookupNetwork),
  };
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
