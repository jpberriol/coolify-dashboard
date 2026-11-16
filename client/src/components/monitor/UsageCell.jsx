import { useOverview } from "../../hooks/useMonitor";
import Sparkline from "../shared/Sparkline";
import { formatBytes } from "../../utils/byteUtils";

const tone = (p) =>
  p >= 90 ? "text-red-400" : p >= 70 ? "text-amber-400" : "text-emerald-400";
const stroke = (p) => (p >= 90 ? "#f87171" : p >= 70 ? "#fbbf24" : "#34d399");

const Line = ({ label, value, series, max, title }) => (
  <div className="flex items-center gap-2" title={title}>
    <span className="w-7 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </span>
    <div className="min-w-0 flex-1">
      <Sparkline data={series} max={max} color={stroke(value)} height={16} />
    </div>
    <span className={`w-12 text-right text-xs font-mono ${tone(value)}`}>
      {value}%
    </span>
  </div>
);

/**
 * Live CPU/RAM for a list row, available without expanding the resource.
 * Sparklines follow the range selected in the monitoring panel.
 */
const UsageCell = ({ uuid }) => {
  const { data } = useOverview();
  const u = data?.usage?.[uuid];

  if (!u) {
    return <span className="text-xs text-slate-600">—</span>;
  }

  const cpuSeries = u.series.map((p) => p.cpu);
  const memSeries = u.series.map((p) => p.memPct);

  return (
    <div className="w-full space-y-0.5">
      <Line
        label="CPU"
        value={u.cpu}
        series={cpuSeries}
        title={`CPU peak ${u.peakCpu}%`}
      />
      <Line
        label="RAM"
        value={u.memPct}
        series={memSeries}
        max={100}
        title={`${formatBytes(u.mem)} · peak ${u.peakMemPct}%`}
      />
    </div>
  );
};

export default UsageCell;
