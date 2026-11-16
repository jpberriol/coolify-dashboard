import { useTranslation } from "react-i18next";
import { RocketLaunchIcon } from "@heroicons/react/24/outline";
import { useDeployments } from "../../hooks/useMonitor";
import { formatDuration } from "../../utils/byteUtils";
import { getTimeAgo } from "../../utils/dateUtils";

const STATUS_STYLE = {
  finished: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  failed: "bg-red-500/15 text-red-300 border-red-500/30",
  in_progress: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  queued: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "cancelled-by-user": "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const ResourceDeployments = ({ resourceUuid }) => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useDeployments(resourceUuid);

  return (
    <div className="bg-slate-900/50 rounded-lg p-4 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <RocketLaunchIcon className="w-5 h-5 text-orange-400" />
        <span className="text-sm font-semibold text-white">
          {t("monitor.deployments")}
        </span>
      </div>

      {isLoading && (
        <p className="text-xs text-slate-400">{t("common.loading")}</p>
      )}
      {!isLoading && (isError || !data || data.length === 0) && (
        <p className="text-xs text-slate-400">{t("monitor.noDeployments")}</p>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-2">
          {data.map((d) => (
            <li
              key={d.uuid}
              className="flex items-center gap-3 bg-slate-800/50 rounded px-3 py-2 text-xs"
            >
              <span
                className={`px-2 py-0.5 rounded border font-mono whitespace-nowrap ${
                  STATUS_STYLE[d.status] || STATUS_STYLE.queued
                }`}
              >
                {d.status}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-slate-200 truncate">
                  {d.commit && (
                    <span className="font-mono text-cyan-300 mr-2">
                      {d.commit}
                    </span>
                  )}
                  {d.commitMessage ||
                    (d.forceRebuild ? t("monitor.forceRebuild") : "-")}
                </p>
                <p className="text-slate-500">
                  {d.isWebhook ? "webhook" : d.isApi ? "api" : "manual"}
                  {d.pullRequestId ? ` · PR #${d.pullRequestId}` : ""}
                </p>
              </div>
              <div className="text-right text-slate-400 whitespace-nowrap">
                <p>{d.createdAt ? getTimeAgo(d.createdAt) : ""}</p>
                <p className="font-mono">{formatDuration(d.durationSec)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ResourceDeployments;
