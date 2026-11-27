/** $PALM marketplace — platform escrow supervised by the PALM DAO. Local mock — nothing spends on-chain. */

const STORE_KEY = "root-web-marketplace-v2";

/** 1% of price collected as platform fee (basis points). */
export const ESCROW_FEE_BPS = 100;
/** Share of the 1% fee paid to DAO supervisors who watch escrow / settle disputes. */
export const DAO_SUPERVISOR_SHARE = 0.3;
/** Share of the 1% fee paid into $PALM holder revshare. */
export const REVSHARE_SHARE = 0.7;

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "service", label: "Services" },
  { id: "code", label: "Code" },
  { id: "design", label: "Design" },
  { id: "data", label: "Data" },
  { id: "other", label: "Other" },
];

export const STATUS = {
  open: { label: "Open", hint: "Waiting for a buyer" },
  funded: { label: "Escrow funded", hint: "$PALM locked on platform · DAO watching" },
  delivered: { label: "Delivered", hint: "Buyer reviews, then releases" },
  released: { label: "Released", hint: "Seller paid · fee split to DAO + revshare" },
  refunded: { label: "Refunded", hint: "Buyer got $PALM back · fee returned" },
  disputed: { label: "DAO review", hint: "Supervisors hold escrow until settled" },
  cancelled: { label: "Cancelled", hint: "Listing pulled" },
};

const SEED = [
  {
    id: "seed-hamrin-tune",
    title: "Hamrin prompt pack · agent workflows",
    blurb: "Twelve ready briefs for ship, debug, and repo review. Delivered as a markdown zip. Escrow in $PALM.",
    category: "code",
    price: 40,
    seller: "0x8a1f2c3d4e5f60718293a4b5c6d7e8f901234567",
    sellerTag: "rootdesk",
    status: "open",
    createdAt: "2026-11-20T10:00:00.000Z",
  },
  {
    id: "seed-ops-landing",
    title: "Ops landing page · Vite + React",
    blurb: "One-page site scaffold with Dockerfile, Hub-ready. Paid in $PALM through DAO escrow.",
    category: "code",
    price: 180,
    seller: "0xb7c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f80",
    sellerTag: "grove",
    status: "open",
    createdAt: "2026-11-21T14:20:00.000Z",
  },
  {
    id: "seed-brand-pack",
    title: "PALM desk brand kit",
    blurb: "Logo variants, type sheet, and dark/light tokens as SVG + CSS.",
    category: "design",
    price: 95,
    seller: "0xc1d2e3f405162738495a6b7c8d9e0f1122334455",
    sellerTag: "ink",
    status: "open",
    createdAt: "2026-11-22T09:05:00.000Z",
  },
  {
    id: "seed-crawl-flow",
    title: "Crawler flow · login + scrape",
    blurb: "Recorded flow package for a sample site. You adapt selectors.",
    category: "data",
    price: 120,
    seller: "0xd4e5f60718293a4b5c6d7e8f90123456789abcde",
    sellerTag: "spider",
    status: "open",
    createdAt: "2026-11-22T18:40:00.000Z",
  },
  {
    id: "seed-office-hours",
    title: "1h Ops office hours",
    blurb: "Live walkthrough of Hub, hosting, and domains for your wallet. Settled in $PALM.",
    category: "service",
    price: 250,
    seller: "0xe5f60718293a4b5c6d7e8f90123456789abcdef0",
    sellerTag: "ops",
    status: "open",
    createdAt: "2026-11-23T08:15:00.000Z",
  },
  {
    id: "seed-dao-review",
    title: "Escrow dispute second opinion",
    blurb: "Independent write-up for a contested $PALM escrow. For DAO supervisors and parties.",
    category: "service",
    price: 75,
    seller: "0xf60718293a4b5c6d7e8f90123456789abcdef012",
    sellerTag: "arbiter",
    status: "open",
    createdAt: "2026-11-24T11:00:00.000Z",
  },
];

function now() {
  return new Date().toISOString();
}

function uid(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function walletOf(address) {
  return String(address || "").toLowerCase();
}

function shortWallet(address) {
  const value = String(address || "");
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) return "—";
  return value.slice(0, 6) + "…" + value.slice(-4);
}

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function emptyLedger() {
  return { feesCollected: 0, daoSupervisors: 0, revshare: 0, releases: 0, disputes: 0 };
}

function readStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (raw && Array.isArray(raw.listings) && Array.isArray(raw.orders)) {
      return {
        listings: raw.listings,
        orders: raw.orders,
        ledger: raw.ledger && typeof raw.ledger === "object" ? { ...emptyLedger(), ...raw.ledger } : emptyLedger(),
      };
    }
  } catch {
    /* ignore */
  }
  return { listings: SEED.map((item) => ({ ...item })), orders: [], ledger: emptyLedger() };
}

