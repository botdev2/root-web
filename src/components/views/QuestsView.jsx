import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useAppState } from "../../AppState.jsx";
import { claimQuest, formatCredits, readQuests } from "../../glmChat.js";
import { Card, Page, Section, Skeleton, Tabs } from "../ui.jsx";

const LEVELS = [
  { name: "Seed", at: 0 },
  { name: "Sprout", at: 150 },
  { name: "Sapling", at: 400 },
  { name: "Palm", at: 900 },
  { name: "Grove", at: 1800 },
  { name: "Canopy", at: 3200 },
];

const TIER = {
  easy: { label: "Easy", tone: "text-[var(--green,#3fa56b)]" },
  medium: { label: "Medium", tone: "text-[var(--amber)]" },
  hard: { label: "Hard", tone: "text-[var(--red,#d9566a)]" },
};

const GROUPS = ["All", "Chat", "Tools", "Learn", "Explore", "Streaks"];

function levelOf(points) {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i += 1) if (points >= LEVELS[i].at) index = i;
  const current = LEVELS[index];
  const next = LEVELS[index + 1] || null;
  const share = next ? (points - current.at) / (next.at - current.at) : 1;
  return { index, current, next, share: Math.max(0, Math.min(1, share)) };
}

function clock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

function Bar({ value, total, done }) {
  const share = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--stroke-soft)]">
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${done ? "bg-[var(--accent)]" : "bg-[var(--amber)]"}`}
        style={{ width: `${share}%` }}
      />
    </div>
  );
}

function Reward({ points, perCredit }) {
  return (
    <span className="text-[11.5px] tabular-nums text-[var(--muted)]">
      +{points} pts · +{formatCredits(points / perCredit)} cr
    </span>
  );
}

function ClaimButton({ item, busy, onClaim }) {
  if (item.claimed) {
    return <span className="rounded-lg border border-[var(--stroke-soft)] px-2.5 py-1 text-[11.5px] text-[var(--faint)]">Claimed</span>;
  }
  if (!item.done) {
    return <span className="text-[11.5px] text-[var(--faint)]">In progress</span>;
  }
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClaim}
      className="quest-claim h-8 rounded-lg bg-[var(--accent)] px-3 text-[12px] font-medium text-[var(--bg)] disabled:opacity-60"
    >
      {busy ? "Claiming…" : "Claim"}
    </button>
  );
}

function DailyCard({ item, perCredit, busy, onClaim }) {
  const tier = TIER[item.tier];
  return (
    <Card className={`flex flex-col gap-3 p-4 ${item.claimed ? "opacity-70" : ""}`}>
      <div className="flex items-center justify-between">
        {tier ? <span className={`text-[10.5px] font-medium uppercase tracking-[0.14em] ${tier.tone}`}>{tier.label}</span> : <span />}
        <Reward points={item.points} perCredit={perCredit} />
      </div>
      <div>
        <div className="text-[14px]">{item.title}</div>
        <div className="mt-0.5 text-[12px] leading-5 text-[var(--muted)]">{item.desc}</div>
      </div>
      <div className="mt-auto">
        <Bar value={item.progress} total={item.target} done={item.done} />
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[11.5px] tabular-nums text-[var(--faint)]">
            {item.progress} / {item.target}
          </span>
          <ClaimButton item={item} busy={busy} onClaim={onClaim} />
        </div>
      </div>
    </Card>
  );
}

function Medal({ done, claimed, children }) {
  return (
    <div
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-[12px] ${
        claimed
          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
          : done
            ? "border-[var(--amber)] text-[var(--amber)]"
            : "border-[var(--stroke)] text-[var(--faint)]"
      }`}
    >
      {claimed ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        children
      )}
    </div>
  );
}

function AchievementRow({ item, perCredit, busy, onClaim }) {
  return (
    <Card className={`flex items-center gap-3.5 p-3.5 ${item.claimed ? "opacity-75" : ""}`}>
      <Medal done={item.done} claimed={item.claimed}>
        {item.points}
      </Medal>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="truncate text-[13.5px]">{item.title}</div>
          <Reward points={item.points} perCredit={perCredit} />
        </div>
        <div className="mt-0.5 text-[11.5px] leading-5 text-[var(--muted)]">{item.desc}</div>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1">
            <Bar value={item.progress} total={item.target} done={item.done} />
          </div>
          <span className="w-12 text-right text-[11px] tabular-nums text-[var(--faint)]">
            {item.progress}/{item.target}
          </span>
        </div>
      </div>
      <div className="w-[68px] shrink-0 text-right">
        <ClaimButton item={item} busy={busy} onClaim={onClaim} />
      </div>
    </Card>
  );
}

