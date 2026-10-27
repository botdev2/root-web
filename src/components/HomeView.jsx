import { useAppState } from "../AppState.jsx";
import DayTasksPanel from "./DayTasksPanel.jsx";

const CHIPS = [
  "Explain this project's structure",
  "Find and summarize the main entry point",
  "Look for bugs or risky code",
  "Add a small feature",
];

export default function HomeView({ onChip, onTemplates, clockOn, project }) {
  const { dayGoals, toggleDayGoal } = useAppState();

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto md:block">
      <aside className={`px-4 pt-3.5 md:absolute md:left-7 md:top-3.5 md:z-10 md:w-[min(440px,calc(100%-3rem))] md:px-0 md:pt-0 ${clockOn ? "order-2 pb-6" : ""}`}>
        <div className="frost-panel w-full rounded-2xl border border-[var(--stroke)] px-4 py-3.5 text-left shadow-lg">
          <div className="text-[10.5px]">{project ? project.label : "Ops Hub"}</div>
          <div className="mt-1.5 text-[13px] leading-5 text-[var(--ink)]">
            {project?.href ? (
              <a href={project.href} target="_blank" rel="noreferrer" className="underline">
                Open {project.label} on the Ops Hub
              </a>
            ) : (
              "Create a repository on the Ops Hub. It is stored for this wallet."
            )}
          </div>
        </div>
      </aside>

      <div className={`flex px-3 py-3 md:h-full md:min-h-0 md:items-center md:justify-center md:px-8 md:py-0 ${clockOn ? "order-1" : "min-h-[280px] items-center justify-center py-8"}`}>
        {clockOn ? (
          <DayTasksPanel goals={dayGoals} onToggleGoal={toggleDayGoal} />
        ) : (
          <div className="max-w-[560px] text-center">
            <button type="button" onClick={onTemplates} className="text-[14px] text-[var(--muted)] hover:text-[var(--ink)]">
              Create from Template <span className="text-[11px] text-[var(--faint)]">?</span>
            </button>
            <h1 className="home-title mt-3.5 text-[22px] font-normal md:text-[23px]">What should we build?</h1>
            <p className="mx-auto mt-2 max-w-[520px] text-[13px] text-[var(--muted)]">
              Coding agent ready{project ? ` on ${project.label}` : ""}. Ask anything about this project.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {CHIPS.map((chip) => (
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
