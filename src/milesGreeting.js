/** Miles day-part login greeting + desk memory (local). */

const STORE_KEY = "root-web-miles-desk-v1";
const SESSION_KEY = "root-web-miles-greeted";
const MIN_AWAY_MS = 5 * 60 * 1000;
const MAX_ACTIVITY = 24;

const VIEW_LABELS = {
  home: "New Agent",
  chat: "Agent chat",
  automations: "Automations",
  reasoning: "Reasoning",
  ops: "PALM Ops",
  marketplace: "Marketplace",
  markets: "Markets",
  trades: "Trades",
  notes: "Notes",
  quests: "Achievements",
  billing: "Billing",
  settings: "Settings",
  templates: "Templates",
  account: "Account",
  updates: "Updates",
  telemetry: "Telemetry",
  help: "Help",
  editor: "Editor",
  history: "Run history",
};

export function dayPartOf(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function timeGreeting(date = new Date()) {
  switch (dayPartOf(date)) {
    case "morning":
      return "Good morning.";
    case "afternoon":
      return "Good day.";
    case "evening":
      return "Good evening.";
    default:
      return "You're awake.";
  }
}

export function viewLabel(view) {
  return VIEW_LABELS[view] || String(view || "desk");
}

function walletOf(address) {
  return String(address || "").toLowerCase();
}

function emptyDesk() {
  return { leftOff: null, activity: [], lastVisitAt: "", greetedAt: "" };
}

function readAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

function writeAll(all) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function readDesk(address) {
  const key = walletOf(address);
  if (!key) return emptyDesk();
  const row = readAll()[key];
  if (!row || typeof row !== "object") return emptyDesk();
  return {
    leftOff: row.leftOff && typeof row.leftOff === "object" ? row.leftOff : null,
    activity: Array.isArray(row.activity) ? row.activity.filter((item) => item?.label).slice(-MAX_ACTIVITY) : [],
    lastVisitAt: String(row.lastVisitAt || ""),
    greetedAt: String(row.greetedAt || ""),
  };
}

function writeDesk(address, desk) {
  const key = walletOf(address);
  if (!key) return;
  const all = readAll();
  all[key] = desk;
  writeAll(all);
}

export function trackActivity(address, { type = "note", label, detail = "" } = {}) {
  const key = walletOf(address);
  const text = String(label || "").trim();
  if (!key || !text) return;
  const desk = readDesk(key);
  const last = desk.activity[desk.activity.length - 1];
  if (last && last.label === text && Date.now() - Date.parse(last.at || 0) < 20_000) return;
  desk.activity = [...desk.activity, { type: String(type || "note"), label: text.slice(0, 120), detail: String(detail || "").slice(0, 160), at: new Date().toISOString() }].slice(
    -MAX_ACTIVITY,
  );
  writeDesk(key, desk);
}

export function saveLeftOff(address, snapshot) {
  const key = walletOf(address);
  if (!key) return;
  const desk = readDesk(key);
  desk.leftOff = {
    view: String(snapshot?.view || "home"),
    projectId: String(snapshot?.projectId || ""),
    projectLabel: String(snapshot?.projectLabel || "").slice(0, 80),
    sessionId: String(snapshot?.sessionId || ""),
    sessionTitle: String(snapshot?.sessionTitle || "").slice(0, 80),
    mode: String(snapshot?.mode || ""),
    at: new Date().toISOString(),
  };
  desk.lastVisitAt = desk.leftOff.at;
  writeDesk(key, desk);
}

function sessionShown(address) {
  try {
    return sessionStorage.getItem(SESSION_KEY + ":" + walletOf(address)) === "1";
  } catch {
    return false;
  }
}

function markSessionShown(address) {
  try {
    sessionStorage.setItem(SESSION_KEY + ":" + walletOf(address), "1");
  } catch {
    /* ignore */
  }
}

export function relativeAway(iso) {
  const then = Date.parse(iso || "");
  if (!Number.isFinite(then)) return "";
  const ms = Math.max(0, Date.now() - then);
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + " min ago";
  const hours = Math.floor(mins / 60);
  if (hours < 36) return hours + (hours === 1 ? " hour ago" : " hours ago");
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return days + " days ago";
}

export function shouldShowGreeting(address) {
  const key = walletOf(address);
  if (!key) return false;
  if (sessionShown(key)) return false;
  const desk = readDesk(key);
  if (!desk.leftOff && !desk.activity.length && !desk.lastVisitAt) return true;
  const leftAt = Date.parse(desk.leftOff?.at || desk.lastVisitAt || "");
  if (!Number.isFinite(leftAt)) return true;
  if (Date.now() - leftAt < MIN_AWAY_MS) return false;
  return true;
}

export function buildGreeting(address) {
  const desk = readDesk(address);
  const now = new Date();
  const left = desk.leftOff;
  const awayFrom = left?.at || desk.lastVisitAt || "";
  const activities = (desk.activity || []).slice().reverse();
  return {
    greeting: timeGreeting(now),
    dayPart: dayPartOf(now),
    firstVisit: !left && !activities.length && !desk.lastVisitAt,
    awayLabel: awayFrom ? relativeAway(awayFrom) : "",
    leftOff: left
      ? {
          ...left,
          viewName: viewLabel(left.view),
          when: relativeAway(left.at),
        }
      : null,
    activities,
  };
}

export function markGreetingShown(address) {
  const key = walletOf(address);
  if (!key) return;
  markSessionShown(key);
  const desk = readDesk(key);
  desk.greetedAt = new Date().toISOString();
  desk.activity = [];
  writeDesk(key, desk);
}