function writeStore(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function feeOf(price) {
  const amount = Math.max(0, Number(price) || 0);
  return round2((amount * ESCROW_FEE_BPS) / 10000);
}

/** Split the 1% fee: 30% DAO supervisors, 70% $PALM revshare. */
export function feeSplit(price) {
  const fee = feeOf(price);
  const dao = round2(fee * DAO_SUPERVISOR_SHARE);
  const revshare = round2(fee - dao);
  return { fee, dao, revshare };
}

export function totalDue(price) {
  const amount = Math.max(0, Number(price) || 0);
  return round2(amount + feeOf(amount));
}

export function loadMarketplace() {
  return readStore();
}

export function daoStats(store) {
  const ledger = store?.ledger || emptyLedger();
  const openDisputes = (store?.orders || []).filter((order) => order.status === "disputed").length;
  const locked = (store?.orders || [])
    .filter((order) => ["funded", "delivered", "disputed"].includes(order.status))
    .reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  return {
    ...ledger,
    openDisputes,
    locked: round2(locked),
    feeBps: ESCROW_FEE_BPS,
    daoSharePct: Math.round(DAO_SUPERVISOR_SHARE * 100),
    revsharePct: Math.round(REVSHARE_SHARE * 100),
  };
}

export function listBrowse(store, { category = "all", query = "", mine = "", tab = "open" } = {}) {
  const q = String(query || "").trim().toLowerCase();
  const me = walletOf(mine);
  return (store.listings || [])
    .filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (tab === "open" && item.status !== "open") return false;
      if (tab === "mine" && walletOf(item.seller) !== me) return false;
      if (tab === "active") {
        const mineOrders = (store.orders || []).some(
          (order) =>
            order.listingId === item.id &&
            (walletOf(order.buyer) === me || walletOf(item.seller) === me) &&
            ["funded", "delivered", "disputed"].includes(order.status),
        );
        if (!mineOrders && walletOf(item.seller) !== me) return false;
        if (item.status === "cancelled" && !mineOrders) return false;
      }
      if (!q) return true;
      const hay = (item.title + " " + item.blurb + " " + (item.sellerTag || "") + " " + item.category).toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function ordersFor(store, address) {
  const me = walletOf(address);
  if (!me) return [];
  return (store.orders || [])
    .filter((order) => {
      const listing = (store.listings || []).find((item) => item.id === order.listingId);
      return walletOf(order.buyer) === me || walletOf(listing?.seller) === me;
    })
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));
}

export function createListing(store, { title, blurb, category, price, seller, sellerTag }) {
  const next = {
    id: uid("list"),
    title: String(title || "").trim().slice(0, 80),
    blurb: String(blurb || "").trim().slice(0, 280),
    category: CATEGORIES.some((item) => item.id === category && item.id !== "all") ? category : "other",
    price: Math.max(1, round2(price)),
    seller: walletOf(seller),
    sellerTag: String(sellerTag || shortWallet(seller)).replace(/^@/, "").slice(0, 24),
    status: "open",
    createdAt: now(),
  };
  if (!next.title || !next.seller) return { store, error: "Title and wallet are required." };
  const listings = [next, ...(store.listings || [])];
  const out = { ...store, listings };
  writeStore(out);
  return { store: out, listing: next };
}

export function cancelListing(store, listingId, seller) {
  const me = walletOf(seller);
  const listings = (store.listings || []).map((item) => {
    if (item.id !== listingId) return item;
    if (walletOf(item.seller) !== me) return item;
    if (item.status !== "open") return item;
    return { ...item, status: "cancelled", updatedAt: now() };
  });
  const out = { ...store, listings };
  writeStore(out);
  return { store: out };
}

export function fundEscrow(store, listingId, buyer) {
  const me = walletOf(buyer);
  const listing = (store.listings || []).find((item) => item.id === listingId);
  if (!listing) return { store, error: "Listing not found." };
  if (listing.status !== "open") return { store, error: "Listing is not open." };
  if (!me) return { store, error: "Connect a wallet to fund escrow." };
  if (walletOf(listing.seller) === me) return { store, error: "You cannot buy your own listing." };
  const split = feeSplit(listing.price);
  const order = {
    id: uid("esc"),
    listingId,
    buyer: me,
    price: listing.price,
    fee: split.fee,
    feeDao: split.dao,
    feeRevshare: split.revshare,
    total: totalDue(listing.price),
    status: "funded",
    supervisedBy: "palm-dao",
    createdAt: now(),
    updatedAt: now(),
    note: "Platform escrow · PALM DAO supervising",
  };
  const listings = (store.listings || []).map((item) =>
    item.id === listingId ? { ...item, status: "funded", orderId: order.id, updatedAt: now() } : item,
  );
  const orders = [order, ...(store.orders || [])];
  const out = { ...store, listings, orders };
  writeStore(out);
  return { store: out, order };
}

