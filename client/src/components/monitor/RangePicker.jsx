import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ClockIcon } from "@heroicons/react/24/outline";
import useRangeStore, {
  RANGE_PRESETS,
  MAX_RANGE_DAYS,
} from "../../store/rangeStore";

const toLocalInput = (ms) => {
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

const btn = (active) =>
  `px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
    active
      ? "bg-blue-600 text-white"
      : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

/** Compact time-range selector: 5m / 30m / 3h / 24h / custom. */
const RangePicker = () => {
  const { t } = useTranslation();
  const preset = useRangeStore((s) => s.preset);
  const from = useRangeStore((s) => s.from);
  const to = useRangeStore((s) => s.to);
  const setPreset = useRangeStore((s) => s.setPreset);
  const setCustom = useRangeStore((s) => s.setCustom);

  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [error, setError] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const openCustom = () => {
    const now = Date.now();
    setDraftFrom(toLocalInput(from || now - 3600000));
    setDraftTo(toLocalInput(to || now));
    setError("");
    setOpen((v) => !v);
  };

  const apply = () => {
    const f = new Date(draftFrom).getTime();
    const e = new Date(draftTo).getTime();
    if (!Number.isFinite(f) || !Number.isFinite(e) || e <= f) {
      setError(t("monitor.range.invalid"));
      return;
    }
    if (e - f > MAX_RANGE_DAYS * 86400000) {
      setError(t("monitor.range.tooLong", { days: MAX_RANGE_DAYS }));
      return;
    }
    setCustom(f, e);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="inline-flex items-center rounded-md border border-slate-700 bg-slate-900 overflow-hidden divide-x divide-slate-700">
        {RANGE_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setOpen(false);
              setPreset(p.id);
            }}
            className={btn(preset === p.id)}
          >
            {p.id}
          </button>
        ))}
        <button
          onClick={openCustom}
          className={`${btn(preset === "custom")} inline-flex items-center gap-1`}
          title={t("monitor.range.custom")}
        >
          <ClockIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("monitor.range.custom")}</span>
        </button>
      </div>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-xl">
          <label className="block text-xs text-slate-400 mb-1">
            {t("monitor.range.from")}
          </label>
          <input
            type="datetime-local"
            value={draftFrom}
            max={toLocalInput(Date.now())}
            onChange={(e) => setDraftFrom(e.target.value)}
            className="w-full mb-2 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="block text-xs text-slate-400 mb-1">
            {t("monitor.range.to")}
          </label>
          <input
            type="datetime-local"
            value={draftTo}
            max={toLocalInput(Date.now())}
            onChange={(e) => setDraftTo(e.target.value)}
            className="w-full mb-2 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
          <p className="mb-2 text-xs text-slate-500">
            {t("monitor.range.hint", { days: MAX_RANGE_DAYS })}
          </p>
          <button
            onClick={apply}
            className="w-full rounded-md bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition cursor-pointer"
          >
            {t("monitor.range.apply")}
          </button>
        </div>
      )}
    </div>
  );
};

export default RangePicker;
