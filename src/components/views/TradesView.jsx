import { useEffect, useMemo, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useWalletClient } from "wagmi";
import { formatUsd } from "../../market.js";
import { canFire, makeOrder, notionalUsd, parseAmount, spentToday, suggestTrigger } from "../../trades.js";
import { executeLimit, previewSwap, txUrl } from "../../uniswap.js";
import MarketLogo from "../MarketLogo.jsx";
import { Card, Field, Ghost, Primary, Toggle } from "../ui.jsx";

const CHIPS = [
  "What's PALM doing versus ETH on this tape?",
  "If I buy a dip, what trigger is conservative vs the last print?",
  "Walk through the Uniswap V2 PALM/WETH path and the risks.",
];

export function TradesIntro({ onAsk }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-8">
      <div className="max-w-[460px] text-center">
        <h1 className="text-[22px]">Trades</h1>
        <p className="mt-2 text-[13px] text-[var(--muted)]">
          This thread is Hamrin on the tape. Limits on the right watch PALM. Uniswap V2 has no order book — a hit opens a wallet prompt while /root is open. You still sign. Nothing spends if this tab is closed. Not financial advice.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onAsk(chip)}
              className="rounded-full border border-[var(--stroke)] px-3 py-1.5 text-[12px] text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--ink)]"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TradesView({
  book,
  onBook,
  quotes = [],
  updatedAt = 0,
  error = "",
}) {
  const { isConnected, address } = useAccount();
  const { open } = useAppKit();
  const { data: walletClient } = useWalletClient();
  const palm = quotes.find((item) => item.symbol === "PALM");
  const eth = quotes.find((item) => item.symbol === "ETH");
  const guards = book.guards;
  const pending = book.orders.find((item) => item.status === "triggered" || item.status === "signing");
  const [side, setSide] = useState("buy");
  const [amount, setAmount] = useState("0.01");
  const [trigger, setTrigger] = useState("");
  const [slip, setSlip] = useState(String(Math.min(100, guards.maxSlippageBps)));
  const [formError, setFormError] = useState("");
  const [quote, setQuote] = useState(null);
  const [hitQuote, setHitQuote] = useState(null);
  const [busy, setBusy] = useState("");
  const spent = spentToday(book.spends);

  useEffect(() => {
    if (!trigger && palm?.price) setTrigger(suggestTrigger(side, palm.price));
  }, [palm?.price, side]);

  useEffect(() => {
    const draft = { side, amount, slippageBps: Number(slip) || 100, triggerUsd: Number(trigger) };
    if (!parseAmount(amount) || (side === "buy" ? !eth?.price : !palm?.price)) {
      setQuote(null);
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      previewSwap(draft)
        .then((row) => {
          if (!cancelled) setQuote(row);
        })
        .catch(() => {
          if (!cancelled) setQuote(null);
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [side, amount, slip, palm?.price, eth?.price]);

  useEffect(() => {
    if (!pending) {
      setHitQuote(null);
      return undefined;
    }
    let cancelled = false;
    previewSwap(pending)
      .then((row) => {
        if (!cancelled) setHitQuote(row);
      })
      .catch(() => {
        if (!cancelled) setHitQuote(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pending?.id, pending?.status]);

  const patchGuards = (partial) => onBook((current) => ({ ...current, guards: { ...current.guards, ...partial } }));

  const arm = () => {
    setFormError("");
    if (!isConnected) {
      open({ view: "Connect" });
      return;
    }
    if (guards.halt) {
      setFormError("Kill switch is on.");
      return;
    }
    const size = parseAmount(amount);
    const price = Number(trigger);
    const slippageBps = Math.round(Number(slip) || 0);
    if (!size) {
      setFormError("Enter a size.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setFormError("Enter a PALM USD trigger.");
      return;
    }
    if (slippageBps < 10 || slippageBps > guards.maxSlippageBps) {
      setFormError("Slippage must be between 0.10% and " + (guards.maxSlippageBps / 100).toFixed(2) + "%.");
      return;
    }
    if (palm?.price) {
      if (side === "buy" && price >= palm.price) {
        setFormError("Buy trigger must be under the last print, or it would fire now.");
        return;
      }
      if (side === "sell" && price <= palm.price) {
        setFormError("Sell trigger must be over the last print, or it would fire now.");
        return;
      }
    }
    const order = makeOrder({ side, triggerUsd: price, amount, slippageBps });
    const check = canFire({ ...book, orders: [...book.orders, order] }, { ...order, status: "armed" }, palm?.price, eth?.price);
    if (!check.ok) {
      setFormError(check.reasons[0]);
      return;
    }
    if (book.orders.filter((item) => item.status === "armed").length >= 8) {
      setFormError("Eight live limits at a time.");
      return;
    }
    onBook((current) => ({ ...current, orders: [order, ...current.orders] }));
    setFormError("");
  };

  const patchOrder = (id, partial) => {
    onBook((current) => ({
      ...current,
      orders: current.orders.map((item) => (item.id === id ? { ...item, ...partial } : item)),
    }));
  };

  const skipHit = (order) => {
    patchOrder(order.id, { status: "armed", skipUntil: Date.now() + 5 * 60 * 1000, warn: "Skipped this print." });
  };

  const disarm = (order) => {
    patchOrder(order.id, { status: "cancelled", error: "" });
  };

  const signHit = async (order) => {
    if (!isConnected || !address) {
      open({ view: "Connect" });
      return;
    }
    const check = canFire(book, { ...order, status: "triggered" }, palm?.price, eth?.price);
    if (!check.ok) {
      patchOrder(order.id, { status: "armed", error: check.reasons[0], skipUntil: Date.now() + 30000 });
      return;
    }
    if (updatedAt && Date.now() - updatedAt > guards.staleMs) {
      patchOrder(order.id, { status: "armed", error: "Prints are stale. Limits wait for a fresh quote.", skipUntil: Date.now() + 15000 });
      return;
    }
    patchOrder(order.id, { status: "signing", error: "" });
    setBusy("Waiting on the wallet…");
    try {
      const result = await executeLimit(walletClient, address, order);
      onBook((current) => ({
        ...current,
        orders: current.orders.map((item) =>
          item.id === order.id ? { ...item, status: "done", txHash: result.hash, error: "", firedAt: new Date().toISOString() } : item,
        ),
        spends: [{ at: new Date().toISOString(), usd: check.usd, orderId: order.id, txHash: result.hash }, ...(current.spends || [])].slice(0, 40),
      }));
      setBusy("");
    } catch (err) {
      const message = String(err?.shortMessage || err?.message || "Wallet did not sign.").slice(0, 180);
      patchOrder(order.id, { status: "armed", error: message, skipUntil: Date.now() + 20000 });
      setBusy("");
    }
  };

  const live = useMemo(
    () => book.orders.filter((item) => item.status === "armed" || item.status === "triggered" || item.status === "signing"),
    [book.orders],
  );
  const past = useMemo(
    () => book.orders.filter((item) => item.status === "done" || item.status === "failed" || item.status === "cancelled").slice(0, 8),
    [book.orders],
  );

  return (
    <>
      <aside className="trades-rail shrink-0 overflow-y-auto border-t border-[var(--stroke-soft)] xl:h-auto xl:w-[400px] xl:border-l xl:border-t-0">
        <div className="px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MarketLogo symbol="PALM" logo="/palm.png" size={22} />
              <div>
                <div className="text-[13px]">PALM / ETH</div>
                <div className="text-[11px] text-[var(--faint)]">{updatedAt ? "DexScreener · Uniswap V2" : "Waiting on a print"}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="tabular-nums text-[16px]">{formatUsd(palm?.price)}</div>
              <div className="text-[11px] text-[var(--faint)]">ETH {formatUsd(eth?.price)}</div>
            </div>
          </div>
          {error && <div className="mb-3 text-[12px] text-[var(--rose)]">{error}</div>}

          <Card className="mb-3 p-0">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--stroke-soft)] px-3 py-2.5">
              <div>
                <div className="text-[13px]">Arm limits</div>
                <div className="text-[11px] text-[var(--faint)]">Watch while this app is open</div>
              </div>
              <Toggle on={guards.live && !guards.halt} onClick={() => patchGuards({ live: !(guards.live && !guards.halt), halt: false })} />
            </div>
            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div>
                <div className="text-[13px] text-[var(--rose)]">Kill switch</div>
                <div className="text-[11px] text-[var(--faint)]">Cancel the next fire. Does not undo a signed swap.</div>
              </div>
              <Toggle on={guards.halt} onClick={() => patchGuards({ halt: !guards.halt })} />
            </div>
          </Card>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <CapField
              label="Order cap USD"
              value={String(guards.maxUsd)}
              onChange={(value) => patchGuards({ maxUsd: clampCap(value, 5, 500) })}
            />
            <CapField
              label="Daily cap USD"
              value={String(guards.dailyUsd)}
              onChange={(value) => patchGuards({ dailyUsd: clampCap(value, 10, 2000) })}
            />
            <CapField
              label="Max slip bps"
              value={String(guards.maxSlippageBps)}
              onChange={(value) => patchGuards({ maxSlippageBps: clampCap(value, 20, 200) })}
            />
            <div className="rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 py-2">
              <div className="text-[10px] text-[var(--faint)]">Spent today</div>
              <div className="tabular-nums text-[13px]">{formatUsd(spent)} / {formatUsd(guards.dailyUsd)}</div>
            </div>
          </div>

          <Card className="mb-3 p-3">
            <div className="mb-2 text-[12px] text-[var(--faint)]">New limit</div>
            <div className="mb-2 flex gap-1">
              <Ghost active={side === "buy"} onClick={() => {
                setSide("buy");
                setAmount("0.01");
                if (palm?.price) setTrigger(suggestTrigger("buy", palm.price));
              }}>
                Buy PALM
              </Ghost>
              <Ghost active={side === "sell"} onClick={() => {
                setSide("sell");
                setAmount("");
                if (palm?.price) setTrigger(suggestTrigger("sell", palm.price));
              }}>
                Sell PALM
              </Ghost>
            </div>
            <div className="grid gap-2">
              <Field
                label={side === "buy" ? "Spend ETH" : "Sell PALM"}
                value={amount}
                onChange={setAmount}
                placeholder={side === "buy" ? "0.01" : "1000"}
              />
              <Field label="Trigger PALM USD" value={trigger} onChange={setTrigger} placeholder="0.00" />
              <Field label="Slippage bps" value={slip} onChange={setSlip} placeholder="100" />
            </div>
            {quote && (
              <div className="mt-2 text-[11px] text-[var(--muted)]">
                Est. {quote.outLabel} · min {quote.minLabel}
              </div>
            )}
            {!!parseAmount(amount) && (
              <div className="mt-1 text-[11px] text-[var(--faint)]">
                Notional {formatUsd(notionalUsd({ side, amount }, palm?.price, eth?.price))}
              </div>
            )}
            {formError && <div className="mt-2 text-[12px] text-[var(--rose)]">{formError}</div>}
            <div className="mt-3">
              <Primary onClick={arm}>Arm {side}</Primary>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-[var(--faint)]">
              Allowlist PALM/WETH only. Exact allowance, no infinite approve. The router cannot spend unless you sign.
            </p>
          </Card>

          <div className="mb-2 text-[12px] text-[var(--faint)]">Live</div>
          {live.length === 0 && <div className="mb-3 text-[12.5px] text-[var(--muted)]">No armed limits.</div>}
          {live.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              palmUsd={palm?.price}
              ethUsd={eth?.price}
              onDisarm={() => disarm(order)}
              onSign={() => signHit(order)}
            />
          ))}

          {past.length > 0 && <div className="mb-2 mt-4 text-[12px] text-[var(--faint)]">Recent</div>}
          {past.map((order) => (
            <OrderRow key={order.id} order={order} palmUsd={palm?.price} ethUsd={eth?.price} />
          ))}
        </div>
      </aside>

      {pending && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[color-mix(in_srgb,#000_45%,transparent)] p-4 xl:left-0">
          <Card className="w-[min(420px,94vw)] p-4">
            <div className="text-[15px]">{pending.side === "buy" ? "Buy" : "Sell"} limit hit</div>
            <p className="mt-2 text-[13px] text-[var(--muted)]">
              PALM printed {formatUsd(palm?.price)} against a trigger of {formatUsd(pending.triggerUsd)}. This sends a Uniswap V2 swap on Ethereum. /root does not hold keys. Reject in the wallet to abort.
            </p>
            <div className="mt-3 text-[12px] text-[var(--faint)]">
              Size {pending.amount} {pending.side === "buy" ? "ETH" : "PALM"} · slip {pending.slippageBps} bps · cap {formatUsd(guards.maxUsd)}
            </div>
            {hitQuote && (
              <div className="mt-2 text-[12px] text-[var(--muted)]">Est. {hitQuote.outLabel} · min {hitQuote.minLabel}</div>
            )}
            {busy && <div className="mt-2 text-[12px] text-[var(--amber)]">{busy}</div>}
            {pending.error && <div className="mt-2 text-[12px] text-[var(--rose)]">{pending.error}</div>}
            <div className="mt-4 flex flex-wrap gap-2">
              <Primary onClick={() => signHit(pending)}>Sign swap</Primary>
              <Ghost onClick={() => skipHit(pending)}>Skip print</Ghost>
              <Ghost onClick={() => disarm(pending)}>Disarm</Ghost>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function clampCap(text, min, max) {
  const value = Number(text);
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function CapField({ label, value, onChange }) {
  return (
    <label className="rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 py-2">
      <div className="text-[10px] text-[var(--faint)]">{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-[13px] outline-none"
      />
    </label>
  );
}

function OrderRow({ order, palmUsd, ethUsd, onDisarm, onSign }) {
  const usd = notionalUsd(order, palmUsd, ethUsd);
  return (
    <div className="mb-2 rounded-xl border border-[var(--stroke)] px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[13px]">
          <span className={order.side === "buy" ? "text-[var(--green)]" : "text-[var(--rose)]"}>{order.side.toUpperCase()}</span>
          {" PALM "}
          {order.side === "buy" ? "≤" : "≥"} {formatUsd(order.triggerUsd)}
        </div>
        <span className="text-[10px] uppercase tracking-wide text-[var(--faint)]">{order.status}</span>
      </div>
      <div className="mt-1 text-[11px] text-[var(--muted)]">
        {order.amount} {order.side === "buy" ? "ETH" : "PALM"} · {formatUsd(usd)} · {order.slippageBps} bps
      </div>
      {order.warn && <div className="mt-1 text-[11px] text-[var(--amber)]">{order.warn}</div>}
      {order.error && <div className="mt-1 text-[11px] text-[var(--rose)]">{order.error}</div>}
      {order.txHash && (
        <a className="mt-1 inline-block text-[11px] text-[var(--accent)]" href={txUrl(order.txHash)} target="_blank" rel="noreferrer">
          Etherscan
        </a>
      )}
      {(order.status === "armed" || order.status === "triggered") && (
        <div className="mt-2 flex gap-2">
          {order.status === "triggered" && onSign && <Ghost onClick={onSign}>Sign</Ghost>}
          {onDisarm && <Ghost onClick={onDisarm}>Disarm</Ghost>}
        </div>
      )}
    </div>
  );
}