export function markDelivered(store, orderId, seller) {
  const me = walletOf(seller);
  const order = (store.orders || []).find((item) => item.id === orderId);
  if (!order) return { store, error: "Escrow not found." };
  const listing = (store.listings || []).find((item) => item.id === order.listingId);
  if (walletOf(listing?.seller) !== me) return { store, error: "Only the seller can mark delivered." };
  if (order.status !== "funded") return { store, error: "Escrow is not funded." };
  return patchOrder(store, orderId, { status: "delivered", note: "Seller marked delivered. DAO still watching." }, "delivered");
}

export function releaseEscrow(store, orderId, buyer) {
  const me = walletOf(buyer);
  const order = (store.orders || []).find((item) => item.id === orderId);
  if (!order) return { store, error: "Escrow not found." };
  if (walletOf(order.buyer) !== me) return { store, error: "Only the buyer can release." };
  if (order.status !== "delivered" && order.status !== "funded") return { store, error: "Nothing to release yet." };
  const split = feeSplit(order.price);
  const ledger = { ...(store.ledger || emptyLedger()) };
  ledger.feesCollected = round2(ledger.feesCollected + split.fee);
  ledger.daoSupervisors = round2(ledger.daoSupervisors + split.dao);
  ledger.revshare = round2(ledger.revshare + split.revshare);
  ledger.releases = (ledger.releases || 0) + 1;
  return patchOrder(
    { ...store, ledger },
    orderId,
    {
      status: "released",
      feeDao: split.dao,
      feeRevshare: split.revshare,
      note: `Seller paid. Fee ${split.fee} $PALM → ${split.dao} supervisors · ${split.revshare} revshare.`,
    },
    "released",
  );
}

export function refundEscrow(store, orderId, actor) {
  const me = walletOf(actor);
  const order = (store.orders || []).find((item) => item.id === orderId);
  if (!order) return { store, error: "Escrow not found." };
  const listing = (store.listings || []).find((item) => item.id === order.listingId);
  const allowed = walletOf(order.buyer) === me || walletOf(listing?.seller) === me;
  if (!allowed) return { store, error: "Not a party to this escrow." };
  if (!["funded", "delivered", "disputed"].includes(order.status)) return { store, error: "Cannot refund this escrow." };
  return patchOrder(store, orderId, { status: "refunded", note: "$PALM returned to buyer. Fee not taken." }, "cancelled");
}

export function disputeEscrow(store, orderId, actor) {
  const me = walletOf(actor);
  const order = (store.orders || []).find((item) => item.id === orderId);
  if (!order) return { store, error: "Escrow not found." };
  const listing = (store.listings || []).find((item) => item.id === order.listingId);
  const allowed = walletOf(order.buyer) === me || walletOf(listing?.seller) === me;
  if (!allowed) return { store, error: "Not a party to this escrow." };
  if (!["funded", "delivered"].includes(order.status)) return { store, error: "Cannot dispute this escrow." };
  const ledger = { ...(store.ledger || emptyLedger()) };
  ledger.disputes = (ledger.disputes || 0) + 1;
  return patchOrder(
    { ...store, ledger },
    orderId,
    { status: "disputed", note: "Escalated to PALM DAO supervisors. Escrow stays locked." },
    "disputed",
  );
}

/** Mock DAO supervisor settle — release to seller or refund buyer. */
export function daoSettle(store, orderId, outcome = "release") {
  const order = (store.orders || []).find((item) => item.id === orderId);
  if (!order) return { store, error: "Escrow not found." };
  if (order.status !== "disputed") return { store, error: "Only disputed escrow needs DAO settle." };
  if (outcome === "refund") {
    return patchOrder(store, orderId, { status: "refunded", note: "DAO supervisors refunded the buyer." }, "cancelled");
  }
  const split = feeSplit(order.price);
  const ledger = { ...(store.ledger || emptyLedger()) };
  ledger.feesCollected = round2(ledger.feesCollected + split.fee);
  ledger.daoSupervisors = round2(ledger.daoSupervisors + split.dao);
  ledger.revshare = round2(ledger.revshare + split.revshare);
  ledger.releases = (ledger.releases || 0) + 1;
  return patchOrder(
    { ...store, ledger },
    orderId,
    {
      status: "released",
      feeDao: split.dao,
      feeRevshare: split.revshare,
      note: `DAO released to seller. Fee ${split.fee} → supervisors ${split.dao} · revshare ${split.revshare}.`,
    },
    "released",
  );
}

function patchOrder(store, orderId, patch, listingStatus) {
  const orders = (store.orders || []).map((item) => (item.id === orderId ? { ...item, ...patch, updatedAt: now() } : item));
  const order = orders.find((item) => item.id === orderId);
  const listings = (store.listings || []).map((item) => {
    if (item.id !== order?.listingId) return item;
    return { ...item, status: listingStatus || item.status, updatedAt: now() };
  });
  const out = { ...store, orders, listings, ledger: store.ledger || emptyLedger() };
  writeStore(out);
  return { store: out, order };
}

export function resetMarketplace() {
  const out = { listings: SEED.map((item) => ({ ...item })), orders: [], ledger: emptyLedger() };
  writeStore(out);
  return out;
}

export function formatWallet(address) {
  return shortWallet(address);
}
