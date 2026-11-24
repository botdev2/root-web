import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { money, palmAmount, usd, usePalmUsd, wpalmOf } from "../../market.js";
import {
  CATEGORIES,
  STATUS,
  cancelListing,
  createListing,
  disputeEscrow,
  feeOf,
  formatWallet,
  fundEscrow,
  listBrowse,
  loadMarketplace,
  markDelivered,
  ordersFor,
  refundEscrow,
  releaseEscrow,
  resetMarketplace,
  totalDue,
} from "../../marketplace.js";
import { trackActivity } from "../../milesGreeting.js";
import { Card, Field, Ghost, Page, Primary, Section, Tabs } from "../ui.jsx";

export default function MarketplaceView({ credit = null }) {
  const { address, isConnected } = useAccount();
  const price = usePalmUsd();
  const [store, setStore] = useState(() => loadMarketplace());
  const [tab, setTab] = useState("browse");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState("");
  const [form, setForm] = useState({ title: "", blurb: "", category: "service", price: "50" });

  const wpalm = wpalmOf(credit);
  const held = palmAmount(credit?.held);
  const wallet = isConnected ? held : wpalm;

  const listings = useMemo(
    () => listBrowse(store, { category, query, mine: address, tab: tab === "mine" ? "mine" : "open" }),
    [store, category, query, address, tab],
  );
  const escrow = useMemo(() => ordersFor(store, address), [store, address]);

  function apply(result, note) {
    if (result.error) {
      setFlash(result.error);
      return;
    }
    setStore(result.store);
    setFlash("");
    if (note && address) trackActivity(address, { type: "market", label: note });
  }

  function onCreate(event) {
    event.preventDefault();
    if (!isConnected || !address) {
      setFlash("Connect a wallet to list.");
      return;
    }
    const result = createListing(store, {
      title: form.title,
      blurb: form.blurb,
      category: form.category,
      price: form.price,
      seller: address,
    });
    if (result.error) {
      setFlash(result.error);
      return;
    }
    setStore(result.store);
    setForm({ title: "", blurb: "", category: "service", price: "50" });
    setTab("mine");
    setFlash("Listed. Buyers fund PALM into escrow.");
    trackActivity(address, { type: "market", label: "Listed on marketplace", detail: form.title.slice(0, 80) });
  }

  return (
    <Page wide>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] tracking-[0.28em] text-[var(--faint)]">PALM DESK · P2P</div>
          <div className="mt-1 text-[22px]">Marketplace</div>
          <p className="mt-1 max-w-[640px] text-[13px] leading-5 text-[var(--muted)]">
            Sell peer-to-peer. Buyer locks PALM in escrow; you deliver; buyer releases. Mock desk — nothing spends on-chain yet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Ghost onClick={() => setTab("sell")}>List something</Ghost>
          <Ghost onClick={() => setTab("escrow")}>Escrow {escrow.length ? `(${escrow.length})` : ""}</Ghost>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Wallet" value={money(wallet)} />
        <Stat label="Open listings" value={String((store.listings || []).filter((item) => item.status === "open").length)} />
        <Stat label="In escrow" value={money(escrow.filter((o) => ["funded", "delivered", "disputed"].includes(o.status)).reduce((sum, o) => sum + (o.total || 0), 0))} />
        <Stat label="USD / PALM" value={price ? usd(1, price) : "—"} hint="Same for wPALM" />
      </div>

      <Card className="mb-5 p-5">
        <div className="text-[11px] tracking-[0.22em] text-[var(--faint)]">HOW ESCROW WORKS</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Step n="1" title="List" text="Seller posts a price in PALM. Listing stays open until funded." />
          <Step n="2" title="Lock" text="Buyer funds escrow (price + 1% desk fee). PALM sits between both sides." />
          <Step n="3" title="Release" text="Seller marks delivered. Buyer releases to seller — or refund / dispute." />
        </div>
        {!isConnected && <p className="mt-3 text-[13px] text-[var(--muted)]">Connect a wallet to list, buy, or manage escrow.</p>}
      </Card>

      {flash && (
        <div className="mb-4 rounded-xl border border-[var(--stroke)] bg-[var(--hover)] px-4 py-3 text-[13px] text-[var(--ink)]">{flash}</div>
      )}

      <Tabs
        tabs={[
          { id: "browse", label: "Browse" },
          { id: "mine", label: "My listings" },
          { id: "sell", label: "Sell" },
          { id: "escrow", label: "Escrow" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "browse" && (
        <Section title="Open listings">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="h-9 w-full max-w-[220px] rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 text-[13px] outline-none"
            />
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={`h-8 rounded-lg px-2.5 text-[12px] ${
                    category === item.id ? "bg-[var(--sidebar-sel)] text-[var(--ink)]" : "text-[var(--muted)] hover:bg-[var(--hover)]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <ListingGrid
            items={listings}
            price={price}
            address={address}
            onBuy={(id) => apply(fundEscrow(store, id, address), "Funded marketplace escrow")}
          />
        </Section>
      )}

      {tab === "mine" && (
        <Section title="Your listings">
          {!isConnected ? (
            <Card className="p-5 text-[13px] text-[var(--muted)]">Connect a wallet to see your listings.</Card>
          ) : listings.length === 0 ? (
            <Card className="p-5 text-[13px] text-[var(--muted)]">
              Nothing listed yet.{" "}
              <button type="button" className="text-[var(--accent)]" onClick={() => setTab("sell")}>
                Sell something →
              </button>
            </Card>
          ) : (
            <ListingGrid
              items={listings}
              price={price}
              address={address}
              mine
              onCancel={(id) => apply(cancelListing(store, id, address), "Cancelled a marketplace listing")}
            />
          )}
        </Section>
      )}

      {tab === "sell" && (
        <Section title="New listing">
          <Card className="p-5">
            <form className="grid max-w-[560px] gap-3" onSubmit={onCreate}>
              <Field label="Title" value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} placeholder="What are you selling?" />
              <label className="block">
                <div className="mb-1.5 text-[11px] text-[var(--faint)]">Description</div>
                <textarea
                  value={form.blurb}
                  onChange={(event) => setForm((prev) => ({ ...prev, blurb: event.target.value }))}
                  rows={3}
                  placeholder="What the buyer gets, how you deliver."
                  className="w-full rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 py-2 text-[14px] outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="mb-1.5 text-[11px] text-[var(--faint)]">Category</div>
                  <select
                    value={form.category}
                    onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                    className="h-10 w-full rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 text-[14px] outline-none"
                  >
                    {CATEGORIES.filter((item) => item.id !== "all").map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  label="Price (PALM)"
                  type="number"
                  value={form.price}
                  onChange={(value) => setForm((prev) => ({ ...prev, price: value }))}
                  placeholder="50"
                />
              </div>
              <div className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--hover)] px-3 py-2.5 text-[12px] text-[var(--muted)]">
                Buyer pays {money(totalDue(form.price))} PALM ({money(form.price)} + {money(feeOf(form.price))} fee). You receive {money(form.price)} when they release.
                {price ? ` ≈ ${usd(form.price, price)}.` : ""}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="submit"
                  className="h-9 rounded-lg bg-[var(--accent)] px-3.5 text-[12.5px] text-[var(--bg)]"
                >
                  List for sale
                </button>
                {!isConnected && <span className="self-center text-[12px] text-[var(--muted)]">Connect wallet first</span>}
              </div>
            </form>
          </Card>
        </Section>
      )}

      {tab === "escrow" && (
        <Section title="Active escrow">
          {!isConnected ? (
            <Card className="p-5 text-[13px] text-[var(--muted)]">Connect a wallet to see escrow you are in.</Card>
          ) : escrow.length === 0 ? (
            <Card className="p-5 text-[13px] text-[var(--muted)]">No escrow yet. Buy a listing to lock PALM between you and the seller.</Card>
          ) : (
            <div className="grid gap-3">
              {escrow.map((order) => {
                const listing = (store.listings || []).find((item) => item.id === order.listingId);
                const amBuyer = String(order.buyer || "").toLowerCase() === String(address || "").toLowerCase();
                const amSeller = String(listing?.seller || "").toLowerCase() === String(address || "").toLowerCase();
                const meta = STATUS[order.status] || STATUS.funded;
                return (
                  <Card key={order.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[14px]">{listing?.title || "Listing gone"}</div>
                        <div className="mt-1 text-[12px] text-[var(--muted)]">
                          {amBuyer ? "You are buyer" : "You are seller"} · {formatWallet(amBuyer ? listing?.seller : order.buyer)} · {meta.label}
                        </div>
                        <div className="mt-1 text-[11.5px] text-[var(--faint)]">{meta.hint}{order.note ? ` · ${order.note}` : ""}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[14px] tabular-nums">{money(order.price)} PALM</div>
                        <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                          locked {money(order.total)} · fee {money(order.fee)}
                          {price ? ` · ${usd(order.price, price)}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {amSeller && order.status === "funded" && (
                        <Primary onClick={() => apply(markDelivered(store, order.id, address))}>Mark delivered</Primary>
                      )}
                      {amBuyer && (order.status === "delivered" || order.status === "funded") && (
                        <Primary onClick={() => apply(releaseEscrow(store, order.id, address))}>Release to seller</Primary>
                      )}
                      {["funded", "delivered", "disputed"].includes(order.status) && (
                        <Ghost onClick={() => apply(refundEscrow(store, order.id, address))}>Refund buyer</Ghost>
                      )}
                      {["funded", "delivered"].includes(order.status) && (
                        <Ghost onClick={() => apply(disputeEscrow(store, order.id, address))}>Dispute</Ghost>
                      )}
                    </div>
                    <EscrowRail status={order.status} />
                  </Card>
                );
              })}
            </div>
          )}
          <div className="mt-4">
            <Ghost
              onClick={() => {
                setStore(resetMarketplace());
                setFlash("Marketplace reset to seed listings.");
              }}
            >
              Reset mock data
            </Ghost>
          </div>
        </Section>
      )}
    </Page>
  );
}

