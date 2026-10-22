import { useEffect, useState } from "react";
import { Page, Card, Ghost } from "../ui.jsx";

const STARTER = {
  items: [
    { id: "1", done: true, text: "Ship Farm widget" },
    { id: "2", done: false, text: "Theme the landing" },
    { id: "3", done: false, text: "Write X post" },
  ],
  body: "## Today\n\nShip the Expo preview on Farm.\n\n- Confirm the app loads\n- Push an APK",
};

function readNotes() {
  try {
    const raw = localStorage.getItem("root-web-notes");
    return raw ? JSON.parse(raw) : STARTER;
  } catch {
    return STARTER;
  }
}

export default function NotesView() {
  const [items, setItems] = useState(() => readNotes().items);
  const [draft, setDraft] = useState("");
  const [body, setBody] = useState(() => readNotes().body);

  useEffect(() => {
    try {
      localStorage.setItem("root-web-notes", JSON.stringify({ items, body }));
    } catch {
      /* ignore */
    }
  }, [items, body]);

  return (
    <Page>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[22px]">Notes</div>
        <div className="text-[12px] text-[var(--faint)]">Today</div>
      </div>
      <Card className="mb-4 p-4">
        <div className="mb-2 text-[12px] text-[var(--faint)]">Goals</div>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() =>
                  setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, done: !row.done } : row)))
                }
                className="flex w-full items-center gap-3 text-left"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    item.done ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]" : "border-[var(--stroke)]"
                  }`}
                >
                  {item.done ? "✓" : ""}
                </span>
                <span className={item.done ? "text-[var(--faint)] line-through" : ""}>{item.text}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a goal"
            className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 text-[14px] outline-none"
          />
          <Ghost
            onClick={() => {
              if (!draft.trim()) return;
              setItems((prev) => [...prev, { id: String(Date.now()), done: false, text: draft.trim() }]);
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
