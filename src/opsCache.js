// Remembers the last good answer from the Ops Hub so panels paint at once
// and refresh quietly behind it.

const PREFIX = "root-web-cache:";
const MAX_AGE = 6 * 60 * 60 * 1000;
const memory = new Map();

function slot(wallet, name) {
  return `${String(wallet || "").toLowerCase()}:${name}`;
}

export function readCache(wallet, name) {
  if (!wallet) return null;
  const key = slot(wallet, name);
  if (memory.has(key)) return memory.get(key);
  try {
    const raw = JSON.parse(localStorage.getItem(PREFIX + key) || "null");
    if (!raw || Date.now() - raw.at > MAX_AGE) return null;
    memory.set(key, raw.value);
    return raw.value;
  } catch {
    return null;
  }
}

export function writeCache(wallet, name, value) {
  if (!wallet) return;
  const key = slot(wallet, name);
  memory.set(key, value);
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), value }));
  } catch {
    /* storage full or blocked: the in-memory copy still works */
  }
}

export function clearCache(wallet) {
  const stem = `${String(wallet || "").toLowerCase()}:`;
  for (const key of [...memory.keys()]) if (key.startsWith(stem)) memory.delete(key);
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX + stem)) localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

export function sameData(left, right) {
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}
