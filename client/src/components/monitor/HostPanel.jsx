import { useTranslation } from "react-i18next";
import {
  CpuChipIcon,
  CircleStackIcon,
  ServerStackIcon,
} from "@heroicons/react/24/outline";
import Sparkline from "../shared/Sparkline";
import { formatBytes, formatDuration } from "../../utils/byteUtils";

const barColor = (p) => (p >= 90 ? "#ef4444" : p >= 70 ? "#f59e0b" : "#34d399");

const Metric = ({ icon: Icon, label, percent, detail, series }) => (
  <div className="bg-slate-900/50 rounded-lg p-3 border border-white/10">
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-white">{label}</span>
      </div>
      <span className="text-sm font-mono text-slate-200">
        {percent == null ? "-" : `${percent}%`}
      </span>
    </div>
    <Sparkline data={series} max={100} color={barColor(percent ?? 0)} />
    {detail && (
      <p className="mt-1 text-xs text-slate-400 font-mono truncate">{detail}</p>
    )}
  </div>
);

const HostPanel = ({ host }) => {
  const { t } = useTranslation();
  const current = host?.current;
  if (!current) return null;

  const series = (key) => (host.history || []).map((s) => s[key]);

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
          series={series("cpu")}
        />
        <Metric
          icon={CircleStackIcon}
          label={t("resourceCard.memoryUsage")}
          percent={current.memPercent}
          detail={`${formatBytes(current.memUsedBytes)} / ${formatBytes(current.memTotalBytes)}`}
          series={series("mem")}
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
          series={series("disk")}
        />
      </div>
    </div>
  );
};

export default HostPanel;
