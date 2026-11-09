import { useEffect, useState } from "react";
import { PALM_PER_CREDIT } from "./glmChat.js";

export const CREDIT_PRICE = 800;
export const OPS_MONTH = 2500;
export const CRAWLER = 1000;
export const LTV = 0.4;
export const LIQ_LTV = 0.75;
export const SUPPLY_APY = 0.08;
export const BORROW_APY = 0.12;
export const DEMO_PALM = 10000;
export { PALM_PER_CREDIT };

const STORE = "root-web-market:";

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

export function windowFromHoldings(credit) {
  return Number(credit?.remaining) || 0;
}

export function hamrinTotal(credit, book) {
  return windowFromHoldings(credit) + (Number(book?.extra) || 0);
}

export function seed(credit) {
  const held = Number.parseFloat(String(credit?.held || "0").replace(/,/g, ""));
  return {
    palm: Number.isFinite(held) && held > 0 ? round(held) : DEMO_PALM,
    wpalm: 0,
    extra: 0,
    collateral: 0,
    supplied: 0,
    borrowed: 0,
  };
}

function stored(key) {
  try {
    return Boolean(localStorage.getItem(STORE + key));
  } catch {
    return false;
  }
}

function normalize(raw, credit) {
  const base = seed(credit);
  if (!raw || typeof raw !== "object") return base;
  const remaining = windowFromHoldings(credit);
  let extra = Number(raw.extra);
  if (!Number.isFinite(extra)) {
    const old = Number(raw.credits);
    extra = Number.isFinite(old) ? Math.max(0, round(old - remaining)) : 0;
  }
  return {
    palm: Number.isFinite(Number(raw.palm)) ? Number(raw.palm) : base.palm,
    wpalm: Number(raw.wpalm) || 0,
    extra,
    collateral: Number(raw.collateral) || 0,
    supplied: Number(raw.supplied) || 0,
    borrowed: Number(raw.borrowed) || 0,
  };
}

export function readBook(key, credit) {
  try {
    const raw = localStorage.getItem(STORE + key);
    if (raw) return normalize(JSON.parse(raw), credit);
  } catch {
    /* ignore */
  }
  return seed(credit);
}

export function writeBook(key, book) {
  try {
    localStorage.setItem(STORE + key, JSON.stringify(book));
  } catch {
    /* storage full or blocked */
  }
}

export function applyWrap(book, value, lock) {
  if (value == null) return { error: "Enter an amount above zero." };
  if (lock) {
    if (value > book.palm) return { error: "Not enough free PALM. Free PALM is not already pledged." };
    return {
      book: { ...book, palm: round(book.palm - value), wpalm: round(book.wpalm + value) },
      note: `Wrapped ${money(value)} PALM → ${money(value)} wPALM.`,
    };
  }
  if (value > book.wpalm) return { error: "Not enough wPALM to unwrap." };
  return {
    book: { ...book, wpalm: round(book.wpalm - value), palm: round(book.palm + value) },
    note: `Unwrapped ${money(value)} wPALM → ${money(value)} PALM.`,
  };
}

export function applyBuy(book, kind, price, extra = 0) {
  if (book.wpalm < price) return { error: "Wrap PALM first. Listings settle in wPALM, not the holdings window." };
  return {
    book: { ...book, wpalm: round(book.wpalm - price), extra: round(book.extra + extra) },
    note:
      kind === "credit"
        ? `Paid ${money(price)} wPALM for 1 extra Hamrin credit.`
        : `Paid ${money(price)} wPALM. Sketch only — Ops and Crawler do not charge yet.`,
  };
}

export function applyPledge(book, value) {
  if (value == null) return { error: "Enter an amount above zero." };
  if (value > book.palm) return { error: "Not enough free PALM to pledge." };
  return {
    book: { ...book, palm: round(book.palm - value), collateral: round(book.collateral + value) },
    note: `Pledged ${money(value)} PALM as collateral.`,
  };
}

export function applyBorrow(book, value) {
  if (value == null) return { error: "Enter an amount above zero." };
  const max = round(book.collateral * LTV - book.borrowed);
  if (value > max) return { error: `40% LTV cap. You can borrow ${money(Math.max(0, max))} wPALM more against pledged PALM.` };
  return {
    book: { ...book, borrowed: round(book.borrowed + value), wpalm: round(book.wpalm + value) },
    note: `Borrowed ${money(value)} wPALM.`,
  };
}

export function applyRepay(book, value) {
  if (value == null) return { error: "Enter an amount above zero." };
  const pay = Math.min(value, book.borrowed);
  if (pay > book.wpalm) return { error: "Not enough wPALM to repay." };
  return {
    book: { ...book, wpalm: round(book.wpalm - pay), borrowed: round(book.borrowed - pay) },
    note: `Repaid ${money(pay)} wPALM.`,
  };
}

export function applySupply(book, value, into) {
  if (value == null) return { error: "Enter an amount above zero." };
  if (into) {
    if (value > book.wpalm) return { error: "Not enough wPALM to lend." };
    return {
      book: { ...book, wpalm: round(book.wpalm - value), supplied: round(book.supplied + value) },
      note: `Supplied ${money(value)} wPALM to the pool.`,
    };
  }
  if (value > book.supplied) return { error: "You have not supplied that much." };
  return {
    book: { ...book, supplied: round(book.supplied - value), wpalm: round(book.wpalm + value) },
    note: `Withdrew ${money(value)} wPALM.`,
  };
}

export function loanHealth(book) {
  if (!book || book.borrowed <= 0) return null;
  const capacity = book.collateral * LTV;
  return capacity <= 0 ? 0 : capacity / book.borrowed;
}

export function useMarketBook(address, credit) {
  const key = address ? String(address).toLowerCase() : "guest";
  const [book, setBook] = useState(() => readBook(key, credit));

  useEffect(() => {
    setBook(readBook(key, credit));
  }, [key]);

  useEffect(() => {
    if (stored(key) || !credit) return;
    setBook(seed(credit));
  }, [key, credit?.held]);

  const save = (next) => {
    setBook(next);
    writeBook(key, next);
  };

  return {
    key,
    book,
    save,
    reset: () => save(seed(credit)),
  };
}
