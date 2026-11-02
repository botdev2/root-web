import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { formatCredits, PALM_PER_CREDIT } from "../../glmChat.js";
import { opsFetch } from "../../opsApi.js";
import { readCache, sameData, writeCache } from "../../opsCache.js";
import { Card, Ghost, Page, Row, Section, Skeleton } from "../ui.jsx";

function parts(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function when(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Tick({ value, label }) {
  return (
    <div className="flex min-w-[64px] flex-col items-center rounded-xl border border-[var(--stroke-soft)] bg-[var(--panel-soft)] px-3 py-2.5">
      <span className="tabular-nums text-[26px] leading-none text-[var(--ink)]">{String(value).padStart(2, "0")}</span>
      <span className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">{label}</span>
    </div>
  );
}

function planLine(plan) {
  if (!plan) return "";
  if (plan.plan?.name) return plan.plan.name;
  if (plan.free) return "Free window";
  return "No plan";
}

export default function BillingView({ credit, token = "", onRefresh }) {
  const { address, isConnected } = useAccount();
  const [now, setNow] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [plan, setPlan] = useState(() => readCache(address, "billing"));

  // The reset clock ticks every second while this tab is open.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Fresh numbers whenever the tab opens.
  useEffect(() => {
    onRefresh?.();
  }, []);

  // The clock reaching zero means a new window began.
  const resetsAt = credit ? Date.parse(credit.resetsAt) : NaN;
  const startsAt = credit ? Date.parse(credit.startsAt) : NaN;
  const left = Number.isFinite(resetsAt) ? resetsAt - now : NaN;
  useEffect(() => {
    if (Number.isFinite(left) && left <= 0) onRefresh?.();
  }, [Number.isFinite(left) && left <= 0]);

  useEffect(() => {
    if (!token || !address) return undefined;
    let cancelled = false;
    opsFetch("/api/billing", { token })
      .then((data) => {
        if (cancelled) return;
        setPlan((prev) => (sameData(prev, data) ? prev : data));
        writeCache(address, "billing", data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token, address]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  };

  const rate = Number(credit?.palmPerCredit) || PALM_PER_CREDIT;
  const span = Number.isFinite(resetsAt) && Number.isFinite(startsAt) ? resetsAt - startsAt : 0;
  const elapsed = span > 0 ? Math.min(100, Math.max(0, ((now - startsAt) / span) * 100)) : 0;
  const share = credit && credit.allowance > 0 ? Math.min(100, Math.max(0, (credit.remaining / credit.allowance) * 100)) : 0;
  const clock = parts(Number.isFinite(left) ? left : 0);
  const welcome = credit?.welcome;
  const windowTokensUsed = credit ? Math.round(credit.windowUsed * (credit.tokensPerCredit || 2000000)) : 0;

  if (!isConnected || !address) {
    return (
      <Page>
        <Card className="px-5 py-6 text-[13.5px] leading-6 text-[var(--muted)]">
          Connect your wallet to see your credits. Your balance and the reset clock belong to the address you sign in with.
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="p-5">
          <div className="text-[11px] text-[var(--faint)]">Credits left</div>
          {credit ? (
            <>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="tabular-nums text-[38px] leading-none tracking-[-0.02em]">{formatCredits(credit.remaining)}</span>
                <span className="text-[13px] text-[var(--muted)]">of {formatCredits(credit.allowance)}</span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--stroke-soft)]">
                <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-700" style={{ width: `${share}%` }} />
              </div>
              <p className="mt-3 text-[12px] leading-5 text-[var(--muted)]">
                {rate.toLocaleString()} $PALM held or staked = 1 credit. One credit buys {Number(credit.tokensPerCredit || 2000000).toLocaleString()} GLM 5.2 tokens.
              </p>
            </>
          ) : (
            <div className="mt-3 space-y-3">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-1.5 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-[var(--faint)]">Window credits reset in</div>
            <Ghost onClick={refresh}>{refreshing ? "Checking…" : "Refresh"}</Ghost>
          </div>
          {credit && Number.isFinite(left) ? (
            <>
              <div className="mt-3 flex flex-wrap gap-2" aria-live="off" title={when(credit.resetsAt)}>
                <Tick value={clock.days} label="days" />
                <Tick value={clock.hours} label="hours" />
                <Tick value={clock.minutes} label="min" />
                <Tick value={clock.seconds} label="sec" />
              </div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-[var(--stroke-soft)]">
                <div className="h-full rounded-full bg-[var(--amber)]" style={{ width: `${elapsed}%` }} />
              </div>
              <p className="mt-3 text-[12px] leading-5 text-[var(--muted)]">
                Resets {when(credit.resetsAt)}. A new 14-day window starts then, and your $PALM refills it.
              </p>
            </>
          ) : (
            <div className="mt-3 space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          )}
        </Card>
      </div>

      <Section title="Where your credits come from">
        <Card>
          <Row label="$PALM held" value="In this wallet">
            <span className="tabular-nums text-[13px]">{credit ? Number(credit.held).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "…"}</span>
          </Row>
          <Row label="$PALM staked" value="In the staking contract">
            <span className="tabular-nums text-[13px]">{credit ? Number(credit.staked).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "…"}</span>
          </Row>
          <Row label="From $PALM this window" value={`${formatCredits(credit?.windowRemaining ?? 0)} left of ${formatCredits(credit?.windowAllowance ?? 0)}`}>
            <span className="tabular-nums text-[13px]">{credit ? `${formatCredits(credit.windowAllowance)} credits` : "…"}</span>
          </Row>
          {welcome && (
            <Row
              label="Welcome credits"
              value={`${formatCredits(welcome.credits)} issued to every new wallet, once. They do not reset, and they are spent after your window credits.`}
            >
              <span className="tabular-nums text-[13px]">{formatCredits(welcome.remaining)} left</span>
            </Row>
          )}
          <Row label="Used this window" value="Counted against GLM 5.2 as tokens">
            <span className="tabular-nums text-[13px]">{credit ? `${windowTokensUsed.toLocaleString()} tokens` : "…"}</span>
          </Row>
        </Card>
      </Section>

      <Section title="Hosting plan">
        <Card>
          <Row label="PALM Ops" value="Sites and domains are billed on Ops, not in credits.">
            <span className="text-[13px]">{token ? planLine(plan) || "Reading…" : "Sign in to read it"}</span>
          </Row>
        </Card>
      </Section>
    </Page>
  );
}
