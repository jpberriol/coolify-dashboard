import { useTranslation } from "react-i18next";
import {
  CpuChipIcon,
  CircleStackIcon,
  ServerStackIcon,
} from "@heroicons/react/24/outline";
import TimeChart from "../shared/TimeChart";
import { formatBytes, formatDuration } from "../../utils/byteUtils";

const barColor = (p) => (p >= 90 ? "#ef4444" : p >= 70 ? "#f59e0b" : "#34d399");

const Metric = ({ icon: Icon, label, percent, detail, data, range, empty }) => (
  <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-white">{label}</span>
      </div>
      <span className="text-sm font-mono text-slate-200">
        {percent == null ? "-" : `${percent}%`}
      </span>
    </div>
    <TimeChart
      data={data}
      from={range.from}
      to={range.to}
      max={100}
      color={barColor(percent ?? 0)}
      format={(v) => `${v}%`}
      emptyText={empty}
    />
    {detail && (
      <p className="mt-1 text-xs text-slate-400 font-mono truncate">{detail}</p>
    )}
  </div>
);

const HostPanel = ({ host }) => {
  const { t } = useTranslation();
  const current = host?.current;
  if (!current) return null;

  const series = (key) =>
    (host.history || []).map((s) => ({ t: s.t, v: s[key] }));
  const range = host.range;
  const empty = t("monitor.noData");

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
        <span className="font-semibold text-slate-200">
          {t("monitor.host")}
        </span>
        <span className="font-mono">{current.hostname}</span>
        <span>·</span>
        <span>
          {t("monitor.uptime")} {formatDuration(current.uptimeSec)}
        </span>
        <span>·</span>
        <span>
          {t("monitor.load")} {current.load.map((l) => l.toFixed(2)).join(" ")}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Metric
          icon={CpuChipIcon}
          label="CPU"
          percent={current.cpuPercent}
          detail={`${current.cpuCount} cores`}
          data={series("cpu")}
          range={range}
          empty={empty}
        />
        <Metric
          icon={CircleStackIcon}
          label={t("resourceCard.memoryUsage")}
          percent={current.memPercent}
          detail={`${formatBytes(current.memUsedBytes)} / ${formatBytes(current.memTotalBytes)}`}
          data={series("mem")}
          range={range}
          empty={empty}
        />
        <Metric
          icon={ServerStackIcon}
          label={t("monitor.disk")}
          percent={current.disk?.percent}
          detail={
            current.disk
              ? `${formatBytes(current.disk.usedBytes)} / ${formatBytes(current.disk.totalBytes)}`
              : t("monitor.unavailable")
          }
          data={series("disk")}
          range={range}
          empty={empty}
        />
      </div>
    </div>
  );
};

export default HostPanel;
