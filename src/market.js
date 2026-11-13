import { useEffect, useState } from "react";

export const PALM_TOKEN = "0xf1df7305E4BAB3885caB5B1e4dFC338452a67891";
export const PALM_MARK = "/palm-token.png";
export const SPECTRE_MARK = "/spectre-token.png";
export const RYFT_MARK = "/ryft-token.png";
export const DESK_TOKENS = [
  { id: "palm", symbol: "PALM", name: "PALM", address: PALM_TOKEN, logo: PALM_MARK },
  { id: "spectre", symbol: "SPECTRE", name: "SPECTRE AI", address: "0x9Cf0ED013e67DB12cA3AF8e7506fE401aA14dAd6", logo: SPECTRE_MARK },
  { id: "ryft", symbol: "RYFT", name: "RYFT Corp", address: "0xb0007D59fE4050A1636c2fa19038973d16481337", logo: RYFT_MARK },
];
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

export function mcapOf(item) {
  const mcap = Number(item?.mcap);
  if (Number.isFinite(mcap) && mcap > 0) return mcap;
  return Number(item?.liquidity) || 0;
}

export function tickClass(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount === 0) return "text-[var(--faint)]";
  return amount > 0 ? "text-[var(--green)]" : "text-[var(--rose)]";
}

export function vsChange(palm, other) {
  if (!Number.isFinite(palm?.change24h) || !Number.isFinite(other?.change24h)) return NaN;
  return palm.change24h - other.change24h;
}

export function logoCandidates(symbol, extra) {
  const sym = String(symbol || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const rows = [];
  if (sym === "palm") rows.push(PALM_MARK);
  if (sym === "spectre") rows.push(SPECTRE_MARK);
  if (sym === "ryft") rows.push(RYFT_MARK);
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
  if (snapshot?.event?.title) extra.unshift("Next " + snapshot.event.title + " " + formatEventWhen(snapshot.event.at));
  return [...extra, ...prints].filter(Boolean).join("  ·  ");
}

export function readWatchlist() {
  try {
    const rows = JSON.parse(localStorage.getItem("root-web-market-watch") || "null");
    if (Array.isArray(rows) && rows.length) return rows.map((item) => String(item).toUpperCase());
  } catch {
    /* ignore */
  }
  return ["PALM", "SPECTRE", "RYFT", "BTC", "ETH"];
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
    mcap: 0,
    high24h: NaN,
    low24h: NaN,
    rank: 0,
    logo: "",
    url: "",
    source: "",
    featured: false,
    spark: [],
    chainId: "",
    pairAddress: "",
    changes: null,
    ...partial,
  };
}

