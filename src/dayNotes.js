/** Day-note helpers shared by the clock, Notes view, and Miles. */

import { dayPartFromDate } from "./dayClock.js";

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function normalizeNote(row, fallbackPart = dayPartFromDate()) {
  if (!row || typeof row !== "object") return null;
  const text = String(row.text || "").trim();
  if (!text) return null;
  return {
    id: String(row.id || Date.now()),
    text: text.slice(0, 280),
    done: Boolean(row.done),
    part: String(row.part || fallbackPart),
    day: String(row.day || todayKey()).slice(0, 10),
    projectId: String(row.projectId || ""),
    projectLabel: String(row.projectLabel || ""),
    conversationId: String(row.conversationId || ""),
    conversationTitle: String(row.conversationTitle || ""),
    milesRemind: Boolean(row.milesRemind),
    remindAt: row.remindAt ? String(row.remindAt) : null,
    createdAt: row.createdAt || "",
    updatedAt: row.updatedAt || "",
  };
}

export function noteLinkLabel(note) {
  if (!note) return "";
  if (note.conversationTitle) return note.conversationTitle;
  if (note.projectLabel) return note.projectLabel;
  if (note.conversationId) return "Chat";
  if (note.projectId) return "Project";
  return "";
}

export function remindLabel(note) {
  if (!note?.milesRemind) return "";
  if (!note.remindAt) return "Miles will nudge";
  const at = Date.parse(note.remindAt);
  if (!Number.isFinite(at)) return "Miles will nudge";
  const date = new Date(at);
  return (
    "Miles · " +
    String(date.getHours()).padStart(2, "0") +
    ":" +
    String(date.getMinutes()).padStart(2, "0")
  );
}

export function dueLocalNotes(notes, now = Date.now()) {
  return (Array.isArray(notes) ? notes : []).filter((note) => {
    if (!note || note.done || !note.milesRemind) return false;
    if (!note.remindAt) return note.part === dayPartFromDate(new Date(now));
    const at = Date.parse(note.remindAt);
    return Number.isFinite(at) && at <= now;
  });
}
