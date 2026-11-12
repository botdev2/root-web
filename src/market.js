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
    fetchPalmQuote()
      .then((quote) => {
        if (!cancelled && quote?.price) setPrice(quote.price);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return price;
}

export const MAJORS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "tron", symbol: "TRX", name: "TRON" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink" },
  { id: "sui", symbol: "SUI", name: "Sui" },
  { id: "uniswap", symbol: "UNI", name: "Uniswap" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "near", symbol: "NEAR", name: "NEAR" },
  { id: "pepe", symbol: "PEPE", name: "Pepe" },
];

export function formatUsd(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "—";
  if (amount >= 1000) return "$" + amount.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  if (amount >= 1) return "$" + amount.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  if (amount >= 0.01) return "$" + amount.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return "$" + Number(amount.toPrecision(3));
}

export function formatPct(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  const sign = amount > 0 ? "+" : "";
  return sign + amount.toFixed(2) + "%";
}

export function formatVol(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "—";
  if (amount >= 1e9) return "$" + (amount / 1e9).toFixed(2) + "B";
  if (amount >= 1e6) return "$" + (amount / 1e6).toFixed(2) + "M";
  if (amount >= 1e3) return "$" + (amount / 1e3).toFixed(1) + "K";
  return "$" + amount.toFixed(0);
}

export function tickClass(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount === 0) return "text-[var(--faint)]";
  return amount > 0 ? "text-[var(--green)]" : "text-[var(--rose)]";
}

export function tapeText(quotes) {
  return (quotes || [])
    .filter((item) => item?.symbol && item.price)
    .map((item) => `${item.symbol} ${formatUsd(item.price)} ${formatPct(item.change24h)}`)
    .join("  ·  ");
}

export function readWatchlist() {
  try {
    const rows = JSON.parse(localStorage.getItem("root-web-market-watch") || "null");
    if (Array.isArray(rows) && rows.length) return rows.map((item) => String(item).toUpperCase());
  } catch {
    /* ignore */
  }
  return ["PALM", "BTC", "ETH", "SOL"];
}

export function writeWatchlist(ids) {
  try {
    localStorage.setItem("root-web-market-watch", JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

function pairToQuote(pair, extra = {}) {
  const price = Number(pair?.priceUsd);
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    id: extra.id || pair.pairAddress || pair.baseToken?.address || "",
    symbol: String(extra.symbol || pair.baseToken?.symbol || "").toUpperCase(),
    name: extra.name || pair.baseToken?.name || pair.baseToken?.symbol || "",
    price,
    change24h: Number(pair.priceChange?.h24),
    volume: Number(pair.volume?.h24) || 0,
    liquidity: Number(pair.liquidity?.usd) || 0,
    url: pair.url || "",
    source: extra.source || "dex",
    featured: extra.featured === true,
    spark: extra.spark || [],
  };
}

export async function fetchPalmQuote() {
  const response = await fetch("https://api.dexscreener.com/latest/dex/tokens/" + PALM_TOKEN);
  const data = await response.json().catch(() => ({}));
  const pairs = Array.isArray(data.pairs) ? data.pairs.slice() : [];
  pairs.sort((a, b) => (Number(b.liquidity?.usd) || 0) - (Number(a.liquidity?.usd) || 0));
  return pairToQuote(pairs[0], { id: "palm", symbol: "PALM", name: "PALM", featured: true, source: "dex" });
}

async function fetchGeckoMajors() {
  const ids = MAJORS.map((item) => item.id).join(",");
  const response = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" +
      encodeURIComponent(ids) +
      "&order=market_cap_desc&sparkline=true&price_change_percentage=24h",
  );
  if (!response.ok) throw new Error("gecko");
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("gecko");
  const byId = Object.fromEntries(MAJORS.map((item) => [item.id, item]));
  return rows
    .map((row) => {
      const meta = byId[row.id] || { id: row.id, symbol: row.symbol, name: row.name };
      const price = Number(row.current_price);
      if (!Number.isFinite(price) || price <= 0) return null;
      return {
        id: meta.id,
        symbol: String(meta.symbol || row.symbol || "").toUpperCase(),
        name: meta.name || row.name,
        price,
        change24h: Number(row.price_change_percentage_24h),
        volume: Number(row.total_volume) || 0,
        liquidity: Number(row.market_cap) || 0,
        url: "https://www.coingecko.com/en/coins/" + row.id,
        source: "gecko",
        featured: false,
        spark: Array.isArray(row.sparkline_in_7d?.price) ? row.sparkline_in_7d.price : [],
      };
    })
    .filter(Boolean);
}

export async function searchDexQuotes(query) {
  const needle = String(query || "").trim();
  if (needle.length < 2) return [];
  const response = await fetch("https://api.dexscreener.com/latest/dex/search?q=" + encodeURIComponent(needle));
  const data = await response.json().catch(() => ({}));
  const pairs = Array.isArray(data.pairs) ? data.pairs.slice() : [];
  pairs.sort((a, b) => (Number(b.liquidity?.usd) || 0) - (Number(a.liquidity?.usd) || 0));
  const seen = new Set();
  const rows = [];
  for (const pair of pairs) {
    const quote = pairToQuote(pair, { source: "dex" });
    if (!quote || seen.has(quote.symbol)) continue;
    seen.add(quote.symbol);
    rows.push(quote);
    if (rows.length >= 10) break;
  }
  return rows;
}

async function fetchDexMajors() {
  const wanted = ["BTC", "ETH", "SOL", "BNB", "XRP"];
  const rows = await Promise.all(wanted.map((symbol) => searchDexQuotes(symbol).then((list) => list[0] || null)));
  return rows.filter(Boolean);
}

export async function loadMarketBoard() {
  const palm = await fetchPalmQuote().catch(() => null);
  let majors = [];
  try {
    majors = await fetchGeckoMajors();
  } catch {
    majors = await fetchDexMajors().catch(() => []);
  }
  const rows = [];
  if (palm) rows.push(palm);
  rows.push(...majors.filter((item) => item.symbol !== "PALM"));
  return rows;
}

export function useMarketQuotes(active = true) {
  const [quotes, setQuotes] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    const load = () =>
      loadMarketBoard()
        .then((rows) => {
          if (cancelled) return;
          if (rows.length) {
            setQuotes(rows);
            setUpdatedAt(Date.now());
            setError("");
          } else {
            setError("Quotes did not load.");
          }
        })
        .catch(() => {
          if (!cancelled) setError("Quotes did not load.");
        });
    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [active]);

  return { quotes, updatedAt, error };
}
