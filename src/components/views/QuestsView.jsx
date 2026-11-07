import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useAppState } from "../../AppState.jsx";
import { claimQuest, formatCredits, readQuests } from "../../glmChat.js";
import { Card, Page, Skeleton } from "../ui.jsx";

// Points needed to reach each level. Must match the server.
const LEVEL_AT = [0, 150, 400, 900, 1800, 3200];
const EXPERT_LEVEL = 4;

const TIER = { easy: "Easy", medium: "Medium", hard: "Hard", epic: "Expert", bonus: "All done" };
const TIER_DOTS = { easy: 1, medium: 2, hard: 3, epic: 4, bonus: 0 };

// Plain names for what the server calls its achievements.
const TITLE = {
  "first-words": "First message",
  chatterbox: "25 messages",
  centurion: "100 messages",
  legend: "500 messages",
  versatile: "Every mode",
  "ask-away": "Ask mode",
  planner: "Plan mode",
  "agent-smith": "Agent mode",
  collector: "5 chats",
  "prompt-smith": "Auto-Prompt x5",
  "prompt-master": "Auto-Prompt x25",
  scout: "Web lookups x5",
  cartographer: "Web lookups x25",
  explorer: "Open every tab",
  graduate: "All episodes",
  "streak-3": "3-day streak",
  "streak-7": "7-day streak",
  "streak-14": "14-day streak",
  "streak-30": "30-day streak",
  "streak-60": "60-day streak",
  "daily-1": "Finish all daily",
  "daily-7": "7 full days",
  "daily-30": "30 full days",
  "daily-all": "Finish all of today",
};

const GROUPS = [
  { label: "Chat", match: ["Chat"] },
  { label: "Tools", match: ["Tools", "Explore"] },
  { label: "Learn", match: ["Learn"] },
  { label: "Streaks", match: ["Streaks"] },
];

const GLYPHS = {
  chat: "M4 5h16v11H9l-5 4V5z",
  bolt: "M13 3L5 13h6l-1 8 8-10h-6l1-8z",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18z M3 12h18 M12 3c3 3.5 3 14.5 0 18 M12 3c-3 3.5-3 14.5 0 18",
  book: "M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3V4z M5 17a3 3 0 013-3h10",
  flame: "M12 3c1 4 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 .3 1.2 1 2 2 2 0-3-.5-5 1-8z",
  compass: "M12 3a9 9 0 100 18 9 9 0 000-18z M15.5 8.5l-2 5-5 2 2-5z",
  trophy: "M8 4h8v5a4 4 0 01-8 0V4z M8 6H5a3 3 0 003 4 M16 6h3a3 3 0 01-3 4 M12 13v4 M9 20h6 M10 17h4",
  layers: "M12 3l9 5-9 5-9-5 9-5z M3 13l9 5 9-5",
  cap: "M2 9l10-5 10 5-10 5-10-5z M6 11v5c3 2.5 9 2.5 12 0v-5",
  calendar: "M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4",
  plus: "M4 4h16v16H4z M12 8v8 M8 12h8",
  check: "M5 12.5l4.5 4.5L19 7.5",
  star: "M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.8 6.4 20l1.3-6.2L3 9.5l6.3-.7L12 3z",
};

function Glyph({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={GLYPHS[name] || GLYPHS.star} />
    </svg>
  );
}

function iconFor(item) {
  const id = item.id || "";
  if (id === "legend") return "trophy";
  if (id === "versatile" || id === "planner") return "layers";
  if (id === "collector") return "plus";
  if (id === "explorer") return "compass";
  if (id === "graduate") return "cap";
  if (id.startsWith("class-")) return "book";
  if (id.startsWith("streak-")) return "flame";
  if (id.startsWith("daily-")) return "calendar";
  if (id.startsWith("prompt-")) return "bolt";
  if (id === "scout" || id === "cartographer") return "globe";
  if (id === "agent-smith") return "bolt";
  if (id === "first-words" || id === "chatterbox" || id === "centurion" || id === "ask-away") return "chat";
  // Daily challenges have no fixed ids, so read what they ask for.
  const text = `${item.title} ${item.desc}`;
  if (/episode|class/i.test(text)) return "book";
  if (/web|look/i.test(text)) return "globe";
  if (/auto-prompt/i.test(text)) return "bolt";
  if (/open|tab/i.test(text)) return "compass";
  if (/mode/i.test(text)) return "layers";
  if (/chat/i.test(text) && /begin|new/i.test(text)) return "plus";
  if (/message/i.test(text)) return "chat";
  if (item.tier === "bonus") return "trophy";
  return "star";
}

