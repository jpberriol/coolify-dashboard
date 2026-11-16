import { useTranslation } from "react-i18next";
import {
  ShieldCheckIcon,
  ArchiveBoxIcon,
  GlobeAltIcon,
  CpuChipIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const DatabaseInfo = ({ resource }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`bg-slate-900 rounded-lg p-4 border ${
            resource.backup_configs && resource.backup_configs.length > 0
              ? "border-green-500/30"
              : "border-orange-500/30"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArchiveBoxIcon
                className={`w-5 h-5 ${
                  resource.backup_configs && resource.backup_configs.length > 0
                    ? "text-green-400"
                    : "text-orange-400"
                }`}
              />
              <span className="text-sm font-semibold text-white">
                {t("resourceCard.backup")}
              </span>
            </div>
            {(!resource.backup_configs ||
              resource.backup_configs.length === 0) && (
              <span
                className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded border border-orange-500/30 cursor-help"
                data-tooltip-id="backup-tooltip"
                data-tooltip-content={t("tooltips.backupWarning")}
              >
                {t("resourceCard.warning")}
              </span>
            )}
          </div>
          {resource.backup_configs && resource.backup_configs.length > 0 ? (
            <div className="inline-flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-300">
                {resource.backup_configs.length} active
              </span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded cursor-help"
              data-tooltip-id="backup-tooltip"
              data-tooltip-content={t("tooltips.backupWarning")}
            >
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-mono text-slate-300">
                {t("resourceCard.notConfigured")}
              </span>
            </div>
          )}
        </div>

        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <GlobeAltIcon className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-semibold text-white">
              {t("resourceCard.publicAccess")}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded">
            {resource.is_public ? (
              <>
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-300 font-mono">
                  {t("resourceCard.open")}
                </span>
              </>
            ) : (
              <>
                <XCircleIcon className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-300 font-mono">
                  {t("resourceCard.closed")}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold text-white">
              {t("resourceCard.sslStatus")}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 bg-slate-800/50 px-3 py-2 rounded">
            {resource.is_public_port_ssl_enabled ? (
              <>
                <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-emerald-300 font-mono">
                  {t("resourceCard.active")}
                </span>
              </>
            ) : (
              <>
                <XCircleIcon className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-300 font-mono">
                  {t("resourceCard.passive")}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {(resource.limits_cpu ||
        resource.limits_memory ||
        resource.limits_cpus ||
        resource.limits_memory_swap ||
        resource.limits_memory_reservation ||
        resource.limits_cpuset) && (
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <CpuChipIcon className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold text-white">
              {t("resourceCard.resourceLimits")}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {resource.limits_cpus && (
              <div className="bg-slate-800/50 px-3 py-2 rounded">
                <p className="text-xs text-slate-400 mb-1">CPU Cores</p>
                <p className="text-sm text-white font-mono">
                  {resource.limits_cpus === "0"
                    ? t("status.unlimited")
                    : resource.limits_cpus}
                </p>
              </div>
            )}
            {resource.limits_cpu && (
              <div className="bg-slate-800/50 px-3 py-2 rounded">
                <p className="text-xs text-slate-400 mb-1">CPU Limit</p>
                <p className="text-sm text-white font-mono">
                  {resource.limits_cpu === "0"
                    ? t("status.unlimited")
                    : resource.limits_cpu}
                </p>
              </div>
            )}
            {resource.limits_cpuset && (
              <div className="bg-slate-800/50 px-3 py-2 rounded">
                <p className="text-xs text-slate-400 mb-1">CPU Set</p>
                <p className="text-sm text-white font-mono">
                  {resource.limits_cpuset}
                </p>
              </div>
            )}
            {resource.limits_memory && (
              <div className="bg-slate-800/50 px-3 py-2 rounded">
                <p className="text-xs text-slate-400 mb-1">
                  {t("resourceCard.memoryLimit")}
                </p>
                <p className="text-sm text-white font-mono">
                  {resource.limits_memory === "0"
                    ? t("status.unlimited")
                    : resource.limits_memory}
                </p>
              </div>
            )}
            {resource.limits_memory_swap && (
              <div className="bg-slate-800/50 px-3 py-2 rounded">
                <p className="text-xs text-slate-400 mb-1">
                  {t("resourceCard.swapLimit")}
                </p>
                <p className="text-sm text-white font-mono">
                  {resource.limits_memory_swap === "0" ||
                  resource.limits_memory_swap === "-1"
                    ? t("status.unlimited")
                    : resource.limits_memory_swap}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseInfo;
