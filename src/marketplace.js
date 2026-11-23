/** P2P marketplace with PALM as escrow between peers. Local mock — nothing spends on-chain. */

const STORE_KEY = "root-web-marketplace-v1";

export const ESCROW_FEE_BPS = 100; // 1% desk fee, mock
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
  funded: { label: "Escrow funded", hint: "PALM locked · seller delivers" },
  delivered: { label: "Delivered", hint: "Buyer reviews, then releases" },
  released: { label: "Released", hint: "Seller paid from escrow" },
  refunded: { label: "Refunded", hint: "Buyer got PALM back" },
  disputed: { label: "Disputed", hint: "Held until settled" },
  cancelled: { label: "Cancelled", hint: "Listing pulled" },
};

const SEED = [
  {
    id: "seed-hamrin-tune",
    title: "Hamrin prompt pack · agent workflows",
    blurb: "Twelve ready briefs for ship, debug, and repo review. Delivered as a markdown zip.",
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
    blurb: "One-page site scaffold with Dockerfile, Hub-ready. You get the repo.",
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
    blurb: "Live walkthrough of Hub, hosting, and domains for your wallet.",
    category: "service",
    price: 250,
    seller: "0xe5f60718293a4b5c6d7e8f90123456789abcdef0",
    sellerTag: "ops",
    status: "open",
    createdAt: "2026-11-23T08:15:00.000Z",
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

function readStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (raw && Array.isArray(raw.listings) && Array.isArray(raw.orders)) return raw;
  } catch {
    /* ignore */
  }
  return { listings: SEED.map((item) => ({ ...item })), orders: [] };
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
  return Math.round(amount * ESCROW_FEE_BPS) / 10000;
}

export function totalDue(price) {
  const amount = Math.max(0, Number(price) || 0);
  return Math.round((amount + feeOf(amount)) * 100) / 100;
}

export function loadMarketplace() {
  return readStore();
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
          (order) => order.listingId === item.id && (walletOf(order.buyer) === me || walletOf(item.seller) === me) && ["funded", "delivered", "disputed"].includes(order.status),
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
    price: Math.max(1, Math.round((Number(price) || 0) * 100) / 100),
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
  const order = {
    id: uid("esc"),
    listingId,
    buyer: me,
    price: listing.price,
    fee: feeOf(listing.price),
    total: totalDue(listing.price),
    status: "funded",
    createdAt: now(),
    updatedAt: now(),
    note: "",
  };
  const listings = (store.listings || []).map((item) => (item.id === listingId ? { ...item, status: "funded", orderId: order.id, updatedAt: now() } : item));
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
  return patchOrder(store, orderId, { status: "delivered", note: "Seller marked delivered." }, "delivered");
}

export function releaseEscrow(store, orderId, buyer) {
  const me = walletOf(buyer);
  const order = (store.orders || []).find((item) => item.id === orderId);
  if (!order) return { store, error: "Escrow not found." };
  if (walletOf(order.buyer) !== me) return { store, error: "Only the buyer can release." };
  if (order.status !== "delivered" && order.status !== "funded") return { store, error: "Nothing to release yet." };
  return patchOrder(store, orderId, { status: "released", note: "Buyer released PALM to seller." }, "released");
}

export function refundEscrow(store, orderId, actor) {
  const me = walletOf(actor);
  const order = (store.orders || []).find((item) => item.id === orderId);
  if (!order) return { store, error: "Escrow not found." };
  const listing = (store.listings || []).find((item) => item.id === order.listingId);
  const allowed = walletOf(order.buyer) === me || walletOf(listing?.seller) === me;
  if (!allowed) return { store, error: "Not a party to this escrow." };
  if (!["funded", "delivered", "disputed"].includes(order.status)) return { store, error: "Cannot refund this escrow." };
  return patchOrder(store, orderId, { status: "refunded", note: "PALM returned to buyer." }, "cancelled");
}

export function disputeEscrow(store, orderId, actor) {
  const me = walletOf(actor);
  const order = (store.orders || []).find((item) => item.id === orderId);
  if (!order) return { store, error: "Escrow not found." };
  const listing = (store.listings || []).find((item) => item.id === order.listingId);
  const allowed = walletOf(order.buyer) === me || walletOf(listing?.seller) === me;
  if (!allowed) return { store, error: "Not a party to this escrow." };
  if (!["funded", "delivered"].includes(order.status)) return { store, error: "Cannot dispute this escrow." };
  return patchOrder(store, orderId, { status: "disputed", note: "Held. Both parties must settle." }, "disputed");
}

function patchOrder(store, orderId, patch, listingStatus) {
  const orders = (store.orders || []).map((item) => (item.id === orderId ? { ...item, ...patch, updatedAt: now() } : item));
  const order = orders.find((item) => item.id === orderId);
  const listings = (store.listings || []).map((item) => {
    if (item.id !== order?.listingId) return item;
    return { ...item, status: listingStatus || item.status, updatedAt: now() };
  });
  const out = { ...store, orders, listings };
  writeStore(out);
  return { store: out, order };
}

export function resetMarketplace() {
  const out = { listings: SEED.map((item) => ({ ...item })), orders: [] };
  writeStore(out);
  return out;
}

export function formatWallet(address) {
  return shortWallet(address);
}
