const RPC = "https://0xrpc.io/eth";
const STAKING = "0x9131d68c27507d68120b5c6659ff974b10902a0d";
const PALM = "0xf1df7305E4BAB3885caB5B1e4dFC338452a67891";
const SEL = {
  palmToken: "0x61530d15",
  totalStaked: "0x817b1cd2",
  getStakersCount: "0x48284789",
  getStakedAmount: "0x4da6a556",
  balanceOf: "0x70a08231",
};

const VAULT_KEY = "root-web-vault";
const PROFILE_KEY = "root-web-profile";
const SKILLS_KEY = "root-web-skills";
const WALLET_TAB_KEY = "root-web-show-wallet";

export const ACCOUNT_URL = "https://useroot.sh/account";

const BUILTIN_SKILLS = [
  { id: "agent", title: "Agent", body: "Ask, Plan, and Agent on the open project.", builtIn: true, enabled: true },
  { id: "ops", title: "Ops", body: "Hosting, domains, and Ops Hub for this wallet.", builtIn: true, enabled: true },
  { id: "notes", title: "Notes", body: "Day clock, goals, and the day's markdown.", builtIn: true, enabled: true },
  { id: "farm", title: "Farm", body: "Cloud Android phones for Expo and React Native.", builtIn: true, enabled: false },
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readShowWalletTab() {
  return readJson(WALLET_TAB_KEY, false) === true;
}

export function writeShowWalletTab(on) {
  writeJson(WALLET_TAB_KEY, Boolean(on));
}

export function readProfile(address) {
  const all = readJson(PROFILE_KEY, {});
  const key = (address || "guest").toLowerCase();
  return all[key] || { name: "", github: "" };
}

export function writeProfile(address, profile) {
  const all = readJson(PROFILE_KEY, {});
  all[(address || "guest").toLowerCase()] = {
    name: String(profile.name || "").trim(),
    github: String(profile.github || "").trim(),
  };
  writeJson(PROFILE_KEY, all);
}

export function readSkills() {
  const stored = readJson(SKILLS_KEY, null);
  if (!Array.isArray(stored) || stored.length === 0) return BUILTIN_SKILLS.map((item) => ({ ...item }));
  const byId = new Map(stored.map((item) => [item.id, item]));
  const builtins = BUILTIN_SKILLS.map((item) => ({ ...item, ...(byId.get(item.id) || {}), builtIn: true }));
  const custom = stored.filter((item) => !item.builtIn && !BUILTIN_SKILLS.some((row) => row.id === item.id));
  return [...builtins, ...custom];
}

export function writeSkills(skills) {
  writeJson(SKILLS_KEY, skills);
}

function bytesToB64(bytes) {
  let text = "";
  bytes.forEach((value) => {
    text += String.fromCharCode(value);
  });
  return btoa(text);
}

function b64ToBytes(value) {
  const text = atob(value);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i);
  return bytes;
}

async function deriveKey(password, salt) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function vaultExists() {
  return Boolean(readJson(VAULT_KEY, null)?.data);
}

export async function createVault(password) {
  if (vaultExists()) throw new Error("Vault already exists.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode("[]"));
  writeJson(VAULT_KEY, { salt: bytesToB64(salt), iv: bytesToB64(iv), data: bytesToB64(new Uint8Array(cipher)) });
}

export async function unlockVault(password) {
  const stored = readJson(VAULT_KEY, null);
  if (!stored?.data) throw new Error("No vault yet.");
  const salt = b64ToBytes(stored.salt);
  const iv = b64ToBytes(stored.iv);
  const key = await deriveKey(password, salt);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, b64ToBytes(stored.data));
  return { key, entries: JSON.parse(new TextDecoder().decode(plain)) };
}

export async function saveVault(key, entries) {
  const stored = readJson(VAULT_KEY, null);
  if (!stored?.salt) throw new Error("No vault yet.");
  const salt = b64ToBytes(stored.salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const nextKey = key;
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, nextKey, new TextEncoder().encode(JSON.stringify(entries)));
  writeJson(VAULT_KEY, { salt: bytesToB64(salt), iv: bytesToB64(iv), data: bytesToB64(new Uint8Array(cipher)) });
}

export function deleteVault() {
  localStorage.removeItem(VAULT_KEY);
}

function padAddress(selector, address) {
  return selector + address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

async function rpc(method, params) {
  const response = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = await response.json();
  if (body.error) throw new Error(body.error.message || "RPC error");
  return body.result;
}

function formatUnits(raw, decimals, digits) {
  const negative = raw < 0n;
  const value = negative ? -raw : raw;
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const frac = (value % base).toString().padStart(decimals, "0").slice(0, digits);
  return (negative ? "-" : "") + whole.toString() + (digits ? "." + frac : "");
}

export async function loadWalletSnapshot(address) {
  const ethRaw = BigInt(await rpc("eth_getBalance", [address, "latest"]));
  let palmToken = PALM;
  try {
    const token = await rpc("eth_call", [{ to: STAKING, data: SEL.palmToken }, "latest"]);
    const parsed = "0x" + String(token).slice(-40);
    if (/^0x[0-9a-fA-F]{40}$/.test(parsed) && !/^0x0{40}$/.test(parsed)) palmToken = parsed;
  } catch {
    palmToken = PALM;
  }
  const [balance, staked, total, stakers] = await Promise.all([
    rpc("eth_call", [{ to: palmToken, data: padAddress(SEL.balanceOf, address) }, "latest"]),
    rpc("eth_call", [{ to: STAKING, data: padAddress(SEL.getStakedAmount, address) }, "latest"]),
    rpc("eth_call", [{ to: STAKING, data: SEL.totalStaked }, "latest"]),
    rpc("eth_call", [{ to: STAKING, data: SEL.getStakersCount }, "latest"]),
  ]);
  return {
    eth: formatUnits(ethRaw, 18, 4),
    palm: formatUnits(BigInt(balance), 9, 2),
    staked: formatUnits(BigInt(staked), 9, 2),
    totalStaked: formatUnits(BigInt(total), 9, 2),
    stakers: Number(BigInt(stakers)),
  };
}