export default function QuestsView({ token = "", onRefresh }) {
  const { address, isConnected } = useAccount();
  const { notice } = useAppState();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [group, setGroup] = useState("All");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const load = async () => {
    if (!address || !token) return;
    try {
      const result = await readQuests(address);
      setData(result.quests || null);
      setError("");
    } catch (failure) {
      setError(failure.message || "Quests did not load.");
    }
  };

  useEffect(() => {
    setData(null);
    load();
  }, [address, token]);

  // A new day brings new challenges.
  const resetsAt = data ? Date.parse(data.resetsAt) : NaN;
  const left = Number.isFinite(resetsAt) ? resetsAt - now : NaN;
  useEffect(() => {
    if (Number.isFinite(left) && left <= 0) load();
  }, [Number.isFinite(left) && left <= 0]);

  const claim = async (kind, id) => {
    setBusy(kind + ":" + id);
    try {
      const result = await claimQuest(address, kind, id);
      setData(result.quests || data);
      const won = result.awarded;
      if (won) notice?.(`${won.title}: +${won.points} points, +${formatCredits(won.credits)} credits for Hamrin.`);
      onRefresh?.();
    } catch (failure) {
      notice?.(failure.message || "That could not be claimed.");
      load();
    } finally {
      setBusy("");
    }
  };

  const level = useMemo(() => levelOf(data?.points || 0), [data?.points]);
  const perCredit = data?.pointsPerCredit || 2000;
  const shown = useMemo(
    () => (data?.achievements || []).filter((item) => group === "All" || item.group === group),
    [data, group],
  );
  const ready = (data ? [...data.daily, data.bonus, ...data.achievements] : []).filter((item) => item.done && !item.claimed).length;

  if (!isConnected || !address) {
    return (
      <Page>
        <Card className="px-5 py-6 text-[13.5px] leading-6 text-[var(--muted)]">
          Connect your wallet to play. Points and credits belong to the address you sign in with.
        </Card>
      </Page>
    );
  }

  if (!token) {
    return (
      <Page>
        <Card className="px-5 py-6 text-[13.5px] leading-6 text-[var(--muted)]">
          Sign in on the Ops tab first. Quests count what you do with your signed-in wallet, so there is nothing to track until you are in.
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <Card className="mb-3 p-5">
        {data ? (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="min-w-[220px] flex-1">
              <div className="text-[11px] text-[var(--faint)]">Level {level.index + 1}</div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-[30px] leading-none tracking-[-0.02em]">{level.current.name}</span>
                <span className="text-[13px] tabular-nums text-[var(--muted)]">{data.points.toLocaleString()} points</span>
              </div>
              <div className="mt-3.5">
                <Bar value={level.share} total={1} done />
              </div>
              <div className="mt-2 text-[11.5px] text-[var(--faint)]">
                {level.next ? `${(level.next.at - data.points).toLocaleString()} points to ${level.next.name}` : "Top level reached"}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="min-w-[96px] rounded-xl border border-[var(--stroke-soft)] bg-[var(--panel-soft)] px-4 py-3">
                <div className="tabular-nums text-[24px] leading-none">{data.streak}</div>
                <div className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">day streak</div>
              </div>
              <div className="min-w-[96px] rounded-xl border border-[var(--stroke-soft)] bg-[var(--panel-soft)] px-4 py-3">
                <div className="tabular-nums text-[24px] leading-none">{formatCredits(data.creditsEarned)}</div>
                <div className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--faint)]">credits earned</div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-[13px] leading-6 text-[var(--muted)]">{error}</div>
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-1.5 w-full" />
            <Skeleton className="h-3 w-40" />
          </div>
        )}
      </Card>

      <p className="mb-6 px-1 text-[12px] leading-5 text-[var(--muted)]">
        Finish challenges, claim the points, and they land in your balance as Hamrin 1.0 credits ({perCredit.toLocaleString()} points = 1 credit). Earned credits do not reset.
        {ready > 0 && <span className="text-[var(--accent)]"> {ready} ready to claim.</span>}
      </p>

      <Section title={Number.isFinite(left) ? `Today's challenges · new ones in ${clock(left)}` : "Today's challenges"}>
        <div className="grid gap-3 md:grid-cols-3">
          {data
            ? data.daily.map((item) => (
                <DailyCard key={item.id} item={item} perCredit={perCredit} busy={busy === "daily:" + item.id} onClaim={() => claim("daily", item.id)} />
              ))
            : [0, 1, 2].map((key) => <Skeleton key={key} className="h-[150px] w-full rounded-2xl" />)}
        </div>
        {data && (
          <Card className={`mt-3 flex flex-wrap items-center gap-4 p-4 ${data.bonus.claimed ? "opacity-70" : ""}`}>
            <Medal done={data.bonus.done} claimed={data.bonus.claimed}>
              +
            </Medal>
            <div className="min-w-[200px] flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-[14px]">{data.bonus.title}</div>
                <Reward points={data.bonus.points} perCredit={perCredit} />
              </div>
              <div className="mt-0.5 text-[12px] text-[var(--muted)]">{data.bonus.desc}</div>
              <div className="mt-2.5 flex items-center gap-3">
                <div className="flex-1">
                  <Bar value={data.bonus.progress} total={data.bonus.target} done={data.bonus.done} />
                </div>
                <span className="text-[11px] tabular-nums text-[var(--faint)]">
                  {data.bonus.progress}/{data.bonus.target}
                </span>
              </div>
            </div>
            <ClaimButton item={data.bonus} busy={busy === "daily:daily-all"} onClaim={() => claim("daily", "daily-all")} />
          </Card>
        )}
      </Section>

      <Section title="Achievements">
        <Tabs tabs={GROUPS.map((item) => ({ id: item, label: item }))} value={group} onChange={setGroup} />
        <div className="grid gap-2.5 md:grid-cols-2">
          {data
            ? shown.map((item) => (
                <AchievementRow
                  key={item.id}
                  item={item}
                  perCredit={perCredit}
                  busy={busy === "achievement:" + item.id}
                  onClaim={() => claim("achievement", item.id)}
                />
              ))
            : [0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-[88px] w-full rounded-2xl" />)}
        </div>
      </Section>
    </Page>
  );
}
