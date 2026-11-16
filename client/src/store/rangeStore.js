import { create } from "zustand";

export const RANGE_PRESETS = [
  { id: "5m", minutes: 5 },
  { id: "30m", minutes: 30 },
  { id: "3h", minutes: 180 },
  { id: "24h", minutes: 1440 },
];

// The server keeps 90 days of history (it also reports it in /overview).
export const MAX_RANGE_DAYS = 90;

/**
 * Time range shared by every monitoring widget (host, list rows, details).
 * Presets are relative to "now"; a custom range is an absolute from/to.
 */
const useRangeStore = create((set) => ({
  preset: "30m",
  from: null,
  to: null,
  setPreset: (preset) => set({ preset, from: null, to: null }),
  setCustom: (from, to) => set({ preset: "custom", from, to }),
}));

/** Query params for the monitor API, plus a stable cache key. */
export const toRangeParams = ({ preset, from, to }) => {
  if (preset === "custom" && from && to) {
    return { from, to };
  }
  const found = RANGE_PRESETS.find((p) => p.id === preset) || RANGE_PRESETS[1];
  return { minutes: found.minutes };
};

export const useRangeParams = () => {
  const preset = useRangeStore((s) => s.preset);
  const from = useRangeStore((s) => s.from);
  const to = useRangeStore((s) => s.to);
  return toRangeParams({ preset, from, to });
};

export default useRangeStore;
