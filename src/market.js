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

export function logoCandidates(symbol, extra) {
  const sym = String(symbol || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const rows = [];
  if (sym === "palm") rows.push("/palm.png");
  if (extra) rows.push(extra);
  if (sym) {
    rows.push("https://assets.coincap.io/assets/icons/" + sym + "@2x.png");
    rows.push("https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/" + sym + ".svg");
    rows.push("https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/" + sym + ".png");
  }
  return [...new Set(rows.filter(Boolean))];
}

export function tapeText(snapshot) {
  const quotes = Array.isArray(snapshot) ? snapshot : snapshot?.quotes || [];
  const prints = quotes
    .filter((item) => item?.symbol && item.price)
    .slice(0, 18)
    .map((item) => `${item.symbol} ${formatUsd(item.price)} ${formatPct(item.change24h)}`);
  const extra = [];
  const global = snapshot?.global;
  if (Number.isFinite(global?.btcDom)) extra.push("BTC.D " + global.btcDom.toFixed(1) + "%");
  if (Number.isFinite(global?.ethDom)) extra.push("ETH.D " + global.ethDom.toFixed(1) + "%");
  if (Number.isFinite(global?.mcap)) extra.push("mcap " + formatVol(global.mcap));
  if (snapshot?.fng?.value) extra.push("F&G " + snapshot.fng.value + " " + (snapshot.fng.label || ""));
  if (snapshot?.fees?.fastestFee) extra.push("BTC fee " + snapshot.fees.fastestFee + " sat/vB");
  const ranked = quotes.filter((item) => item.symbol !== "PALM" && Number.isFinite(item.change24h)).slice().sort((a, b) => b.change24h - a.change24h);
  if (ranked[0]) extra.push("lead " + ranked[0].symbol + " " + formatPct(ranked[0].change24h));
  if (ranked.length) extra.push("lag " + ranked[ranked.length - 1].symbol + " " + formatPct(ranked[ranked.length - 1].change24h));
  const fund = (snapshot?.funding || []).find((item) => item.symbol === "BTC");
  if (fund && Number.isFinite(fund.rate)) extra.push("BTC fund " + (fund.rate * 100).toFixed(4) + "%");
  return [...extra, ...prints].filter(Boolean).join("  ·  ");
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

const BINANCE_PAIRS = [
  ["BTC", "BTCUSDT"],
  ["ETH", "ETHUSDT"],
  ["SOL", "SOLUSDT"],
  ["BNB", "BNBUSDT"],
  ["XRP", "XRPUSDT"],
  ["DOGE", "DOGEUSDT"],
  ["ADA", "ADAUSDT"],
  ["TRX", "TRXUSDT"],
  ["AVAX", "AVAXUSDT"],
  ["LINK", "LINKUSDT"],
  ["SUI", "SUIUSDT"],
  ["UNI", "UNIUSDT"],
  ["DOT", "DOTUSDT"],
  ["NEAR", "NEARUSDT"],
  ["PEPE", "PEPEUSDT"],
];

function quoteShape(partial) {
  return {
    id: "",
    symbol: "",
    name: "",
    price: 0,
    change24h: NaN,
    volume: 0,
    liquidity: 0,
    high24h: NaN,
    low24h: NaN,
    rank: 0,
    logo: "",
    url: "",
    source: "",
    featured: false,
    spark: [],
    ...partial,
  };
}

function pairToQuote(pair, extra = {}) {
  const price = Number(pair?.priceUsd);
  if (!Number.isFinite(price) || price <= 0) return null;
  const logo = pair.info?.imageUrl || pair.baseToken?.icon || extra.logo || "";
  return quoteShape({
    id: extra.id || pair.pairAddress || pair.baseToken?.address || "",
    symbol: String(extra.symbol || pair.baseToken?.symbol || "").toUpperCase(),
    name: extra.name || pair.baseToken?.name || pair.baseToken?.symbol || "",
    price,
    change24h: Number(pair.priceChange?.h24),
    volume: Number(pair.volume?.h24) || 0,
    liquidity: Number(pair.liquidity?.usd) || 0,
    logo,
    url: pair.url || "",
    source: extra.source || "dex",
    featured: extra.featured === true,
    spark: extra.spark || [],
  });
}

async function getJson(url, ms = 8000) {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), ms);
  try {
    const response = await fetch(url, { signal: ctrl.signal });
    if (!response.ok) throw new Error(String(response.status));
    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

function settled(value) {
  return value?.status === "fulfilled" ? value.value : null;
}

export async function fetchPalmQuote() {
  const data = await getJson("https://api.dexscreener.com/latest/dex/tokens/" + PALM_TOKEN);
  const pairs = Array.isArray(data.pairs) ? data.pairs.slice() : [];
  pairs.sort((a, b) => (Number(b.liquidity?.usd) || 0) - (Number(a.liquidity?.usd) || 0));
  return pairToQuote(pairs[0], { id: "palm", symbol: "PALM", name: "PALM", featured: true, source: "dex", logo: "/palm.png" });
}

async function fetchGeckoMajors() {
  const ids = MAJORS.map((item) => item.id).join(",");
  const rows = await getJson(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" +
      encodeURIComponent(ids) +
      "&order=market_cap_desc&sparkline=true&price_change_percentage=24h",
  );
  if (!Array.isArray(rows)) throw new Error("gecko");
  const byId = Object.fromEntries(MAJORS.map((item) => [item.id, item]));
  return rows
    .map((row) => {
      const meta = byId[row.id] || { id: row.id, symbol: row.symbol, name: row.name };
      const price = Number(row.current_price);
      if (!Number.isFinite(price) || price <= 0) return null;
      return quoteShape({
        id: meta.id,
        symbol: String(meta.symbol || row.symbol || "").toUpperCase(),
        name: meta.name || row.name,
        price,
        change24h: Number(row.price_change_percentage_24h),
        volume: Number(row.total_volume) || 0,
        liquidity: Number(row.market_cap) || 0,
        high24h: Number(row.high_24h),
        low24h: Number(row.low_24h),
        rank: Number(row.market_cap_rank) || 0,
        logo: row.image || "",
        url: "https://www.coingecko.com/en/coins/" + row.id,
        source: "gecko",
        spark: Array.isArray(row.sparkline_in_7d?.price) ? row.sparkline_in_7d.price : [],
      });
    })
    .filter(Boolean);
}

async function fetchCoinCap() {
  const data = await getJson("https://api.coincap.io/v2/assets?limit=40");
  const rows = Array.isArray(data.data) ? data.data : [];
  return rows
    .map((row) => {
      const price = Number(row.priceUsd);
      if (!Number.isFinite(price) || price <= 0) return null;
      const symbol = String(row.symbol || "").toUpperCase();
      return quoteShape({
        id: row.id,
        symbol,
        name: row.name || symbol,
        price,
        change24h: Number(row.changePercent24Hr),
        volume: Number(row.volumeUsd24Hr) || 0,
        liquidity: Number(row.marketCapUsd) || 0,
        rank: Number(row.rank) || 0,
        logo: "https://assets.coincap.io/assets/icons/" + String(symbol).toLowerCase() + "@2x.png",
        url: "https://coincap.io/assets/" + row.id,
        source: "coincap",
      });
    })
    .filter(Boolean);
}

async function fetchBinanceTickers() {
  const symbols = BINANCE_PAIRS.map((item) => item[1]);
  const rows = await getJson("https://api.binance.com/api/v3/ticker/24hr?symbols=" + encodeURIComponent(JSON.stringify(symbols)));
  const list = Array.isArray(rows) ? rows : [];
  const byPair = Object.fromEntries(BINANCE_PAIRS);
  const invert = Object.fromEntries(BINANCE_PAIRS.map(([sym, pair]) => [pair, sym]));
  return list
    .map((row) => {
      const symbol = invert[row.symbol];
      const price = Number(row.lastPrice);
      if (!symbol || !Number.isFinite(price) || price <= 0) return null;
      return quoteShape({
        id: byPair[symbol],
        symbol,
        name: symbol,
        price,
        change24h: Number(row.priceChangePercent),
        volume: Number(row.quoteVolume) || 0,
        high24h: Number(row.highPrice),
        low24h: Number(row.lowPrice),
        url: "https://www.binance.com/en/trade/" + row.symbol,
        source: "binance",
      });
    })
    .filter(Boolean);
}

async function fetchBinanceSparks() {
  const wanted = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
  const rows = await Promise.all(
    wanted.map(async (pair) => {
      const klines = await getJson("https://api.binance.com/api/v3/klines?symbol=" + pair + "&interval=1h&limit=48", 7000);
      return { pair, spark: Array.isArray(klines) ? klines.map((item) => Number(item[4])).filter(Number.isFinite) : [] };
    }),
  );
  const invert = Object.fromEntries(BINANCE_PAIRS.map(([sym, pair]) => [pair, sym]));
  return Object.fromEntries(rows.map((row) => [invert[row.pair], row.spark]).filter((item) => item[0]));
}

async function fetchFunding() {
  const rows = await getJson("https://fapi.binance.com/fapi/v1/premiumIndex");
  const list = Array.isArray(rows) ? rows : [];
  const wanted = new Set(BINANCE_PAIRS.map((item) => item[1]));
  const invert = Object.fromEntries(BINANCE_PAIRS.map(([sym, pair]) => [pair, sym]));
  return list
    .filter((row) => wanted.has(row.symbol))
    .map((row) => ({
      symbol: invert[row.symbol],
      rate: Number(row.lastFundingRate),
      mark: Number(row.markPrice),
    }))
    .filter((row) => row.symbol && Number.isFinite(row.rate));
}

async function fetchFearGreed() {
  const data = await getJson("https://api.alternative.me/fng/?limit=1");
  const row = data.data?.[0];
  const value = Number(row?.value);
  if (!Number.isFinite(value)) return null;
  return { value, label: row.value_classification || "" };
}

async function fetchPaprikaGlobal() {
  const data = await getJson("https://api.coinpaprika.com/v1/global");
  return {
    mcap: Number(data.market_cap_usd) || 0,
    volume: Number(data.volume_24h_usd) || 0,
    btcDom: Number(data.bitcoin_dominance_percentage) || 0,
    coins: Number(data.cryptocurrencies_number) || 0,
    ethDom: 0,
  };
}

async function fetchMempoolFees() {
  const data = await getJson("https://mempool.space/api/v1/fees/recommended");
  return {
    fastestFee: Number(data.fastestFee) || 0,
    halfHourFee: Number(data.halfHourFee) || 0,
    hourFee: Number(data.hourFee) || 0,
  };
}

export async function searchDexQuotes(query) {
  const needle = String(query || "").trim();
  if (needle.length < 2) return [];
  const data = await getJson("https://api.dexscreener.com/latest/dex/search?q=" + encodeURIComponent(needle));
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

function mergeQuote(into, from) {
  if (!from) return into;
  if (!into) return from;
  const next = { ...into };
  if (!next.price && from.price) next.price = from.price;
  if (from.source === "binance" && from.price) {
    next.price = from.price;
    next.change24h = from.change24h;
    next.high24h = from.high24h;
    next.low24h = from.low24h;
    if (from.volume) next.volume = from.volume;
  }
  if (!Number.isFinite(next.change24h) && Number.isFinite(from.change24h)) next.change24h = from.change24h;
  if ((!next.volume || from.volume > next.volume) && from.source !== "binance") next.volume = from.volume || next.volume;
  if (!next.liquidity && from.liquidity) next.liquidity = from.liquidity;
  if (!next.rank && from.rank) next.rank = from.rank;
  if (!next.logo && from.logo) next.logo = from.logo;
  if (!next.spark?.length && from.spark?.length) next.spark = from.spark;
  if (!Number.isFinite(next.high24h) && Number.isFinite(from.high24h)) next.high24h = from.high24h;
  if (!Number.isFinite(next.low24h) && Number.isFinite(from.low24h)) next.low24h = from.low24h;
  if (!next.name || next.name === next.symbol) next.name = from.name || next.name;
  if (from.source && next.source !== "dex") next.source = next.source || from.source;
  return next;
}

export async function loadMarketBoard() {
  const jobs = await Promise.allSettled([
    fetchPalmQuote(),
    fetchCoinCap(),
    fetchGeckoMajors(),
    fetchBinanceTickers(),
    fetchBinanceSparks(),
    fetchPaprikaGlobal(),
    fetchFearGreed(),
    fetchFunding(),
    fetchMempoolFees(),
  ]);
  const palm = settled(jobs[0]);
  const coincap = settled(jobs[1]) || [];
  const gecko = settled(jobs[2]) || [];
  const binance = settled(jobs[3]) || [];
  const sparks = settled(jobs[4]) || {};
  const global = settled(jobs[5]) || { mcap: 0, volume: 0, btcDom: 0, ethDom: 0, coins: 0 };
  const fng = settled(jobs[6]);
  const funding = settled(jobs[7]) || [];
  const fees = settled(jobs[8]);

  const map = new Map();
  const put = (row) => {
    if (!row?.symbol) return;
    map.set(row.symbol, mergeQuote(map.get(row.symbol), row));
  };
  coincap.forEach(put);
  gecko.forEach(put);
  binance.forEach(put);
  if (palm) put(palm);

  for (const [symbol, spark] of Object.entries(sparks)) {
    const row = map.get(symbol);
    if (row && (!row.spark || row.spark.length < 8) && spark?.length) row.spark = spark;
  }

  const btc = map.get("BTC");
  const eth = map.get("ETH");
  if (btc?.liquidity && global.mcap) {
    /* keep paprika dominance when present */
  } else if (btc?.liquidity) {
    const total = [...map.values()].reduce((sum, item) => sum + (Number(item.liquidity) || 0), 0);
    if (total > 0) {
      global.mcap = global.mcap || total;
      global.btcDom = global.btcDom || (btc.liquidity / total) * 100;
      global.ethDom = eth?.liquidity ? (eth.liquidity / total) * 100 : 0;
    }
  }
  if (eth?.liquidity && global.mcap && !global.ethDom) global.ethDom = (eth.liquidity / global.mcap) * 100;

  const preferred = new Set(["PALM", ...MAJORS.map((item) => item.symbol)]);
  const quotes = [...map.values()]
    .filter((item) => item.price)
    .sort((a, b) => {
      if (a.symbol === "PALM") return -1;
      if (b.symbol === "PALM") return 1;
      const aPref = preferred.has(a.symbol) ? 1 : 0;
      const bPref = preferred.has(b.symbol) ? 1 : 0;
      if (aPref !== bPref) return bPref - aPref;
      return (a.rank || 999) - (b.rank || 999);
    });

  return { quotes, global, fng, funding, fees };
}

export function useMarketQuotes(active = true) {
  const [quotes, setQuotes] = useState([]);
  const [global, setGlobal] = useState(null);
  const [fng, setFng] = useState(null);
  const [funding, setFunding] = useState([]);
  const [fees, setFees] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    const load = () =>
      loadMarketBoard()
        .then((data) => {
          if (cancelled) return;
          if (data.quotes?.length) {
            setQuotes(data.quotes);
            setGlobal(data.global || null);
            setFng(data.fng || null);
            setFunding(data.funding || []);
            setFees(data.fees || null);
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

  return { quotes, global, fng, funding, fees, updatedAt, error };
}
