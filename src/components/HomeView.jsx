import { useAppState } from "../AppState.jsx";
import DayTasksPanel from "./DayTasksPanel.jsx";

const CHIPS = [
  "Explain this project's structure",
  "Find and summarize the main entry point",
  "Look for bugs or risky code",
  "Add a small feature",
];

const MARKET_CHIPS = [
  "Read the tape: F&G, BTC.D, PALM vs ETH. What's the regime?",
  "What are BTC funding and fees saying about leverage?",
  "Name today's lead gainer and laggard from the prints.",
  "Is PALM holding its ground versus BTC on this tape?",
];

export default function HomeView({ onChip, onTemplates, onShip, clockOn, project, marketOn = false, onNotes }) {
  const { dayGoals, toggleDayGoal } = useAppState();

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto md:block">
      <div className={`flex px-3 py-3 md:h-full md:min-h-0 md:items-center md:justify-center md:px-8 md:py-0 ${clockOn ? "" : "min-h-[280px] items-center justify-center py-8"}`}>
        {clockOn ? (
          <DayTasksPanel goals={dayGoals} onToggleGoal={toggleDayGoal} onEdit={onNotes} />
        ) : (
          <div className="max-w-[560px] text-center">
            <button type="button" onClick={onShip || onTemplates} className="text-[14px] text-[var(--muted)] hover:text-[var(--ink)]">
              Ship an app <span className="text-[11px] text-[var(--faint)]">3 steps</span>
            </button>
            <h1 className="home-title mt-3.5 text-[22px] font-normal md:text-[23px]">
              {marketOn ? "What is the tape saying?" : "What should we build?"}
            </h1>
            <p className="mx-auto mt-2 max-w-[520px] text-[13px] text-[var(--muted)]">
              {marketOn
                ? "Live prints on PALM and majors. Ask about a pair, a move, or this wallet."
                : `Coding agent ready${project ? ` on ${project.label}` : ""}. Ask anything about this project.`}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {(marketOn ? MARKET_CHIPS : CHIPS).map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onChip(chip)}
                  className="rounded-full border border-[var(--stroke)] bg-[color-mix(in_srgb,var(--panel)_70%,transparent)] px-3.5 py-2 text-[13px] hover:bg-[var(--hover)]"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