function levelOf(points) {
  let index = 0;
  for (let i = 0; i < LEVEL_AT.length; i += 1) if (points >= LEVEL_AT[i]) index = i;
  const floor = LEVEL_AT[index];
  const ceiling = LEVEL_AT[index + 1];
  const share = ceiling ? (points - floor) / (ceiling - floor) : 1;
  return { number: index + 1, next: ceiling ?? null, share: Math.max(0, Math.min(1, share)) };
}

function clock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

function stateOf(item) {
  if (item.claimed) return "claimed";
  if (item.done) return "ready";
  return "open";
}

function Bar({ value, total }) {
  const share = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className="h-1 overflow-hidden rounded-full bg-[var(--stroke-soft)]">
      <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500" style={{ width: `${share}%` }} />
    </div>
  );
}

function Dots({ tier }) {
  const lit = TIER_DOTS[tier] ?? 0;
  if (!lit) return null;
  return (
    <span className="flex items-center gap-[3px]" aria-hidden="true">
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={`h-1.5 w-1.5 rounded-full ${n <= lit ? "bg-[var(--accent)]" : "bg-[var(--stroke)]"}`} />
      ))}
    </span>
  );
}

function Item({ item, perCredit, busy, onClaim, showTier = false }) {
  const state = stateOf(item);
  const title = TITLE[item.id] || item.title;
  return (
    <Card className={`flex flex-col gap-3 p-4 ${state === "ready" ? "border-[var(--accent)]!" : ""} ${state === "claimed" ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            state === "claimed"
              ? "bg-[var(--accent)] text-[var(--bg)]"
              : state === "ready"
                ? "bg-[var(--panel-soft)] text-[var(--accent)]"
                : "bg-[var(--panel-soft)] text-[var(--muted)]"
          }`}
        >
          <Glyph name={state === "claimed" ? "check" : iconFor(item)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-[13px]">{title}</div>
            {showTier && <Dots tier={item.tier || "bonus"} />}
          </div>
          <div className="mt-0.5 text-[11.5px] leading-[1.45] text-[var(--muted)]">{item.desc}</div>
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <Bar value={item.progress} total={item.target} />
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="tabular-nums text-[var(--muted)]">
            {Math.min(item.progress, item.target)} / {item.target}
            {showTier && <span className="ml-2 text-[var(--faint)]">{TIER[item.tier || "bonus"]}</span>}
          </span>
          {state === "ready" ? (
            <button
              type="button"
              disabled={busy}
              onClick={onClaim}
              className="h-7 rounded-md bg-[var(--accent)] px-3 text-[12px] text-[var(--bg)] disabled:opacity-60"
            >
              {busy ? "…" : `Claim +${item.points}`}
            </button>
          ) : (
            <span className="tabular-nums text-[var(--faint)]">
              {state === "claimed" ? "Claimed · " : ""}+{item.points} pts · {formatCredits(item.points / perCredit)} cr
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function Stat({ icon, label, value }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--panel-soft)] text-[var(--accent)]">
        <Glyph name={icon} />
      </div>
      <div>
        <div className="tabular-nums text-[20px] leading-none">{value}</div>
        <div className="mt-1 text-[11px] text-[var(--faint)]">{label}</div>
      </div>
    </Card>
  );
}

function Head({ title, right }) {
  return (
    <div className="mb-2 flex items-center justify-between text-[12px] text-[var(--faint)]">
      <span>{title}</span>
      <span className="tabular-nums">{right}</span>
    </div>
  );
}

export default function QuestsView({ token = "", onRefresh }) {
  const { address, isConnected } = useAccount();
  const { notice } = useAppState();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
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
      setError(failure.message || "Achievements did not load.");
    }
  };

  useEffect(() => {
    setData(null);
    load();
  }, [address, token]);

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
      if (won) notice?.(`+${won.points} points, +${formatCredits(won.credits)} credits for Hamrin.`);
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
  const achievements = data?.achievements || [];
  const ready = (data ? [...data.daily, data.bonus, ...achievements] : []).filter((item) => item.done && !item.claimed).length;
  const claimedTotal = achievements.filter((item) => item.claimed).length;
  const unknown = achievements.filter((item) => !GROUPS.some((group) => group.match.includes(item.group)));

  if (!isConnected || !address) {
    return (
      <Page wide>
        <Card className="px-5 py-6 text-[13.5px] leading-6 text-[var(--muted)]">
          Connect your wallet to earn credits. Points and credits belong to the address you sign in with.
        </Card>
      </Page>
    );
  }

  if (!token) {
    return (
      <Page wide>
        <Card className="px-5 py-6 text-[13.5px] leading-6 text-[var(--muted)]">
          Sign in on the Ops tab first. Achievements count what you do with your signed-in wallet, so there is nothing to track until you are in.
        </Card>
      </Page>
    );
  }

  return (
    <Page wide>
      <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <Card className="p-5">
          {data ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--panel-soft)] text-[var(--accent)]">
                  <Glyph name="trophy" size={20} />
                </div>
                <div>
                  <div className="text-[11px] text-[var(--faint)]">Level</div>
                  <div className="tabular-nums text-[28px] leading-none tracking-[-0.02em]">{level.number}</div>
                </div>
                <div className="ml-auto text-right text-[11.5px] leading-5 text-[var(--muted)]">
                  <div className="tabular-nums">{data.points.toLocaleString()} points</div>
                  <div className="tabular-nums text-[var(--faint)]">
                    {level.next ? `${(level.next - data.points).toLocaleString()} to level ${level.number + 1}` : "Top level"}
                  </div>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--stroke-soft)]">
                <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-700" style={{ width: `${level.share * 100}%` }} />
              </div>
            </>
          ) : error ? (
            <div className="text-[13px] text-[var(--muted)]">{error}</div>
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-1.5 w-full" />
            </div>
          )}
        </Card>
        <Stat icon="flame" label="Day streak" value={data ? data.streak : "…"} />
        <Stat icon="bolt" label="Credits earned" value={data ? formatCredits(data.creditsEarned) : "…"} />
        <Stat icon="check" label="Achievements" value={data ? `${claimedTotal}/${achievements.length}` : "…"} />
      </div>

      <p className="mb-6 mt-3 text-[12px] leading-5 text-[var(--muted)]">
        Finish challenges to earn points, then claim them. {perCredit.toLocaleString()} points become 1 Hamrin 1.0 credit, and earned credits never reset.
        {ready > 0 && <span className="text-[var(--accent)]"> {ready} ready to claim.</span>}
      </p>

      <section className="mb-7">
        <Head title="Today" right={Number.isFinite(left) ? `New challenges in ${clock(left)}` : ""} />
        {data?.trials && (
          <p className="-mt-1 mb-2 text-[11.5px] text-[var(--faint)]">
            Level {data.trials.level + 1} difficulty: goals x{data.trials.goalMult}, rewards x{data.trials.rewardMult}
            {data.trials.epic ? ". The Expert challenge is included." : `. An Expert challenge is added at level ${EXPERT_LEVEL}.`}
          </p>
        )}
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {data ? (
            <>
              {data.daily.map((item) => (
                <Item key={item.id} item={item} showTier perCredit={perCredit} busy={busy === "daily:" + item.id} onClaim={() => claim("daily", item.id)} />
              ))}
              <Item item={{ ...data.bonus, tier: "bonus" }} showTier perCredit={perCredit} busy={busy === "daily:daily-all"} onClaim={() => claim("daily", "daily-all")} />
            </>
          ) : (
            [0, 1, 2].map((key) => <Skeleton key={key} className="h-[128px] w-full rounded-2xl" />)
          )}
        </div>
      </section>

      {data &&
        [...GROUPS, ...(unknown.length ? [{ label: "More", match: unknown.map((item) => item.group) }] : [])].map((group) => {
          const items = achievements.filter((item) => group.match.includes(item.group));
          if (!items.length) return null;
          const got = items.filter((item) => item.claimed).length;
          return (
            <section key={group.label} className="mb-7">
              <Head title={group.label} right={`${got}/${items.length}`} />
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <Item key={item.id} item={item} perCredit={perCredit} busy={busy === "achievement:" + item.id} onClaim={() => claim("achievement", item.id)} />
                ))}
              </div>
            </section>
          );
        })}
    </Page>
  );
}
