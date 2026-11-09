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

export function ownedPalm(book) {
  return round((book.palm || 0) + (book.posted || 0) + (book.supplied || 0));
}

/** You have wPALM if you own $PALM. */
export function wpalmOf(book) {
  return ownedPalm(book);
}

/** Spendable credits = active wPALM (posted PALM + pool-backed borrow). */
export function creditsOf(book) {
  return round(book.credits || 0);
}

export function seed(credit) {
  const held = Number.parseFloat(String(credit?.held || "0").replace(/,/g, ""));
  const palm = Number.isFinite(held) && held > 0 ? round(held) : DEMO_PALM;
  return {
    palm,
    posted: 0,
    credits: 0,
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
  const palm = Number.isFinite(Number(raw.palm)) ? Number(raw.palm) : base.palm;
  let posted = Number(raw.posted);
  if (!Number.isFinite(posted)) posted = Number(raw.collateral) || Number(raw.active) || Number(raw.wpalm) || 0;
  let credits = Number(raw.credits);
  if (!Number.isFinite(credits) || (raw.posted == null && raw.wpalm)) credits = posted;
  return {
    palm,
    posted: round(Math.max(0, posted)),
    credits: round(Math.max(0, credits)),
    supplied: round(Math.max(0, Number(raw.supplied) || 0)),
    borrowed: round(Math.max(0, Number(raw.borrowed) || 0)),
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

export function applyActivate(book, value) {
  if (value == null) return { error: "Enter an amount above zero." };
  if (value > book.palm) return { error: "Not enough free PALM to collateralize." };
  return {
    book: { ...book, palm: round(book.palm - value), posted: round(book.posted + value), credits: round(book.credits + value) },
    note: `Posted ${money(value)} PALM. ${money(value)} wPALM is now active.`,
  };
}

export function applyDeactivate(book, value) {
  if (value == null) return { error: "Enter an amount above zero." };
  const free = round(book.posted - book.borrowed);
  if (value > book.posted || value > book.credits || value > Math.max(0, free)) {
    return { error: "Only unborrowed posted PALM can come off collateral." };
  }
  return {
    book: { ...book, posted: round(book.posted - value), credits: round(book.credits - value), palm: round(book.palm + value) },
    note: `Released ${money(value)} PALM. That wPALM is no longer active.`,
  };
}

export function applySpend(book, kind, price) {
  if (book.credits < price) {
    return { error: "Not enough active wPALM. Collateralize PALM, or convert other crypto to credits." };
  }
  const credits = round(book.credits - price);
  const posted = round(Math.min(book.posted, credits));
  const names = { hamrin: "Hamrin", ops: "Ops hosting", crawler: "a crawler pane" };
  return {
    book: { ...book, credits, posted },
    note: `Spent ${money(price)} credits on ${names[kind] || "a PALM service"}. Credits are PALM, in another form.`,
  };
}

export function applyConvert(book, value) {
  if (value == null) return { error: "Enter how many credits you want." };
  return {
    book: { ...book, posted: round(book.posted + value), credits: round(book.credits + value) },
    note: `Converted other crypto → ${money(value)} credits. The desk posts matching PALM as collateral. Sketch.`,
  };
}

export function applySupply(book, value, into) {
  if (value == null) return { error: "Enter an amount above zero." };
  if (into) {
    if (value > book.palm) return { error: "Not enough free PALM to supply." };
    return {
      book: { ...book, palm: round(book.palm - value), supplied: round(book.supplied + value) },
      note: `Supplied ${money(value)} PALM to the pool. That PALM still backs wPALM.`,
    };
  }
  if (value > book.supplied) return { error: "You have not supplied that much." };
  const left = round(book.supplied - value);
  if (book.borrowed > left) return { error: "Pool PALM is backing a borrow. Repay first." };
  return {
    book: { ...book, supplied: left, palm: round(book.palm + value) },
    note: `Withdrew ${money(value)} PALM from the pool.`,
  };
}

export function applyBorrow(book, value) {
  if (value == null) return { error: "Enter an amount above zero." };
  const room = round(book.supplied - book.borrowed);
  if (value > room) return { error: "No unbacked mint. The pool can only lend PALM someone already supplied." };
  const max = round(book.posted * LTV - book.borrowed);
  if (value > max) return { error: `40% LTV on posted PALM. You can borrow ${money(Math.max(0, max))} more.` };
  return {
    book: { ...book, credits: round(book.credits + value), borrowed: round(book.borrowed + value) },
    note: `Borrowed ${money(value)} credits, backed by pool PALM.`,
  };
}

export function applyRepay(book, value) {
  if (value == null) return { error: "Enter an amount above zero." };
  const pay = Math.min(value, book.borrowed, book.credits);
  if (pay <= 0) return { error: "Nothing to repay, or not enough credits." };
  return {
    book: { ...book, credits: round(book.credits - pay), borrowed: round(book.borrowed - pay) },
    note: `Repaid ${money(pay)} credits to the pool.`,
  };
}

export function loanHealth(book) {
  if (!book || book.borrowed <= 0) return null;
  const capacity = book.posted * LTV;
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
