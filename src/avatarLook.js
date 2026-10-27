const COLORS = {
  black: "#2c261f",
  brown: "#6b3f2a",
  blonde: "#e2c07a",
  blond: "#e2c07a",
  red: "#c44b4b",
  pink: "#e48bb5",
  blue: "#4d74c4",
  white: "#f3efe8",
  green: "#3f8f6b",
  purple: "#7a5ea8",
  grey: "#8d877f",
  gray: "#8d877f",
  silver: "#c5c8ce",
  orange: "#d4783a",
  gold: "#d4b15a",
};

export const AVATAR_STYLES = ["Anime", "Comic", "Stylized 3D", "Pixel art", "Photorealistic"];

export const AVATAR_MOODS = [
  ["neutral", "Neutral"],
  ["pleased", "Pleased"],
  ["focused", "Focused"],
  ["alert", "Alert"],
  ["thinking", "Thinking"],
];

export function defaultAvatar() {
  return {
    name: "Avatar",
    style: "Anime",
    hair: "dark medium hair",
    eyes: "warm brown eyes",
    outfit: "simple dark jacket",
    vibe: "playful",
    notes: "",
    mood: "neutral",
  };
}

export function loadAvatar() {
  try {
    const raw = localStorage.getItem("root-web-avatar");
    if (!raw) return defaultAvatar();
    return { ...defaultAvatar(), ...JSON.parse(raw) };
  } catch {
    return defaultAvatar();
  }
}

export function saveAvatar(look) {
  try {
    localStorage.setItem("root-web-avatar", JSON.stringify(look));
  } catch {
    /* ignore */
  }
}

export function pickColor(text, fallback) {
  const lower = String(text || "").toLowerCase();
  for (const [name, hex] of Object.entries(COLORS)) {
    if (lower.includes(name)) return hex;
  }
  return fallback;
}

export function hairKind(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("bald") || lower.includes("shaved")) return "bald";
  if (lower.includes("bun")) return "bun";
  if (lower.includes("curl")) return "curly";
  if (lower.includes("bob")) return "bob";
  if (lower.includes("long")) return "long";
  if (lower.includes("short")) return "short";
  return "medium";
}

export function speakingMood() {
  const roll = Math.floor(Math.random() * 3);
  return roll === 0 ? "pleased" : roll === 1 ? "focused" : "alert";
}