function ListingGrid({ items, price, address, onBuy, onCancel, mine }) {
  if (!items.length) {
    return <Card className="p-5 text-[13px] text-[var(--muted)]">No listings match.</Card>;
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => {
        const mineListing = String(item.seller || "").toLowerCase() === String(address || "").toLowerCase();
        const meta = STATUS[item.status] || STATUS.open;
        return (
          <Card key={item.id} className="flex flex-col p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] tracking-[0.16em] text-[var(--faint)]">
                  {item.category?.toUpperCase()} · @{item.sellerTag || formatWallet(item.seller)}
                </div>
                <div className="mt-1 text-[15px] leading-snug">{item.title}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[15px] tabular-nums">{money(item.price)} PALM</div>
                <div className="mt-0.5 text-[11px] text-[var(--muted)]">{usd(item.price, price)}</div>
              </div>
            </div>
            <p className="mt-2 flex-1 text-[12.5px] leading-5 text-[var(--muted)]">{item.blurb}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] text-[var(--faint)]">
                {meta.label}
                {!mine && !mineListing && item.status === "open" ? ` · buy locks ${money(totalDue(item.price))} PALM` : ""}
              </div>
              <div className="flex gap-2">
                {mine && item.status === "open" && <Ghost onClick={() => onCancel?.(item.id)}>Cancel</Ghost>}
                {!mine && item.status === "open" && !mineListing && (
                  <Primary onClick={() => onBuy?.(item.id)}>Fund escrow</Primary>
                )}
                {!mine && mineListing && item.status === "open" && (
                  <span className="self-center text-[11px] text-[var(--muted)]">Your listing</span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function EscrowRail({ status }) {
  const steps = ["funded", "delivered", "released"];
  const map = { funded: 0, delivered: 1, released: 2, refunded: -1, disputed: 1, cancelled: -1 };
  const active = map[status] ?? 0;
  return (
    <div className="mt-4 flex items-center gap-1">
      {steps.map((step, index) => {
        const on = active >= 0 && index <= active;
        return (
          <div key={step} className="flex flex-1 items-center gap-1">
            <div className={`h-1.5 flex-1 rounded-full ${on ? "bg-[var(--accent)]" : "bg-[var(--stroke)]"}`} />
            {index < steps.length - 1 ? null : null}
          </div>
        );
      })}
      <div className="ml-2 shrink-0 text-[10px] tracking-[0.14em] text-[var(--faint)]">
        {status === "refunded" ? "REFUNDED" : status === "disputed" ? "DISPUTED" : steps[Math.max(0, active)]?.toUpperCase()}
      </div>
    </div>
  );
}

function Step({ n, title, text }) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.18em] text-[var(--faint)]">
        {n} · {title}
      </div>
      <p className="mt-1.5 text-[13px] leading-5 text-[var(--ink)]">{text}</p>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <Card className="px-3 py-3.5 text-center">
      <div className="text-[10px] tracking-[0.16em] text-[var(--faint)]">{label}</div>
      <div className="mt-1.5 text-[18px] tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[10px] text-[var(--muted)]">{hint}</div>}
    </Card>
  );
}
