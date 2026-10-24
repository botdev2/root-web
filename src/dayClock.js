export const DAY_PARTS = ["morning", "afternoon", "evening", "night"];

export const DAY_PART_META = {
  morning: { name: "Morning", range: "05:00–11:59", tint: "rgba(251,191,36,0.28)" },
  afternoon: { name: "Afternoon", range: "12:00–16:59", tint: "rgba(56,189,248,0.28)" },
  evening: { name: "Evening", range: "17:00–20:59", tint: "rgba(249,115,22,0.28)" },
  night: { name: "Night", range: "21:00–04:59", tint: "rgba(99,102,241,0.28)" },
};

const ARC_START = { morning: 180, afternoon: 270, evening: 0, night: 90 };

export function dayPartFromDate(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function periodStart(part, date = new Date()) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (part === "morning") return new Date(day.getTime() + 5 * 3600000);
  if (part === "afternoon") return new Date(day.getTime() + 12 * 3600000);
  if (part === "evening") return new Date(day.getTime() + 17 * 3600000);
  if (date.getHours() < 5) return new Date(day.getTime() - 3 * 3600000);
  return new Date(day.getTime() + 21 * 3600000);
}

export function periodEnd(part, date = new Date()) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (part === "morning") return new Date(day.getTime() + 11 * 3600000 + 59 * 60000 + 59000);
  if (part === "afternoon") return new Date(day.getTime() + 16 * 3600000 + 59 * 60000 + 59000);
  if (part === "evening") return new Date(day.getTime() + 20 * 3600000 + 59 * 60000 + 59000);
  if (date.getHours() < 5) return new Date(day.getTime() + 4 * 3600000 + 59 * 60000 + 59000);
  return new Date(day.getTime() + 28 * 3600000 + 59 * 60000 + 59000);
}

export function isWithinPeriod(part, date = new Date()) {
  return date >= periodStart(part, date) && date <= periodEnd(part, date);
}

export function hasDayPartPassed(part, date = new Date()) {
  if (isWithinPeriod(part, date)) return false;
  const current = dayPartFromDate(date);
  if (current === "night" && date.getHours() < 5) return false;
  const order = DAY_PARTS;
  if (part === "night" && current !== "night" && date.getHours() >= 5) return true;
  return order.indexOf(part) < order.indexOf(current);
}

export function timeOfDayAngle(date = new Date()) {
  const part = dayPartFromDate(date);
  const start = periodStart(part, date);
  const end = periodEnd(part, date);
  const span = Math.max(1, end - start);
  const elapsed = Math.max(0, Math.min(span, date - start));
  return ARC_START[part] + (elapsed / span) * 90;
}

export function midnightAngle() {
  return 90 + (3 / 9) * 90;
}

export function polar(cx, cy, radius, degrees) {
  const radians = (degrees * Math.PI) / 180;
  return [cx + Math.cos(radians) * radius, cy + Math.sin(radians) * radius];
}

export function arcPath(startDegrees, radius = 166) {
  const [x1, y1] = polar(160, 160, radius, startDegrees);
  const [x2, y2] = polar(160, 160, radius, startDegrees + 90);
  return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
}

export function formatClock(date = new Date()) {
  return [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join(":");
}

export function formatClockShort(date = new Date()) {
  return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
}

export function formatDateLine(date = new Date()) {
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).replace(/,\s*\d{4}$/, "");
}

export function formatCenterDate(date = new Date()) {
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export function formatWeekday(date = new Date()) {
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

export { ARC_START };
