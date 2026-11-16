import { useOverview } from "../../hooks/useMonitor";

/** Compact public-URL probe result for the resource list row. */
const HealthBadge = ({ uuid }) => {
  const { data } = useOverview();
  const h = data?.health?.[uuid];
  if (!h || h.up == null) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border font-mono ${
        h.up
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          : "bg-red-500/10 border-red-500/40 text-red-300"
      }`}
    >
      {h.up ? `${h.latencyMs} ms` : `HTTP ${h.status ?? "ERR"}`}
    </span>
  );
};

export default HealthBadge;
