const KEY = "root-web-episodes";

export function readProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Remember the best result per episode. */
export function saveProgress(id, stars, total) {
  try {
    const all = readProgress();
    const prev = all[id];
    all[id] = { stars: Math.max(prev?.stars || 0, stars), total, at: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* private mode */
  }
}

export function gradeOf(stars, total) {
  if (!total) return "A";
  const share = stars / total;
  if (share >= 0.999) return "A+";
  if (share >= 0.8) return "A";
  if (share >= 0.6) return "B";
  if (share >= 0.4) return "C";
  return "D";
}
