import { useEffect, useState } from "react";
import { useAppState } from "../../AppState.jsx";
import { Page, Card, Ghost } from "../ui.jsx";
import DayTasksPanel from "../DayTasksPanel.jsx";
import { dayPartFromDate, formatClock } from "../../dayClock.js";
import useNow from "../../hooks/useNow.js";

export default function NotesView() {
  const { dayGoals, toggleDayGoal, addDayGoal } = useAppState();
  const now = useNow();
  const [draft, setDraft] = useState("");
  const [body, setBody] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("root-web-notes") || "{}").body || "## Today\n\n";
    } catch {
      return "## Today\n\n";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("root-web-notes", JSON.stringify({ body }));
    } catch {
      /* ignore */
    }
  }, [body]);

  return (
    <Page>
      <div className="mb-3 flex items-center justify-end">
        <div className="text-[11px] tabular-nums text-[var(--faint)]">{formatClock(now)}</div>
      </div>
      <DayTasksPanel goals={dayGoals} onToggleGoal={toggleDayGoal} />
      <Card className="mb-4 p-4">
        <div className="mb-2 text-[12px] text-[var(--faint)]">Add a goal</div>
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a goal"
            className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 text-[14px] outline-none"
          />
          <Ghost
            onClick={() => {
              addDayGoal(draft, dayPartFromDate());
              setDraft("");
            }}
          >
            Add
          </Ghost>
        </div>
      </Card>
      <Card className="p-4">
        <div className="mb-2 text-[12px] text-[var(--faint)]">Markdown</div>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={10}
          className="w-full resize-y bg-transparent text-[14px] leading-6 outline-none"
        />
      </Card>
    </Page>
  );
}
