import { useEffect, useState } from "react";

export const PALM_TOKEN = "0xf1df7305E4BAB3885caB5B1e4dFC338452a67891";
export const HAMRIN = 10;
export const OPS_MONTH = 2500;
export const CRAWLER = 1000;
export const LTV = 0.4;
export const LIQ_LTV = 0.75;
export const SUPPLY_APY = 0.08;
export const BORROW_APY = 0.12;
export const LISTINGS = [
  { id: "hamrin", name: "Hamrin", wpalm: HAMRIN, note: "Inference" },
  { id: "ops", name: "Ops hosting · 30 days", wpalm: OPS_MONTH, note: "ops.palmaierc.com" },
  { id: "crawler", name: "Crawler pane", wpalm: CRAWLER, note: "Extra live pane" },
];

function round(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function money(value) {
  const amount = Number(value) || 0;
  return amount.toLocaleString("en-US", { maximumFractionDigits: amount < 10 ? 2 : 0 });
}

export function palmAmount(text) {
  const value = Number.parseFloat(String(text || "0").replace(/,/g, ""));
  return Number.isFinite(value) ? value : 0;
}

export function holdingsOf(credit) {
  return round(palmAmount(credit?.held) + palmAmount(credit?.staked));
}

/** An address has as much wPALM as PALM in the wallet plus staked. */
export function wpalmOf(credit) {
  return holdingsOf(credit);
}

/** 1 wPALM = 1 PALM, so USD is the PALM price. */
export function usd(amount, price) {
  if (!Number.isFinite(price) || price <= 0) return "—";
  const value = (Number(amount) || 0) * price;
  if (value === 0) return "$0";
  if (value < 0.01) return "$" + value.toPrecision(2);
  return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

export function usePalmUsd() {
  const [price, setPrice] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.dexscreener.com/latest/dex/tokens/" + PALM_TOKEN)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        const pairs = Array.isArray(data.pairs) ? data.pairs : [];
        pairs.sort((a, b) => (Number(b.liquidity?.usd) || 0) - (Number(a.liquidity?.usd) || 0));
        const value = Number(pairs[0]?.priceUsd);
        if (Number.isFinite(value) && value > 0) setPrice(value);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return price;
}
