import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useAppState } from "../../AppState.jsx";
import { DAY_PART_META, DAY_PARTS, dayPartFromDate } from "../../dayClock.js";
import { noteLinkLabel, remindLabel, todayKey } from "../../dayNotes.js";
import { createNote, removeNote, updateNote } from "../../glmChat.js";
import { Icon } from "../Icons.jsx";
import { Card, Field, Ghost, Page, Primary, Section } from "../ui.jsx";

function partOptions() {
  return DAY_PARTS.map((id) => ({ id, label: DAY_PART_META[id].name }));
}

function remindOptions() {
  const now = new Date();
  const round = new Date(now);
  round.setSeconds(0, 0);
  round.setMinutes(round.getMinutes() + (15 - (round.getMinutes() % 15 || 15)));
  const slots = [];
  for (let i = 0; i < 8; i += 1) {
    const at = new Date(round.getTime() + i * 30 * 60_000);
    const label =
      String(at.getHours()).padStart(2, "0") + ":" + String(at.getMinutes()).padStart(2, "0");
    slots.push({ id: at.toISOString(), label });
  }
  return slots;
}

export default function NotesView({ cloudSessions = [], onOpenChat, onOpenProject }) {
  const { address, isConnected } = useAccount();
  const {
    dayGoals,
    addDayGoal,
    updateDayGoal,
    removeDayGoal,
    toggleDayGoal,
    projects,
    project,
    notice,
  } = useAppState();
  const [part, setPart] = useState(dayPartFromDate());
  const [draft, setDraft] = useState("");
  const [projectId, setProjectId] = useState(project?.id || "");
  const [conversationId, setConversationId] = useState("");
  const [milesRemind, setMilesRemind] = useState(false);
  const [remindAt, setRemindAt] = useState("");
  const [busy, setBusy] = useState("");
  const day = todayKey();
  const rows = useMemo(() => dayGoals.filter((item) => (item.part || "afternoon") === part), [dayGoals, part]);
  const chats = useMemo(() => {
    const list = Array.isArray(cloudSessions) ? cloudSessions : [];
    if (!projectId) return list.filter((item) => !item.archived).slice(0, 20);
    return list.filter((item) => item.projectId === projectId && !item.archived).slice(0, 20);
  }, [cloudSessions, projectId]);
  const remindSlots = useMemo(() => remindOptions(), []);

  const selectedProject = projects.find((item) => item.id === projectId) || null;
  const selectedChat = chats.find((item) => item.id === conversationId) || null;

  const persistCreate = async (note) => {
    if (!isConnected || !address) return note;
    try {
      const data = await createNote(address, {
        ...note,
        day,
      });
      if (data?.note) {
        updateDayGoal(note.id, data.note);
        return data.note;
      }
      return note;
    } catch (error) {
      notice?.(error.message || "Could not save that note.");
      return note;
    }
  };

  const persistPatch = async (id, patch) => {
    updateDayGoal(id, patch);
    if (!isConnected || !address) return;
    try {
      const data = await updateNote(address, id, patch);
      if (data?.note) updateDayGoal(id, data.note);
    } catch (error) {
      notice?.(error.message || "Could not update that note.");
    }
  };

  const persistDelete = async (id) => {
    removeDayGoal(id);
    if (!isConnected || !address) return;
    try {
      await removeNote(address, id);
    } catch (error) {
      notice?.(error.message || "Could not delete that note.");
    }
  };

  const onAdd = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy("add");
    const note = addDayGoal(text, part, {
      day,
      projectId: selectedProject?.id || "",
      projectLabel: selectedProject?.label || "",
      conversationId: selectedChat?.id || "",
      conversationTitle: selectedChat?.title || "",
      milesRemind,
      remindAt: milesRemind ? remindAt || null : null,
    });
    setDraft("");
    await persistCreate(note);
    setBusy("");
  };

  return (
    <Page>
      <div className="mb-5">
        <div className="text-[11px] tracking-[0.22em] text-[var(--faint)]">TODAY</div>
        <h1 className="mt-1 text-[28px] font-light tracking-[-0.02em]">{day}</h1>
        <p className="mt-1 max-w-[520px] text-[13.5px] leading-5 text-[var(--muted)]">
          Notes live on your wallet day ledger. Attach a Hub project or chat, and ask Miles to nudge you.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1">
        {partOptions().map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPart(item.id)}
            className={`h-9 rounded-xl px-3 text-[12.5px] ${
              part === item.id ? "bg-[var(--sidebar-sel)] text-[var(--ink)]" : "text-[var(--muted)] hover:bg-[var(--hover)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Card className="mb-5 overflow-hidden p-0">
        <div className="border-b border-[var(--stroke-soft)] px-4 py-3">
          <div className="text-[12px] text-[var(--faint)]">{DAY_PART_META[part].name} · {DAY_PART_META[part].range}</div>
        </div>
        <div className="divide-y divide-[var(--stroke-soft)]">
          {rows.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-[var(--faint)]">No notes in this part yet.</div>
          ) : (
            rows.map((item) => (
              <div key={item.id} className="flex items-start gap-3 px-4 py-3.5">
                <button
                  type="button"
                  onClick={() => persistPatch(item.id, { done: !item.done })}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    item.done ? "border-[var(--green)] bg-[var(--green)] text-[var(--bg)]" : "border-[var(--stroke)]"
                  }`}
                  aria-label={item.done ? "Mark open" : "Mark done"}
                >
                  {item.done ? "✓" : ""}
                </button>
                <div className="min-w-0 flex-1">
                  <div className={`text-[14.5px] leading-5 ${item.done ? "text-[var(--muted)] line-through" : ""}`}>
                    {item.text}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--muted)]">
                    {noteLinkLabel(item) && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-[var(--ink)]"
                        onClick={() => {
                          if (item.conversationId) onOpenChat?.(item.conversationId);
                          else if (item.projectId) onOpenProject?.(item.projectId);
                        }}
                      >
                        <Icon name={item.conversationId ? "chat" : "folder"} size={12} />
                        {noteLinkLabel(item)}
                      </button>
                    )}
                    {item.milesRemind && (
                      <span className="inline-flex items-center gap-1 text-[var(--accent)]">
                        <Icon name="bell" size={12} />
                        {remindLabel(item)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <select
                      value={item.projectId || ""}
                      onChange={(event) => {
                        const next = projects.find((row) => row.id === event.target.value) || null;
                        persistPatch(item.id, {
                          projectId: next?.id || "",
                          projectLabel: next?.label || "",
                        });
                      }}
                      className="h-8 rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-2 text-[12px]"
                    >
                      <option value="">No project</option>
                      {projects.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={item.conversationId || ""}
                      onChange={(event) => {
                        const next = (cloudSessions || []).find((row) => row.id === event.target.value) || null;
                        persistPatch(item.id, {
                          conversationId: next?.id || "",
                          conversationTitle: next?.title || "",
                          projectId: next?.projectId || item.projectId || "",
                          projectLabel:
                            projects.find((row) => row.id === (next?.projectId || item.projectId))?.label ||
                            item.projectLabel ||
                            "",
                        });
                      }}
                      className="h-8 max-w-[220px] rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-2 text-[12px]"
                    >
                      <option value="">No conversation</option>
                      {(cloudSessions || [])
                        .filter((row) => !row.archived)
                        .slice(0, 30)
                        .map((row) => (
                          <option key={row.id} value={row.id}>
                            {row.title || "Chat"}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        persistPatch(item.id, {
                          milesRemind: !item.milesRemind,
                          remindAt: !item.milesRemind ? item.remindAt || remindSlots[0]?.id || null : null,
                        })
                      }
                      className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] ${
                        item.milesRemind
                          ? "border-[var(--accent)] text-[var(--accent)]"
                          : "border-[var(--stroke)] text-[var(--muted)]"
                      }`}
                    >
                      <Icon name="bell" size={13} />
                      Miles
                    </button>
                    {item.milesRemind && (
                      <select
                        value={item.remindAt || ""}
                        onChange={(event) => persistPatch(item.id, { remindAt: event.target.value || null })}
                        className="h-8 rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-2 text-[12px]"
                      >
                        <option value="">This day part</option>
                        {remindSlots.map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => persistDelete(item.id)}
                  className="h-8 w-8 shrink-0 rounded-lg text-[16px] text-[var(--faint)] hover:bg-[var(--hover)] hover:text-[var(--ink)]"
                  aria-label="Delete note"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Section title="New note">
        <Card className="space-y-3 p-4">
          <Field
            label="What needs doing"
            value={draft}
            onChange={setDraft}
            placeholder="Ship the billing copy…"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <div className="mb-1.5 text-[11px] text-[var(--faint)]">Project</div>
              <select
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  setConversationId("");
                }}
                className="h-10 w-full rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 text-[14px]"
              >
                <option value="">None</option>
                {projects.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="mb-1.5 text-[11px] text-[var(--faint)]">Conversation</div>
              <select
                value={conversationId}
                onChange={(event) => setConversationId(event.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 text-[14px]"
              >
                <option value="">None</option>
                {chats.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.title || "Chat"}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Ghost active={milesRemind} onClick={() => setMilesRemind((prev) => !prev)}>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="bell" size={13} />
                Miles does this
              </span>
            </Ghost>
            {milesRemind && (
              <select
                value={remindAt}
                onChange={(event) => setRemindAt(event.target.value)}
                className="h-9 rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-2 text-[12.5px]"
              >
                <option value="">This day part</option>
                {remindSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.label}
                  </option>
                ))}
              </select>
            )}
            <Primary onClick={onAdd}>{busy === "add" ? "Saving…" : "Add note"}</Primary>
          </div>
          {!isConnected && (
            <div className="text-[12px] text-[var(--faint)]">Connect a wallet to keep notes in the shared day ledger.</div>
          )}
        </Card>
      </Section>
    </Page>
  );
}
