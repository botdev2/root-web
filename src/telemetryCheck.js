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

function unwrapAddress(ip) {
  const value = String(ip || "").trim().toLowerCase();
  const mapped = value.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  return mapped ? mapped[1] : value;
}

function privateAddress(ip) {
  const value = unwrapAddress(ip);
  if (!value) return true;
  if (value === "::1" || value === "::" || value === "0.0.0.0" || value.startsWith("127.") || value.startsWith("fe80:") || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("ff")) {
    return true;
  }
  if (value.endsWith(".local")) return true;
  if (value.includes(":")) return false;
  const parts = value.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part > 255)) return true;
  const [a, b] = parts;
  if (a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31)) return true;
  if (a === 169 && b === 254) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 0 || a >= 224) return true;
  return false;
}

function classifyAddress(address) {
  const value = unwrapAddress(address);
  if (!value) return "unknown";
  if (value.endsWith(".local")) return "mdns";
  return privateAddress(value) ? "private" : "public";
}

function parseIce(line) {
  const parts = String(line || "").trim().split(/\s+/);
  if (!parts.length || parts.indexOf("typ") < 0) return null;
  const typAt = parts.indexOf("typ");
  const type = parts[typAt + 1] || "";
  if (!parts[0].startsWith("candidate:") || parts.length < 5) return null;
  const address = unwrapAddress(parts[4]);
  if (!address || address === "typ") return null;
  return { type, protocol: (parts[2] || "").toLowerCase(), address, kind: classifyAddress(address) };
}

