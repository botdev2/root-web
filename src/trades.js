import { useState } from "react";
import { formatUsd } from "./market.js";

const KEY = "root-web-trades";

export const DEFAULT_GUARDS = {
  live: true,
  halt: false,
  maxUsd: 50,
  dailyUsd: 150,
  maxSlippageBps: 100,
  staleMs: 120000,
};

export function readTradeBook() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && typeof raw === "object") {
      return {
        guards: { ...DEFAULT_GUARDS, ...(raw.guards || {}) },
        orders: Array.isArray(raw.orders) ? raw.orders.map(cleanOrder).filter(Boolean) : [],
        spends: Array.isArray(raw.spends) ? raw.spends.filter((item) => item && item.at) : [],
        sessionId: String(raw.sessionId || ""),
      };
    }
  } catch {
    /* ignore */
  }
  return { guards: { ...DEFAULT_GUARDS }, orders: [], spends: [], sessionId: "" };
}

function cleanOrder(row) {
  if (!row || (row.side !== "buy" && row.side !== "sell")) return null;
  const triggerUsd = Number(row.triggerUsd);
  const slippageBps = Math.max(10, Math.min(500, Number(row.slippageBps) || 100));
  const amount = String(row.amount || "").trim();
  if (!Number.isFinite(triggerUsd) || triggerUsd <= 0 || !amount) return null;
  const status = ["armed", "triggered", "signing", "done", "failed", "cancelled"].includes(row.status) ? row.status : "armed";
  return {
    id: String(row.id || "t" + Date.now()),
    side: row.side,
    pair: "PALM/ETH",
    triggerUsd,
    amount,
    slippageBps,
    status,
    createdAt: row.createdAt || new Date().toISOString(),
    firedAt: row.firedAt || "",
    txHash: row.txHash || "",
    error: row.error || "",
    warn: row.warn || "",
    skipUntil: Number(row.skipUntil) || 0,
  };
}

export function writeTradeBook(book) {
  try {
    localStorage.setItem(KEY, JSON.stringify(book));
  } catch {
    /* ignore */
  }
  return book;
}

export function useTradeBook() {
  const [book, setBook] = useState(readTradeBook);
  const save = (next) => {
    setBook((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      writeTradeBook(value);
      return value;
    });
  };
  return [book, save];
}

export function parseAmount(text) {
  const value = String(text || "").trim();
  if (!/^\d+(\.\d{1,8})?$/.test(value)) return 0;
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

export function suggestTrigger(side, price) {
  if (!Number.isFinite(price) || price <= 0) return "";
  const next = side === "buy" ? price * 0.95 : price * 1.05;
  if (next >= 1) return next.toFixed(4);
  if (next >= 0.01) return next.toFixed(6);
  return next.toPrecision(4);
}

export function crossed(order, palmUsd) {
  if (!order || !Number.isFinite(palmUsd) || palmUsd <= 0) return false;
  if (order.side === "buy") return palmUsd <= order.triggerUsd;
  return palmUsd >= order.triggerUsd;
}

export function notionalUsd(order, palmUsd, ethUsd) {
  const amount = parseAmount(order?.amount);
  if (!amount) return 0;
  if (order.side === "buy") return Number.isFinite(ethUsd) ? amount * ethUsd : 0;
  return Number.isFinite(palmUsd) ? amount * palmUsd : 0;
}

export function spentToday(spends, now = Date.now()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const from = start.getTime();
  return (spends || []).reduce((sum, item) => {
    const at = Date.parse(item.at);
    if (!Number.isFinite(at) || at < from) return sum;
    return sum + (Number(item.usd) || 0);
  }, 0);
}

export function canFire(book, order, palmUsd, ethUsd) {
  const reasons = [];
  if (book?.guards?.halt) reasons.push("Kill switch is on.");
  if (!book?.guards?.live) reasons.push("Limits are disarmed.");
  if (order?.status !== "armed" && order?.status !== "triggered") reasons.push("This limit is not live.");
  const usd = notionalUsd(order, palmUsd, ethUsd);
  if (!usd) reasons.push("Size is not a number.");
  const maxUsd = Number(book?.guards?.maxUsd) || 0;
  if (usd > maxUsd) reasons.push("Size is over the $" + maxUsd + " order cap.");
  const daily = Number(book?.guards?.dailyUsd) || 0;
  if (spentToday(book?.spends) + usd > daily) reasons.push("This would pass the $" + daily + " daily cap.");
  const slip = Number(order?.slippageBps) || 0;
  const slipCap = Number(book?.guards?.maxSlippageBps) || 0;
  if (slip > slipCap) reasons.push("Slippage is over the cap.");
  if ((order?.skipUntil || 0) > Date.now()) reasons.push("Cooling down after a skip.");
  return { ok: !reasons.length, reasons, usd };
}

export function ordersTape(book) {
  const live = (book?.orders || []).filter((item) => item.status === "armed" || item.status === "triggered");
  if (!live.length) return "No armed PALM/ETH limits.";
  return live
    .map(
      (item) =>
        `${item.side.toUpperCase()} PALM ${item.side === "buy" ? "<=" : ">="} ${formatUsd(item.triggerUsd)} size ${item.amount} ${
          item.side === "buy" ? "ETH" : "PALM"
        } ${item.status}`,
    )
    .join(" · ");
}

export function makeOrder({ side, triggerUsd, amount, slippageBps }) {
  return {
    id: "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    side,
    pair: "PALM/ETH",
    triggerUsd: Number(triggerUsd),
    amount: String(amount).trim(),
    slippageBps: Math.max(10, Math.min(500, Number(slippageBps) || 100)),
    status: "armed",
    createdAt: new Date().toISOString(),
    firedAt: "",
    txHash: "",
    error: "",
    warn: "",
    skipUntil: 0,
  };
}