function pairToQuote(pair, extra = {}) {
  const price = Number(pair?.priceUsd);
  if (!Number.isFinite(price) || price <= 0) return null;
  const logo = extra.logo || pair.info?.imageUrl || pair.baseToken?.icon || "";
  return quoteShape({
    id: extra.id || pair.pairAddress || pair.baseToken?.address || "",
    symbol: String(extra.symbol || pair.baseToken?.symbol || "").toUpperCase(),
    name: extra.name || pair.baseToken?.name || pair.baseToken?.symbol || "",
    price,
    change24h: Number(pair.priceChange?.h24),
    volume: Number(pair.volume?.h24) || 0,
    liquidity: Number(pair.liquidity?.usd) || 0,
    mcap: Number(pair.marketCap) || Number(pair.fdv) || 0,
    logo,
    url: pair.url || "",
    source: extra.source || "dex",
    featured: extra.featured === true,
    spark: extra.spark || [],
    chainId: String(pair.chainId || extra.chainId || ""),
    pairAddress: String(pair.pairAddress || extra.pairAddress || ""),
    changes: pair.priceChange || extra.changes || null,
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
  const desk = await fetchDeskQuote(DESK_TOKENS[0]);
  return desk;
}

const GT_NET = {
  ethereum: "eth",
  eth: "eth",
  bsc: "bsc",
  "binance-smart-chain": "bsc",
  polygon: "polygon_pos",
  arbitrum: "arbitrum",
  optimism: "optimism",
  base: "base",
  avalanche: "avax",
  solana: "solana",
  fantom: "ftm",
  blast: "blast",
  linea: "linea",
  scroll: "scroll",
  zksync: "zksync",
  sonic: "sonic",
  hyperevm: "hyperevm",
  robinhood: "robinhood",
  "robinhood-chain": "robinhood",
};

const PAPRIKA_NET = {
  ethereum: "ethereum",
  eth: "ethereum",
  bsc: "bsc",
  polygon: "polygon",
  arbitrum: "arbitrum",
  optimism: "optimism",
  base: "base",
  avalanche: "avalanche",
  avax: "avalanche",
  solana: "solana",
  robinhood: "robinhood",
  "robinhood-chain": "robinhood",
};

function closesFromOhlcv(list) {
  if (!Array.isArray(list) || list.length < 2) return [];
  const rows = list
    .map((row) => {
      const ts = Number(Array.isArray(row) ? row[0] : row?.time_open ? Date.parse(row.time_open) : row?.timestamp);
      const close = Number(Array.isArray(row) ? row[4] : row?.close);
      return { ts: Number.isFinite(ts) ? ts : 0, close };
    })
    .filter((row) => Number.isFinite(row.close) && row.close > 0);
  rows.sort((a, b) => a.ts - b.ts);
  return rows.map((row) => row.close);
}

function sparkFromChanges(quote) {
  const price = Number(quote?.price);
  if (!Number.isFinite(price) || price <= 0) return [];
  const ch = quote?.changes || {};
  const pts = [];
  for (const key of ["h24", "h6", "h1", "m5"]) {
    const pct = Number(ch[key]);
    if (!Number.isFinite(pct)) continue;
    const past = price / (1 + pct / 100);
    if (past > 0) pts.push(past);
  }
  pts.push(price);
  return pts.length >= 2 ? pts : [];
}

const sparkCache = new Map();

async function fetchPairSpark(chainId, pairAddress) {
  const chain = String(chainId || "").toLowerCase();
  const pool = String(pairAddress || "").toLowerCase();
  if (!pool) return [];
  const key = chain + ":" + pool;
  const hit = sparkCache.get(key);
  if (hit && Date.now() - hit.at < 120000) return hit.spark;
  const gt = GT_NET[chain] || chain;
  const paprika = PAPRIKA_NET[chain] || chain;
  const urls = [
    "https://api.geckoterminal.com/api/v2/networks/" + gt + "/pools/" + pool + "/ohlcv/hour",
    "https://api.dexpaprika.com/networks/" + paprika + "/pools/" + pool + "/ohlcv?start=-24h&interval=1h",
  ];
  for (const url of urls) {
    try {
      const data = await getJson(url, 7000);
      const gtList = data?.data?.attributes?.ohlcv_list;
      const paprikaList = Array.isArray(data) ? data : data?.ohlcv;
      const closes = closesFromOhlcv(gtList || paprikaList);
      if (closes.length >= 2) {
        const spark = closes.length > 48 ? closes.slice(-48) : closes;
        sparkCache.set(key, { at: Date.now(), spark });
        return spark;
      }
    } catch {
      /* next source */
    }
  }
  return [];
}

async function fillDeskSpark(quote) {
  if (!quote) return quote;
  if (quote.spark?.length >= 8) return quote;
  const spark = await fetchPairSpark(quote.chainId, quote.pairAddress).catch(() => []);
  quote.spark = spark.length >= 2 ? spark : sparkFromChanges(quote);
  if (quote.spark.length) {
    const hi = Math.max(...quote.spark);
    const lo = Math.min(...quote.spark);
    if (!Number.isFinite(quote.high24h)) quote.high24h = hi;
    if (!Number.isFinite(quote.low24h)) quote.low24h = lo;
  }
  return quote;
}

async function fetchDeskQuote(token) {
  const data = await getJson("https://api.dexscreener.com/latest/dex/tokens/" + token.address);
  const pairs = Array.isArray(data.pairs) ? data.pairs.slice() : [];
  pairs.sort((a, b) => (Number(b.liquidity?.usd) || 0) - (Number(a.liquidity?.usd) || 0));
  return pairToQuote(pairs[0], {
    id: token.id,
    symbol: token.symbol,
    name: token.name,
    featured: true,
    source: "dex",
    logo: token.logo || "",
  });
}

async function fetchDeskTokens() {
  const rows = (await Promise.all(DESK_TOKENS.map((token) => fetchDeskQuote(token).catch(() => null)))).filter(Boolean);
  await Promise.all(rows.map((row) => fillDeskSpark(row).catch(() => row)));
  return rows;
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
        mcap: Number(row.market_cap) || 0,
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
        mcap: Number(row.marketCapUsd) || 0,
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

function eventWeight(title, currency) {
  const t = String(title || "").toLowerCase();
  let w = 20;
  if (/fomc rate|interest rate decision|fed funds/.test(t)) w = 100;
  else if (/non-farm|nonfarm|payroll/.test(t)) w = 96;
  else if (/\bcpi\b/.test(t) && !/ex food|core|harmonised/.test(t)) w = 94;
  else if (/core cpi/.test(t)) w = 88;
  else if (/fomc minutes/.test(t)) w = 86;
  else if ((/\bppi\b/.test(t) || /producer price/.test(t)) && !/ex food|core/.test(t)) w = 84;
  else if (/\bgdp\b/.test(t)) w = 82;
  else if (/retail sales/.test(t) && !/control/.test(t)) w = 78;
  else if (/unemployment|jobless/.test(t)) w = 74;
  else if (/speaks|speech/.test(t)) w = 28;
  if (String(currency || "").toUpperCase() === "USD") w += 6;
  return w;
}

export function formatEventWhen(at, now = Date.now()) {
  const ms = Number(at) - now;
  if (!Number.isFinite(Number(at)) || Number(at) <= 0) return "";
  if (ms <= 0 && ms > -30 * 60 * 1000) return "printing";
  if (ms <= 0) return "";
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return min + "m";
  const hr = Math.floor(min / 60);
  const rem = min % 60;
  if (hr < 24) return rem ? hr + "h " + rem + "m" : hr + "h";
  const days = Math.floor(hr / 24);
  const left = hr % 24;
  return left ? days + "d " + left + "h" : days + "d";
}

function cleanCalendarEvent(row) {
  const ts = Number(row?.ts);
  const at = Number.isFinite(ts) && ts > 1e12 ? ts : Number.isFinite(ts) && ts > 0 ? ts * 1000 : Date.parse(row?.time || row?.date || "");
  if (!Number.isFinite(at) || at <= 0) return null;
  const title = String(row?.title || "").trim();
  if (!title) return null;
  return {
    title,
    at,
    currency: String(row.currency || row.country || "USD").toUpperCase(),
    impact: String(row.impact || "high").toLowerCase(),
    forecast: String(row.forecast || ""),
    previous: String(row.previous || ""),
    actual: String(row.actual || ""),
    source: row.source || "USD calendar",
    url: row.url || "https://showmytrades.com/tools/economic-calendar",
  };
}

function pickNextEvent(rows, now = Date.now()) {
  const floor = now - 20 * 60 * 1000;
  const live = (rows || []).map(cleanCalendarEvent).filter((row) => row && row.at >= floor);
  live.sort((a, b) => a.at - b.at || eventWeight(b.title, b.currency) - eventWeight(a.title, a.currency));
  return live[0] || null;
}

async function fetchShowMyTradesEvent() {
  const data = await getJson("https://showmytrades.com/api/public/calendar/v1?currency=USD,EUR&impact=high&days=14");
  const rows = Array.isArray(data?.events) ? data.events : [];
  const next = pickNextEvent(rows);
  if (!next) return null;
  next.source = "USD calendar";
  return next;
}

async function fetchForexFactoryEvent() {
  const rows = await getJson("https://nfs.faireconomy.media/ff_calendar_thisweek.json");
  const list = Array.isArray(rows) ? rows : [];
  const mapped = list
    .filter((row) => String(row.impact || "").toLowerCase() === "high")
    .map((row) => ({
      title: row.title,
      date: row.date,
      currency: row.country,
      impact: row.impact,
      forecast: row.forecast,
      previous: row.previous,
      source: "Forex Factory",
      url: "https://www.forexfactory.com/calendar",
    }));
  return pickNextEvent(mapped);
}

async function fetchNextEvent() {
  const first = await fetchShowMyTradesEvent().catch(() => null);
  if (first) return first;
  return fetchForexFactoryEvent().catch(() => null);
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
  if (from.featured && from.liquidity) next.liquidity = from.liquidity;
  else if (!next.liquidity && from.liquidity) next.liquidity = from.liquidity;
  if (from.mcap && (from.featured || !next.mcap)) next.mcap = from.mcap;
  if (!next.rank && from.rank) next.rank = from.rank;
  if (from.featured) {
    next.featured = true;
    if (from.logo) next.logo = from.logo;
    if (from.name) next.name = from.name;
  } else if (!next.logo && from.logo) next.logo = from.logo;
  if (!next.spark?.length && from.spark?.length) next.spark = from.spark;
  if (!Number.isFinite(next.high24h) && Number.isFinite(from.high24h)) next.high24h = from.high24h;
  if (!Number.isFinite(next.low24h) && Number.isFinite(from.low24h)) next.low24h = from.low24h;
  if (!next.name || next.name === next.symbol) next.name = from.name || next.name;
  if (from.source && next.source !== "dex") next.source = next.source || from.source;
  return next;
}

export async function loadMarketBoard() {
  const jobs = await Promise.allSettled([
    fetchDeskTokens(),
    fetchCoinCap(),
    fetchGeckoMajors(),
    fetchBinanceTickers(),
    fetchBinanceSparks(),
    fetchPaprikaGlobal(),
    fetchFearGreed(),
    fetchFunding(),
    fetchMempoolFees(),
    fetchNextEvent(),
  ]);
  const desk = settled(jobs[0]) || [];
  const coincap = settled(jobs[1]) || [];
  const gecko = settled(jobs[2]) || [];
  const binance = settled(jobs[3]) || [];
  const sparks = settled(jobs[4]) || {};
  const global = settled(jobs[5]) || { mcap: 0, volume: 0, btcDom: 0, ethDom: 0, coins: 0 };
  const fng = settled(jobs[6]);
  const funding = settled(jobs[7]) || [];
  const fees = settled(jobs[8]);
  const event = settled(jobs[9]);

  const map = new Map();
  const put = (row) => {
    if (!row?.symbol) return;
    map.set(row.symbol, mergeQuote(map.get(row.symbol), row));
  };
  coincap.forEach(put);
  gecko.forEach(put);
  binance.forEach(put);
  desk.forEach(put);

  for (const [symbol, spark] of Object.entries(sparks)) {
    const row = map.get(symbol);
    if (row && (!row.spark || row.spark.length < 8) && spark?.length) row.spark = spark;
  }

  const btc = map.get("BTC");
  const eth = map.get("ETH");
  if (btc?.liquidity && global.mcap) {
    /* keep paprika dominance when present */
  } else if (btc?.liquidity) {
    const total = [...map.values()].reduce((sum, item) => sum + mcapOf(item), 0);
    if (total > 0) {
      global.mcap = global.mcap || total;
      global.btcDom = global.btcDom || (mcapOf(btc) / total) * 100;
      global.ethDom = eth ? (mcapOf(eth) / total) * 100 : 0;
    }
  }
  if (eth && global.mcap && !global.ethDom) global.ethDom = (mcapOf(eth) / global.mcap) * 100;

  const preferred = ["PALM", "SPECTRE", "RYFT", ...MAJORS.map((item) => item.symbol)];
  const rankOf = (symbol) => {
    const at = preferred.indexOf(symbol);
    return at === -1 ? 1000 : at;
  };
  const quotes = [...map.values()]
    .filter((item) => item.price)
    .sort((a, b) => rankOf(a.symbol) - rankOf(b.symbol) || (a.rank || 999) - (b.rank || 999));

  return { quotes, global, fng, funding, fees, event };
}

export function useMarketQuotes(active = true) {
  const [quotes, setQuotes] = useState([]);
  const [global, setGlobal] = useState(null);
  const [fng, setFng] = useState(null);
  const [funding, setFunding] = useState([]);
  const [fees, setFees] = useState(null);
  const [event, setEvent] = useState(null);
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
            setEvent(data.event || null);
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

  return { quotes, global, fng, funding, fees, event, updatedAt, error };
}