function webrtcCandidates() {
  return new Promise((resolve) => {
    const found = new Map();
    let pc;
    let blocked = false;
    const take = (line) => {
      const parsed = parseIce(line);
      if (parsed) found.set(parsed.type + "|" + parsed.address, parsed);
    };
    const finish = () => {
      try {
        const sdp = pc?.localDescription?.sdp || "";
        for (const line of sdp.split("\n")) {
          if (line.startsWith("a=candidate:")) take(line.slice(2));
        }
        pc?.close();
      } catch {
        /* ignore */
      }
      resolve({ blocked, candidates: [...found.values()] });
    };
    const timer = setTimeout(finish, 2800);
    try {
      pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.cloudflare.com:3478" }, { urls: "stun:stun.l.google.com:19302" }] });
      pc.createDataChannel("probe");
      pc.onicecandidate = (event) => {
        if (event.candidate?.candidate) take(event.candidate.candidate);
        if (!event.candidate) {
          clearTimeout(timer);
          finish();
        }
      };
      pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(finish);
    } catch {
      blocked = true;
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
        place: [body.city, body.region, body.country].filter(Boolean).join(", "),
        isp: body.connection?.isp || "",
        org: body.connection?.org || "",
        asn: body.connection?.asn ? "AS" + body.connection.asn : "",
        domain: body.connection?.domain || "",
        vpn: Boolean(body.security?.vpn),
        proxy: Boolean(body.security?.proxy),
        tor: Boolean(body.security?.tor),
        hosting: Boolean(body.security?.hosting),
        anonymous: Boolean(body.security?.anonymous),
        timezone: body.timezone?.id || "",
        country: body.country_code || "",
        kind: body.type || "",
        source: "ipwho.is",
      };
    },
    async () => {
      const response = await fetch("https://get.geojs.io/v1/ip/geo.json", { signal: AbortSignal.timeout(5000) });
      const body = await response.json();
      return {
        ip: body.ip || "",
        place: [body.city, body.region, body.country].filter(Boolean).join(", "),
        isp: body.organization || "",
        org: body.organization_name || body.organization || "",
        asn: body.asn ? "AS" + body.asn : "",
        domain: "",
        vpn: false,
        proxy: false,
        tor: false,
        hosting: false,
        anonymous: false,
        timezone: body.timezone || "",
        country: body.country_code || "",
        kind: "",
        source: "geojs.io",
        partial: true,
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

function headerValue(headers, name) {
  try {
    return headers.get(name) || "";
  } catch {
    return "";
  }
}

async function readSecurityHeaders() {
  const metaCsp = document.querySelector('meta[http-equiv="Content-Security-Policy" i]')?.content || "";
  const metaReferrer = document.querySelector('meta[name="referrer" i]')?.content || document.referrerPolicy || "";
  const attempts = [
    () => fetch(location.href, { method: "HEAD", cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(4000) }),
    () => fetch(location.href, { method: "GET", cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(4000) }),
  ];
  for (const attempt of attempts) {
    try {
      const response = await attempt();
      const headers = response.headers;
      return {
        readable: true,
        hsts: headerValue(headers, "strict-transport-security"),
        csp: headerValue(headers, "content-security-policy") || metaCsp,
        frame: headerValue(headers, "x-frame-options"),
        nosniff: headerValue(headers, "x-content-type-options"),
        referrer: headerValue(headers, "referrer-policy") || metaReferrer,
        permissions: headerValue(headers, "permissions-policy"),
        coop: headerValue(headers, "cross-origin-opener-policy"),
        coep: headerValue(headers, "cross-origin-embedder-policy"),
        corp: headerValue(headers, "cross-origin-resource-policy"),
      };
    } catch {
      /* try the next request */
    }
  }
  if (metaCsp || metaReferrer) {
    return { readable: false, hsts: "", csp: metaCsp, frame: "", nosniff: "", referrer: metaReferrer, permissions: "", coop: "", coep: "", corp: "" };
  }
  return null;
}

function transportFacts() {
  const nav = performance.getEntriesByType("navigation")[0];
  if (!nav) return null;
  const tls = nav.secureConnectionStart > 0 ? Math.max(0, Math.round(nav.connectEnd - nav.secureConnectionStart)) : null;
  const dns = nav.domainLookupEnd > nav.domainLookupStart ? Math.round(nav.domainLookupEnd - nav.domainLookupStart) : null;
  const tcp = nav.connectEnd > nav.connectStart ? Math.round(nav.connectEnd - nav.connectStart) : null;
  return {
    protocol: nav.nextHopProtocol || "",
    redirects: nav.redirectCount || 0,
    tls,
    dns,
    tcp,
    transfer: nav.transferSize || 0,
  };
}

function resourceSecurity() {
  const insecure = [];
  const protocols = new Set();
  for (const entry of performance.getEntriesByType("resource")) {
    const url = entry.name || "";
    if (entry.nextHopProtocol) protocols.add(entry.nextHopProtocol);
    if (/^http:/i.test(url) || /^ws:/i.test(url)) {
      const active = /script|xmlhttprequest|fetch|beacon|other/i.test(entry.initiatorType || "") || /^ws:/i.test(url);
      insecure.push({ url: hostOf(url) || url.slice(0, 80), active, kind: entry.initiatorType || "request" });
    }
  }
  return { insecure, protocols: [...protocols] };
}

function cspMap(value) {
  const map = {};
  for (const part of String(value || "").split(";")) {
    const bits = part.trim().split(/\s+/).filter(Boolean);
    if (!bits.length) continue;
    map[bits[0].toLowerCase()] = bits.slice(1).map((item) => item.toLowerCase());
  }
  return map;
}

function protocolName(value) {
  if (value === "h3") return "HTTP/3";
  if (value === "h2") return "HTTP/2";
  if (value === "http/1.1") return "HTTP/1.1";
  if (value === "http/1.0") return "HTTP/1.0";
  return value || "an unnamed HTTP version";
}

function sameFamily(left, right) {
  return left.includes(":") === right.includes(":");
}

function addressesDisagree(left, right) {
  const a = unwrapAddress(left);
  const b = unwrapAddress(right);
  if (!a || !b || !sameFamily(a, b)) return false;
  return a !== b;
}

function finding(tone, title, detail) {
  return { tone, title, detail };
}

function analyzeNetwork({ https, secure, headers, transport, resources, rtc, lookup, hosts, link }) {
  const findings = [];
  const publicCandidates = (rtc?.candidates || []).filter((item) => item.kind === "public");
  const privateCandidates = (rtc?.candidates || []).filter((item) => item.kind === "private");
  const hiddenCandidates = (rtc?.candidates || []).filter((item) => item.kind === "mdns");

  if (!https || !secure) {
    findings.push(finding("bad", "Transport", "This page is not a secure context. The address bar is not HTTPS, so anything typed here can be read on the path."));
  } else {
    const version = protocolName(transport?.protocol);
    findings.push(finding("ok", "Transport", `The document loaded over HTTPS as ${version}. The browser treats this origin as a secure context.`));
  }

  if (transport?.tls != null) {
    const parts = [`TLS finished in ${transport.tls} ms`];
    if (transport.dns != null) parts.push(`DNS ${transport.dns} ms`);
    if (transport.tcp != null) parts.push(`connect ${transport.tcp} ms`);
    findings.push(finding("ok", "Handshake", parts.join(" · ") + ". A TLS handshake ran for this navigation."));
  } else if (https) {
    findings.push(finding("note", "Handshake", "This navigation reused a connection, so the browser did not expose a fresh TLS timing. HTTPS is still in force."));
  }

  if ((transport?.redirects || 0) > 0) {
    findings.push(finding("note", "Redirects", `The document followed ${transport.redirects} redirect${transport.redirects === 1 ? "" : "s"} before it landed. The final hop is the one checked here.`));
  } else {
    findings.push(finding("ok", "Redirects", "The document did not redirect. There is no earlier hop that could have downgraded the connection."));
  }

  const activeMixed = (resources?.insecure || []).filter((item) => item.active);
  const passiveMixed = (resources?.insecure || []).filter((item) => !item.active);
  if (activeMixed.length) {
    findings.push(finding("bad", "Mixed content", `Scripts or requests still use plain HTTP: ${[...new Set(activeMixed.map((item) => item.url))].slice(0, 4).join(", ")}.`));
  } else if (passiveMixed.length) {
    findings.push(finding("warn", "Mixed content", `Some images or other passive resources still use plain HTTP: ${[...new Set(passiveMixed.map((item) => item.url))].slice(0, 4).join(", ")}.`));
  } else {
    findings.push(finding("ok", "Mixed content", "Every resource observed for this page used HTTPS or a secure WebSocket. Nothing on the page was fetched in the clear."));
  }

  if (!headers) {
    findings.push(finding("warn", "Response headers", "The browser could not read this page's security headers, so HSTS, framing, and the content security policy were not verified."));
  } else if (headers.readable === false) {
    findings.push(finding("note", "Response headers", "The document response did not expose its headers to this check. Only a policy written in the page itself could be read."));
  }
  if (headers?.readable !== false && headers) {
    const hsts = headers.hsts || "";
    const maxAge = Number((hsts.match(/max-age=(\d+)/i) || [])[1] || 0);
    if (!hsts) {
      findings.push(finding("warn", "HSTS", "No Strict-Transport-Security header. A first visit typed as http:// can be intercepted before the browser upgrades it."));
    } else if (maxAge < 15552000) {
      findings.push(finding("warn", "HSTS", `HSTS is present, but max-age is ${maxAge} seconds. Six months or more is what keeps a downgrade from working after the header expires.`));
    } else {
      const extras = [];
      if (/includeSubDomains/i.test(hsts)) extras.push("subdomains included");
      if (/preload/i.test(hsts)) extras.push("preload requested");
      findings.push(finding("ok", "HSTS", `HTTPS is pinned for about ${Math.round(maxAge / 86400)} days${extras.length ? " (" + extras.join(", ") + ")" : ""}.`));
    }

    const csp = cspMap(headers.csp);
    const framing = csp["frame-ancestors"] || [];
    if (!headers.csp) {
      findings.push(finding("warn", "Content security policy", "No content security policy. A script injected into this page is not limited to named hosts."));
    } else {
      const script = csp["script-src"] || csp["default-src"] || [];
      const loose = script.filter((item) => item === "'unsafe-inline'" || item === "'unsafe-eval'" || item === "data:" || item === "*");
      if (!script.length) {
        findings.push(finding("warn", "Content security policy", "A policy is set, but it does not name script-src or default-src, so script sources stay open."));
      } else if (loose.length) {
        findings.push(finding("warn", "Content security policy", `Script sources allow ${loose.join(", ")}. That weakens the policy against injected script.`));
      } else {
        findings.push(finding("ok", "Content security policy", `Scripts are limited to ${script.slice(0, 4).join(", ")}${script.length > 4 ? "…" : ""}.`));
      }
      if (csp["upgrade-insecure-requests"] || csp["block-all-mixed-content"]) {
        findings.push(finding("ok", "Upgrade", "The policy asks the browser to upgrade insecure URLs before they are requested."));
      }
    }
    if (!framing.length && !headers.frame) {
      findings.push(finding("warn", "Framing", "Nothing sets frame-ancestors or X-Frame-Options. Another site can embed this page and trick a click."));
    } else {
      findings.push(finding("ok", "Framing", framing.length ? `frame-ancestors is ${framing.join(" ")}.` : `X-Frame-Options is ${headers.frame}.`));
    }

    if ((headers.nosniff || "").toLowerCase() === "nosniff") {
      findings.push(finding("ok", "Content type", "X-Content-Type-Options is nosniff. The browser will not guess a script from a file that claims another type."));
    } else if (headers.readable !== false) {
      findings.push(finding("warn", "Content type", "X-Content-Type-Options is missing. A mislabeled response can be sniffed into a script."));
    }

    const referrer = (headers.referrer || "").toLowerCase();
    const strictReferrer = ["no-referrer", "same-origin", "strict-origin", "strict-origin-when-cross-origin"].includes(referrer);
    if (!referrer) {
      findings.push(finding("warn", "Referrer", "No referrer policy. A click away from this page can send the full address, including query text, to the next site."));
    } else if (!strictReferrer) {
      findings.push(finding("warn", "Referrer", `Referrer policy is ${headers.referrer}. A stricter policy would stop the full address leaving this origin.`));
    } else {
      findings.push(finding("ok", "Referrer", `Referrer policy is ${headers.referrer}. Cross-site requests do not carry the full address.`));
    }

    if (!headers.permissions) {
      findings.push(finding("note", "Permissions policy", "No Permissions-Policy header. Powerful features fall back to the browser default for this origin."));
    } else {
      findings.push(finding("ok", "Permissions policy", "A permissions policy is set, so unused sensors and device APIs can be denied even if script asks."));
    }

    if (headers.coop || headers.coep) {
      findings.push(finding("ok", "Isolation", `Cross-origin isolation headers are set${headers.coop ? " (opener " + headers.coop + ")" : ""}${headers.coep ? " (embedder " + headers.coep + ")" : ""}.`));
    } else {
      findings.push(finding("note", "Isolation", "No Cross-Origin-Opener-Policy. Other windows can keep a reference to this tab. That is normal for a document site and is not a broken lock."));
    }
  }

  if (rtc?.blocked) {
    findings.push(finding("ok", "WebRTC", "The browser refused to open a peer connection. Scripts cannot learn a network address from ICE."));
  } else if (!publicCandidates.length && !privateCandidates.length) {
    const hidden = hiddenCandidates.length ? " Local names are hidden behind mDNS." : "";
    findings.push(finding("ok", "WebRTC", "No public or local address arrived in ICE candidates." + hidden));
  } else if (publicCandidates.length) {
    const shown = [...new Set(publicCandidates.map((item) => item.address))].slice(0, 3).join(", ");
    const kinds = [...new Set(publicCandidates.map((item) => item.type || "candidate"))].join(", ");
    findings.push(finding("warn", "WebRTC", `Scripts can read a public address from ICE (${kinds}): ${shown}. A page does not need a server of its own to see that.`));
  } else {
    findings.push(finding("ok", "WebRTC", "ICE did not yield a public address. " + (hiddenCandidates.length ? "Local names are mDNS placeholders." : "Only local candidates appeared, and they stay on this network.")));
  }

  if (privateCandidates.length && !hiddenCandidates.length) {
    const shown = [...new Set(privateCandidates.map((item) => item.address))].slice(0, 3).join(", ");
    findings.push(finding("warn", "Local addresses", `Host candidates name this machine on the local network: ${shown}. mDNS would hide those names.`));
  } else if (hiddenCandidates.length) {
    findings.push(finding("ok", "Local addresses", "Local host candidates are mDNS names, not raw LAN addresses."));
  }

  if (lookup?.ip && publicCandidates.length) {
    const comparable = publicCandidates.filter((item) => sameFamily(item.address, lookup.ip));
    const clash = comparable.some((item) => addressesDisagree(item.address, lookup.ip));
    const covered = lookup.vpn || lookup.tor;
    if (!comparable.length) {
      const shown = [...new Set(publicCandidates.map((item) => item.address))].slice(0, 2).join(", ");
      findings.push(finding("note", "Path agreement", `The HTTPS address is ${lookup.ip}. WebRTC also revealed ${shown}, which is the other IP family, so the two cannot be compared directly.`));
    } else if (clash && covered) {
      findings.push(finding("bad", "Path split", `The HTTPS request leaves from ${lookup.ip}, but WebRTC also revealed a different public address. The VPN or Tor path is not covering peer connections.`));
    } else if (clash) {
      findings.push(finding("warn", "Path split", `The HTTPS address is ${lookup.ip}, and WebRTC revealed a different public address. The page and the peer connection are not on the same path.`));
    } else {
      findings.push(finding("ok", "Path agreement", `WebRTC and the HTTPS request agree on ${lookup.ip}. There is no second public address hiding beside the page load.`));
    }
  }

  if (!lookup) {
    findings.push(finding("note", "Address path", "The public-address lookup is off, so VPN, proxy, Tor, hosting, and timezone checks did not run."));
  } else {
    const who = [lookup.asn, lookup.org || lookup.isp].filter(Boolean).join(" · ");
    const where = lookup.place || "an unnamed place";
    if (lookup.proxy && !lookup.vpn && !lookup.tor) {
      findings.push(finding("bad", "Address path", `${lookup.ip} in ${where}${who ? " (" + who + ")" : ""} is flagged as an open proxy.`));
    } else if (lookup.tor) {
      findings.push(finding("ok", "Address path", `${lookup.ip} is a Tor exit${where ? " seen in " + where : ""}. The site sees the exit, not the browser's own network.`));
    } else if (lookup.vpn) {
      findings.push(finding("ok", "Address path", `${lookup.ip} in ${where} is flagged as a VPN or relay${who ? " (" + who + ")" : ""}.`));
    } else if (lookup.hosting) {
      findings.push(finding("warn", "Address path", `${lookup.ip} in ${where} belongs to a hosting network${who ? " (" + who + ")" : ""}, and it is not flagged as a VPN.`));
    } else {
      findings.push(finding("ok", "Address path", `${lookup.ip} in ${where}${who ? " via " + who : ""}. No open-proxy, VPN, Tor, or hosting flag.` + (lookup.partial ? " The backup lookup does not rate those flags." : "")));
    }

    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (lookup.timezone && localTz && lookup.timezone !== localTz) {
      findings.push(finding("note", "Timezone", `The browser zone is ${localTz} and the address zone is ${lookup.timezone}. That happens with a VPN, travel, or a clock set to another region.`));
    } else if (lookup.timezone && localTz) {
      findings.push(finding("ok", "Timezone", `The browser zone and the address zone are both ${localTz}.`));
    }
  }

  const foreign = (hosts || []).length;
  if (foreign) {
    findings.push(finding(foreign > 8 ? "warn" : "note", "Other hosts", `This page has contacted ${foreign} other host${foreign === 1 ? "" : "s"}: ${(hosts || []).slice(0, 6).join(", ")}${foreign > 6 ? "…" : ""}.`));
  } else {
    findings.push(finding("ok", "Other hosts", "No third-party host has been contacted by this page yet."));
  }

  if (typeof navigator.onLine === "boolean" && navigator.onLine === false) {
    findings.push(finding("bad", "Link", "The browser reports that it is offline."));
  } else if (link?.type) {
    const parts = [link.type];
    if (link.rtt != null) parts.push(link.rtt + " ms round trip");
    if (link.downlink != null) parts.push(link.downlink + " Mb/s down");
    if (link.saveData) parts.push("data saver on");
    findings.push(finding("note", "Link", `The browser describes this network as ${parts.join(", ")}. That is a hint from the radio, not a measurement of the path.`));
  } else {
    findings.push(finding("note", "Link", "This browser hides the network type, round trip, and downlink."));
  }

  const bad = findings.filter((item) => item.tone === "bad").length;
  const warn = findings.filter((item) => item.tone === "warn").length;
  const passed = findings.filter((item) => item.tone === "ok").length;
  let tone = "ok";
  let title = "Secure";
  if (bad) {
    tone = "bad";
    title = "Unsecure";
  } else if (warn) {
    tone = "warn";
    title = "Exposed";
  }
  const lead = findings.find((item) => item.tone === tone) || findings[0];
  const extra = warn + bad > 1 ? ` ${warn + bad - 1} more check${warn + bad - 1 === 1 ? "" : "s"} need attention.` : "";
  const checked = "Checked transport, the TLS handshake, redirects, mixed content, HSTS, the content security policy, framing, content sniffing, referrer, WebRTC candidates, and the address path.";
  return {
    tone,
    title,
    detail: tone === "ok" ? `${passed} checks passed. ${checked}` : `${passed} passed, ${warn} need attention, ${bad} failed. ${lead ? lead.detail : ""}${extra}`,
    findings,
  };
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
  const rtc = await webrtcCandidates();
  const publicAddresses = rtc.candidates.filter((item) => item.kind === "public").map((item) => item.address);
  const privateAddresses = rtc.candidates.filter((item) => item.kind === "private").map((item) => item.address);
  const [lookup, headers] = await Promise.all([lookupNetwork ? lookupIp() : null, readSecurityHeaders()]);
  const transport = transportFacts();
  const resources = resourceSecurity();
  const browser = browserVerdict({ trackerCookies, globals, trackerHosts: parties.trackers });
  const network = analyzeNetwork({
    https,
    secure,
    headers,
    transport,
    resources,
    rtc,
    lookup,
    hosts: parties.hosts,
    link: link ? { type: link.effectiveType || link.type || "", rtt: link.rtt, downlink: link.downlink, saveData: Boolean(link.saveData) } : null,
  });
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
