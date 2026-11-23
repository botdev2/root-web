/** Canonical shortcut list for /root web. Keys use Ctrl on Windows/Linux and ⌘ on Mac. */

export const HOTKEYS = [
  { id: "palette", keys: "Ctrl+K", mac: "⌘K", label: "Command palette", group: "Chrome" },
  { id: "hotkeys", keys: "Ctrl+/", mac: "⌘/", label: "Show this hotkey list", group: "Chrome" },
  { id: "escape", keys: "Esc", mac: "Esc", label: "Close overlays", group: "Chrome" },
  { id: "nav", keys: "Ctrl+B", mac: "⌘B", label: "Toggle sidebar", group: "Chrome" },
  { id: "files", keys: "Ctrl+Shift+F", mac: "⌘⇧F", label: "Toggle files inspector", group: "Chrome" },
  { id: "settings", keys: "Ctrl+,", mac: "⌘,", label: "Open Settings", group: "Chrome" },
  { id: "help", keys: "Ctrl+Shift+H", mac: "⌘⇧H", label: "Open Help", group: "Chrome" },
  { id: "miles", keys: "Ctrl+Shift+M", mac: "⌘⇧M", label: "Toggle Miles", group: "Chrome" },
  { id: "new", keys: "Ctrl+N", mac: "⌘N", label: "New Agent", group: "Chat" },
  { id: "send", keys: "Ctrl+Enter", mac: "⌘Enter", label: "Send prompt (also Enter on desktop)", group: "Chat" },
  { id: "agent", keys: "Ctrl+1", mac: "⌘1", label: "Mode · Agent", group: "Chat" },
  { id: "ask", keys: "Ctrl+2", mac: "⌘2", label: "Mode · Ask", group: "Chat" },
  { id: "plan", keys: "Ctrl+3", mac: "⌘3", label: "Mode · Plan", group: "Chat" },
  { id: "ship", keys: "Ctrl+Shift+S", mac: "⌘⇧S", label: "Ship an app", group: "Ops" },
  { id: "market", keys: "Ctrl+Shift+D", mac: "⌘⇧D", label: "Toggle PALM Market Mode", group: "Ops" },
  { id: "paper", keys: "Ctrl+Shift+P", mac: "⌘⇧P", label: "Open the paper", group: "Ops" },
];

function chord(event) {
  const key = String(event.key || "");
  if (!key || key === "Control" || key === "Meta" || key === "Alt" || key === "Shift") return null;
  const parts = [];
  if (event.ctrlKey || event.metaKey) parts.push("mod");
  if (event.shiftKey) parts.push("shift");
  if (event.altKey) parts.push("alt");
  const lower = key.length === 1 ? key.toLowerCase() : key;
  if (lower === "/") parts.push("/");
  else if (lower === ",") parts.push(",");
  else if (lower === "escape") parts.push("escape");
  else if (lower === "enter") parts.push("enter");
  else if (/^[1-3]$/.test(lower)) parts.push(lower);
  else if (/^[a-z]$/i.test(lower)) parts.push(lower.toLowerCase());
  else return null;
  return parts.join("+");
}

const MAP = {
  "mod+k": "palette",
  "mod+/": "hotkeys",
  escape: "escape",
  "mod+b": "nav",
  "mod+shift+f": "files",
  "mod+,": "settings",
  "mod+shift+h": "help",
  "mod+shift+m": "miles",
  "mod+n": "new",
  "mod+enter": "send",
  "mod+1": "agent",
  "mod+2": "ask",
  "mod+3": "plan",
  "mod+shift+s": "ship",
  "mod+shift+d": "market",
  "mod+shift+p": "paper",
};

export function matchHotkey(event) {
  const target = event.target;
  const tag = String(target?.tagName || "").toLowerCase();
  const typing =
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target?.isContentEditable === true;
  const id = MAP[chord(event)];
  if (!id) return null;
  if (typing && !["escape", "send", "palette", "hotkeys"].includes(id)) return null;
  return id;
}

export function hotkeyLabel(item, mac = false) {
  return mac ? item.mac : item.keys;
}
