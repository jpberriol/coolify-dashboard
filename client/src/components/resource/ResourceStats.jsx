import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ChartBarIcon,
  CpuChipIcon,
  CircleStackIcon,
} from "@heroicons/react/24/outline";
import apiClient from "../../services/ApiClient";
import { formatBytes } from "../../utils/byteUtils";

const usageBarColor = (percent) => {
  if (percent >= 90) return "bg-red-500";
  if (percent >= 70) return "bg-amber-500";
  return "bg-emerald-500";
};

const fetchStats = (resourceTypeId, resourceId) =>
  apiClient.get(`/stats/${resourceTypeId}/${resourceId}`);

const UsageBar = ({ label, icon: Icon, percent, detail }) => (
  <div className="bg-slate-800/50 rounded-lg p-3">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-white">{label}</span>
      </div>
      <span className="text-xs font-mono text-slate-300">{percent}%</span>
    </div>
    <div className="w-full h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${usageBarColor(percent)}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
    {detail && <p className="mt-1.5 text-xs text-slate-400 font-mono">{detail}</p>}
  </div>
);

/**
 * Live CPU/RAM usage, polled every 5s. Coolify's own API only exposes
 * configured limits, never actual consumption, so this hits our own
 * /api/coolify/stats/:type/:id route, which reads straight from the
 * Docker socket (see server/services/DockerStatsService.js).
 */
const ResourceStats = ({ resourceTypeId, resourceId }) => {
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["resource-stats", resourceTypeId, resourceId],
    queryFn: () => fetchStats(resourceTypeId, resourceId),
    refetchInterval: 5000,
    staleTime: 0,
    enabled: Boolean(resourceId),
  });

  return (
    <div className="bg-slate-900/50 rounded-lg p-4 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <ChartBarIcon className="w-5 h-5 text-emerald-400" />
        <span className="text-sm font-semibold text-white">
          {t("resourceCard.liveUsage")}
        </span>
      </div>

      {isLoading && (
        <p className="text-xs text-slate-400">{t("resourceCard.loadingStats")}</p>
      )}

      {!isLoading && (isError || !data || data.length === 0) && (
        <p className="text-xs text-slate-400">{t("resourceCard.noStatsAvailable")}</p>
      )}

      {!isLoading && data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((container) => (
            <div key={container.containerId} className="space-y-2">
              {data.length > 1 && (
                <p className="text-xs font-mono text-slate-500">{container.name}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <UsageBar
                  label={t("resourceCard.cpuUsage")}
                  icon={CpuChipIcon}
                  percent={container.cpuPercent}
                />
                <UsageBar
                  label={t("resourceCard.memoryUsage")}
                  icon={CircleStackIcon}
                  percent={container.memPercent}
                  detail={`${formatBytes(container.memUsageBytes)} / ${formatBytes(container.memLimitBytes)}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourceStats;
