export const MIN = 60000;
const HOUR = 3600000;
export const DAY = 86400000;
const STEPS = [
  MIN,
  2 * MIN,
  5 * MIN,
  10 * MIN,
  15 * MIN,
  30 * MIN,
  HOUR,
  2 * HOUR,
  3 * HOUR,
  4 * HOUR,
  6 * HOUR,
  12 * HOUR,
  DAY,
  2 * DAY,
  7 * DAY,
  14 * DAY,
];

const pad = (n) => String(n).padStart(2, "0");
const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const dayLabel = (d) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Tick timestamps for [from, to]: ~5-7 round values (every 5 min, 1 h, 6 h, 1 day...). */
export const buildTicks = (from, to) => {
  const span = to - from;
  const step = STEPS.find((s) => span / s <= 7) || STEPS[STEPS.length - 1];
  // Align to local time so ticks fall on :00, :30, midnight...
  const offset = -new Date(from).getTimezoneOffset() * MIN;
  const ticks = [];
  for (
    let t = Math.ceil((from + offset) / step) * step - offset;
    t <= to;
    t += step
  ) {
    ticks.push(t);
  }
  return { ticks, step };
};

export const tickLabel = (t, step, span) => {
  const d = new Date(t);
  if (step >= DAY) return dayLabel(d);
  if (span > DAY) return `${dayLabel(d)} ${hhmm(d)}`;
  return hhmm(d);
};
