import { useEffect, useState } from "react";
import { PALM_PER_CREDIT } from "./glmChat.js";

export const HAMRIN = 10;
export const OPS_MONTH = 2500;
export const CRAWLER = 1000;
export const LTV = 0.4;
export const LIQ_LTV = 0.75;
export const SUPPLY_APY = 0.08;
export const BORROW_APY = 0.12;
export const DEMO_PALM = 10000;
export { PALM_PER_CREDIT };

const STORE = "root-web-market:v2:";

function round(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function money(value) {
  const amount = Number(value) || 0;
  return amount.toLocaleString("en-US", { maximumFractionDigits: amount < 10 ? 2 : 0 });
}

export function parseAmount(text) {
  const value = Number.parseFloat(String(text || "").replace(/,/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;
  return round(value);
}

export function palmAmount(text) {
  const value = Number.parseFloat(String(text || "0").replace(/,/g, ""));
  return Number.isFinite(value) ? value : 0;
}

/** Wallet PALM + staked PALM. Guest sketch uses a demo pile if there is no credit snapshot. */
export function holdingsOf(credit) {
  if (!credit) return DEMO_PALM;
  return round(palmAmount(credit.held) + palmAmount(credit.staked));
}

/** An address has as much wPALM as it holds in the wallet and in stake, in total. */
export function wpalmOf(credit) {
  return holdingsOf(credit);
}

export function creditsOf(book, credit) {
  return round(wpalmOf(credit) + (book.converted || 0) + (book.borrowed || 0) - (book.spent || 0));
}

export function seed() {
  return { spent: 0, converted: 0, supplied: 0, borrowed: 0 };
}

function normalize(raw) {
  const base = seed();
  if (!raw || typeof raw !== "object") return base;
  return {
    spent: round(Math.max(0, Number(raw.spent) || 0)),
    converted: round(Math.max(0, Number(raw.converted) || 0)),
    supplied: round(Math.max(0, Number(raw.supplied) || 0)),
    borrowed: round(Math.max(0, Number(raw.borrowed) || 0)),
  };
}

export function readBook(key) {
  try {
    const raw = localStorage.getItem(STORE + key);
    if (raw) return normalize(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return seed();
}

export function writeBook(key, book) {
  try {
    localStorage.setItem(STORE + key, JSON.stringify(book));
  } catch {
    /* storage full or blocked */
  }
}

export function applySpend(book, credit, kind, price) {
  if (creditsOf(book, credit) < price) {
    return { error: "Not enough wPALM. Wallet plus staked PALM is the whole balance." };
  }
  const names = { hamrin: "Hamrin", ops: "Ops hosting", crawler: "a crawler pane" };
  return {
    book: { ...book, spent: round(book.spent + price) },
    note: `Spent ${money(price)} credits on ${names[kind] || "a PALM service"}.`,
  };
}

export function applyConvert(book, value) {
  if (value == null) return { error: "Enter how many credits you want." };
  return {
    book: { ...book, converted: round(book.converted + value) },
    note: `Converted other crypto → ${money(value)} credits. Sketch. wPALM on the address is still wallet + staked.`,
  };
}

export function applySupply(book, credit, value, into) {
  if (value == null) return { error: "Enter an amount above zero." };
  const cap = wpalmOf(credit);
  if (into) {
    if (book.supplied + value > cap) return { error: "Cannot supply more PALM than this address holds and stakes." };
    return {
      book: { ...book, supplied: round(book.supplied + value) },
      note: `Supplied ${money(value)} PALM to the pool. wPALM is unchanged — you still own it.`,
    };
  }
  if (value > book.supplied) return { error: "You have not supplied that much." };
  const left = round(book.supplied - value);
  if (book.borrowed > left) return { error: "Pool PALM is backing a borrow. Repay first." };
  return {
    book: { ...book, supplied: left },
    note: `Withdrew ${money(value)} PALM from the pool.`,
  };
}

export function applyBorrow(book, credit, value) {
  if (value == null) return { error: "Enter an amount above zero." };
  const room = round(book.supplied - book.borrowed);
  if (value > room) return { error: "The pool can only lend PALM someone already supplied." };
  const max = round(wpalmOf(credit) * LTV - book.borrowed);
  if (value > max) return { error: `40% LTV on wallet + staked. You can borrow ${money(Math.max(0, max))} more.` };
  return {
    book: { ...book, borrowed: round(book.borrowed + value) },
    note: `Borrowed ${money(value)} credits, backed by pool PALM.`,
  };
}

export function applyRepay(book, value) {
  if (value == null) return { error: "Enter an amount above zero." };
  const pay = Math.min(value, book.borrowed);
  if (pay <= 0) return { error: "Nothing to repay." };
  return {
    book: { ...book, borrowed: round(book.borrowed - pay) },
    note: `Repaid ${money(pay)} credits to the pool.`,
  };
}

export function loanHealth(book, credit) {
  if (!book || book.borrowed <= 0) return null;
  const capacity = wpalmOf(credit) * LTV;
  return capacity <= 0 ? 0 : capacity / book.borrowed;
}

export function useMarketBook(address) {
  const key = address ? String(address).toLowerCase() : "guest";
  const [book, setBook] = useState(() => readBook(key));

  useEffect(() => {
    setBook(readBook(key));
  }, [key]);

  const save = (next) => {
    setBook(next);
    writeBook(key, next);
  };

  return {
    key,
    book,
    save,
    reset: () => save(seed()),
  };
}
