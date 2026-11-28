import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useAppState } from "../../AppState.jsx";
import { DAY_PART_META, DAY_PARTS, dayPartFromDate } from "../../dayClock.js";
import { noteLinkLabel, remindLabel, todayKey } from "../../dayNotes.js";
import { createNote, draftNotes, removeNote, updateNote } from "../../glmChat.js";
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

export default function NotesView({ hubProjects = [], cloudSessions = [], onOpenChat, onOpenProject }) {
  const { address, isConnected } = useAccount();
  const {
    dayGoals,
    addDayGoal,
    updateDayGoal,
    removeDayGoal,
    notice,
  } = useAppState();
  const projects = hubProjects;
  const [part, setPart] = useState(dayPartFromDate());
  const [draft, setDraft] = useState("");
  const [plan, setPlan] = useState("");
  const [projectId, setProjectId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [milesRemind, setMilesRemind] = useState(false);
  const [remindAt, setRemindAt] = useState("");
  const [busy, setBusy] = useState("");
  const [suggestions, setSuggestions] = useState([]);
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
      plan,
    });
    setDraft("");
    setPlan("");
    await persistCreate(note);
    setBusy("");
  };

  const askSuggestions = async () => {
    if (!isConnected || !address || busy) return;
    setBusy("suggest");
    try {
      const data = await draftNotes(address, {
        kind: "suggest",
        text: draft,
        projectLabel: selectedProject?.label || "",
        notes: dayGoals.map((item) => item.text),
      });
      setSuggestions((data.suggestions || []).filter(Boolean));
      if (!data.suggestions?.length) notice?.("Hamrin did not suggest any notes.");
    } catch (error) {
      notice?.(error.message || "Could not suggest notes.");
    } finally {
      setBusy("");
    }
  };

  const askPlan = async (text, instructions, apply, projectLabel) => {
    if (!isConnected || !address || busy) return;
    setBusy("plan");
    try {
      const data = await draftNotes(address, {
        kind: "plan",
        text,
        instructions,
        projectLabel: projectLabel || selectedProject?.label || "",
      });
      const next = String(data.plan || "").trim();
      if (!next) {
        notice?.("Hamrin did not write a plan.");
        return;
      }
      apply(next);
    } catch (error) {
      notice?.(error.message || "Could not write a plan.");
    } finally {
      setBusy("");
    }
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
                  {item.plan && (
                    <div className="mt-1 whitespace-pre-wrap text-[12.5px] leading-5 text-[var(--muted)]">{item.plan}</div>
                  )}
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
                      onClick={() => askPlan(item.text, item.plan, (next) => persistPatch(item.id, { plan: next }), item.projectLabel)}
                      className="inline-flex h-8 items-center rounded-lg border border-[var(--stroke)] px-2.5 text-[12px] text-[var(--muted)] hover:text-[var(--ink)]"
                    >
                      {busy === "plan" ? "Writing…" : item.plan ? "Rewrite plan" : "Write plan"}
                    </button>
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] text-[var(--faint)]">What needs doing</div>
            <button
              type="button"
              onClick={askSuggestions}
              disabled={!isConnected || !!busy}
              className="text-[12px] text-[var(--accent)] disabled:opacity-50"
            >
              {busy === "suggest" ? "Suggesting…" : "Suggest with Hamrin"}
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setDraft(item);
                    setSuggestions((prev) => prev.filter((row) => row !== item));
                  }}
                  className="rounded-full border border-[var(--stroke)] px-3 py-1 text-left text-[12.5px] text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
          <Field value={draft} onChange={setDraft} placeholder="Ship the billing copy…" />
          <label className="block">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[11px] text-[var(--faint)]">Plan</span>
              <button
                type="button"
                disabled={!isConnected || !!busy || !draft.trim()}
                onClick={() => askPlan(draft, plan, setPlan)}
                className="text-[12px] text-[var(--accent)] disabled:opacity-50"
              >
                {busy === "plan" ? "Writing…" : plan.trim() ? "Rewrite with Hamrin" : "Generate plan"}
              </button>
            </div>
            <textarea
              value={plan}
              onChange={(event) => setPlan(event.target.value)}
              placeholder="Instructions Miles should follow, or leave this for Hamrin to write."
              rows={4}
              className="w-full resize-y rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 py-2 text-[14px] leading-5 outline-none"
            />
          </label>
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
              {projects.length === 0 && (
                <div className="mt-1.5 text-[11.5px] leading-4 text-[var(--faint)]">
                  Hub repos show here once this wallet is signed in. Chats were already loaded, so the project list was empty.
                </div>
              )}
            </label>
            <label className="block">
              <div className="mb-1.5 text-[11px] text-[var(--faint)]">Conversation</div>
              <select
                value={conversationId}
                onChange={(event) => {
                  const next = chats.find((row) => row.id === event.target.value) || null;
                  setConversationId(event.target.value);
                  if (next?.projectId && projects.some((row) => row.id === next.projectId)) setProjectId(next.projectId);
                }}
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
