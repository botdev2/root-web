const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const GUIDE_TARGETS = {
  composer: '[data-tour="composer"]',
  prompt: '[data-tour="prompt"]',
  send: '[data-tour="send"]',
  files: '[data-tour="files"]',
  credits: '[data-tour="credits"]',
  wallet: '[data-tour="wallet"]',
  market: '[data-tour="market-mode"]',
  modes: '[data-tour="modes"]',
  agent: '[data-tour="mode-agent"]',
  ask: '[data-tour="mode-ask"]',
  plan: '[data-tour="mode-plan"]',
  autoprompt: '[data-tour="autoprompt"]',
  web: '[data-tour="web"]',
  attach: '[data-tour="attach"]',
  home: '[data-tour="nav-home"]',
  chats: '[data-tour="chats-head"]',
  projects: '[data-tour="projects-head"]',
  ship: '[data-tour="ship"]',
  header: '[data-tour="header"]',
  sidebar: '[data-tour="sidebar"]',
  avatar: '[data-tour="avatar"]',
  help: '[data-tour="help"]',
  inspector: '[data-tour="inspector"]',
};

export const GUIDE_VIEWS = new Set([
  "home",
  "chat",
  "markets",
  "trades",
  "quests",
  "reasoning",
  "ops",
  "marketplace",
  "billing",
  "settings",
  "templates",
  "account",
  "updates",
  "telemetry",
  "help",
  "editor",
]);

const SIDEBAR_CLICKS = new Set(["home", "chats", "projects", "sidebar", "ship"]);
const COMPOSER_VIEWS = new Set(["home", "chat", "markets", "trades"]);

function visible(node) {
  if (!node) return false;
  const box = node.getBoundingClientRect();
  if (box.width <= 0 || box.height <= 0) return false;
  const style = getComputedStyle(node);
  return style.visibility !== "hidden" && style.display !== "none";
}

export function findGuideNode(id) {
  const selector = GUIDE_TARGETS[id];
  if (!selector) return null;
  try {
    return Array.from(document.querySelectorAll(selector)).find(visible) || null;
  } catch {
    return null;
  }
}

function parseLoose(block) {
  const out = {};
  for (const line of String(block || "").split("\n")) {
    const match = line.match(/^\s*"?([a-zA-Z]+)"?\s*[:=]\s*(.+?)\s*,?\s*$/i);
    if (!match) continue;
    let value = match[2].trim().replace(/^["']|["']$/g, "");
    if (value === "true") value = true;
    else if (value === "false") value = false;
    out[match[1].toLowerCase()] = value;
  }
  return out;
}

function addClick(list, id) {
  const key = String(id || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  if (!key) return;
  if (GUIDE_TARGETS[key] || GUIDE_VIEWS.has(key)) list.push(key);
}

export function sanitizeGuide(action, { allowSend = true } = {}) {
  if (!action || typeof action !== "object") return null;
  const clicks = [];
  addClick(clicks, action.click);
  if (Array.isArray(action.clicks)) action.clicks.forEach((id) => addClick(clicks, id));
  const view = GUIDE_VIEWS.has(String(action.view || "")) ? String(action.view) : "";
  const mode = ["agent", "ask", "plan"].includes(action.mode) ? action.mode : "";
  const prompt = String(action.prompt || action.text || "").slice(0, 2000);
  const send = allowSend && action.send === true;
  const files = action.files === true;
  const ship = action.ship === true;
  const newChat = action.newChat === true || action.new === true;
  const palette = action.palette === true;
  const hotkeys = action.hotkeys === true;
  const paper = action.paper === true;
  const market = action.market === true || action.marketMode === true;
  const theme = typeof action.theme === "string" ? action.theme.slice(0, 40) : "";
  const wallpaper = typeof action.wallpaper === "string" ? action.wallpaper.slice(0, 40) : "";
  const tour = action.tour === true ? true : typeof action.tour === "string" ? action.tour.slice(0, 40) : "";
  if (
    !clicks.length &&
    !view &&
    !mode &&
    !prompt &&
    !files &&
    !ship &&
    !tour &&
    !newChat &&
    !palette &&
    !hotkeys &&
    !paper &&
    !market &&
    !theme &&
    !wallpaper
  ) {
    return null;
  }
  return { clicks, view, mode, prompt, send, files, ship, tour, newChat, palette, hotkeys, paper, market, theme, wallpaper };
}

export function parseGuide(raw, options) {
  const text = String(raw || "");
  const match = text.match(/```guide\s*([\s\S]*?)```/i);
  let action = null;
  let say = text;
  if (match) {
    say = text.replace(match[0], "");
    try {
      action = JSON.parse(match[1].trim());
    } catch {
      action = parseLoose(match[1]);
    }
  }
  say = say.replace(/\s+/g, " ").trim();
  action = sanitizeGuide(action, options);
  if (!say && action) {
    say = action.prompt ? "I'll fill that in." : action.send ? "Sending it." : "Watch this.";
  }
  return { say, action };
}

export async function playGuide(action, api) {
  if (!action) return;
  const alive = () => api.alive?.() !== false;
  if (action.hotkeys) api.openHotkeys?.();
  if (action.palette) api.openPalette?.();
  if (action.paper) {
    api.openPaper?.();
    return;
  }
  if (action.newChat) api.newChat?.();
  if (action.theme) api.setTheme?.(action.theme);
  if (action.wallpaper) api.setWallpaper?.(action.wallpaper);
  if (action.market) api.toggleMarket?.();
  if (action.view) api.openView?.(action.view);
  if (action.mode) api.setMode?.(action.mode);
  if (action.files) api.setFilesOpen?.(true);
  if (action.ship) {
    api.setNavOpen?.(true);
    api.setConnectOpen?.(true);
  }
  if (action.clicks.some((id) => SIDEBAR_CLICKS.has(id))) api.setNavOpen?.(true);
  if (action.prompt || action.send || action.clicks.includes("composer") || action.clicks.includes("prompt") || action.clicks.includes("send")) {
    if (!COMPOSER_VIEWS.has(api.view?.() || "")) api.openView?.("home");
    api.setNavOpen?.(false);
  }
  await sleep(280);
  if (!alive()) return;
  for (const id of action.clicks) {
    if (!alive()) return;
    if (GUIDE_VIEWS.has(id) && !GUIDE_TARGETS[id]) {
      api.openView?.(id);
      await sleep(240);
      continue;
    }
    const node = findGuideNode(id);
    if (node) await api.click(node);
  }
  if (action.prompt) {
    const box = findGuideNode("prompt") || document.querySelector('[data-tour="prompt"]');
    if (box && api.typeInto) await api.typeInto(box, action.prompt);
    else api.setDraft?.(action.prompt);
    if (action.send) {
      await sleep(360);
      if (!alive()) return;
      const send = findGuideNode("send");
      if (send) await api.click(send);
      else api.send?.(action.prompt);
    }
  } else if (action.send) {
    const send = findGuideNode("send");
    if (send) await api.click(send);
    else api.send?.();
  }
  if (action.tour) api.startTour?.(action.tour === true ? "" : action.tour);
}
