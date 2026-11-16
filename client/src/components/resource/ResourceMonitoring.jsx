import { useTranslation } from "react-i18next";
import {
  HeartIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import { useResourceDetail } from "../../hooks/useMonitor";
import Sparkline from "../shared/Sparkline";
import { formatBytes, formatRate, formatDuration } from "../../utils/byteUtils";

const Card = ({ icon: Icon, title, color = "text-emerald-400", children }) => (
  <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-sm font-semibold text-white">{title}</span>
    </div>
    {children}
  </div>
);

const Chart = ({ label, value, data, max, color }) => (
  <div className="bg-slate-800/60 rounded-lg p-3">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs font-semibold text-white">{label}</span>
      <span className="text-xs font-mono text-slate-300">{value}</span>
    </div>
    <Sparkline data={data} max={max} color={color} />
  </div>
);

const sslClass = (days) =>
  days < 0 || days <= 3
    ? "text-red-300"
    : days <= 14
      ? "text-amber-300"
      : "text-emerald-300";

const ResourceMonitoring = ({ resourceUuid }) => {
  const { t } = useTranslation();
  const { data } = useResourceDetail(resourceUuid);
  if (!data) return null;

  const { history, container, health, ssl } = data;
  const last = history[history.length - 1];
  const series = (key) => history.map((s) => s[key]);
  const hasHistory = history.length >= 2;
  const containers = container?.containers || [];
  const restarts = container?.restarts ?? 0;
  const oom = container?.oomKilled;

  if (!hasHistory && !health && !ssl.length && !container) return null;

  return (
    <div className="space-y-4">
      {(health || ssl.length > 0 || container) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {health && (
            <Card
              icon={HeartIcon}
              title={t("monitor.availability")}
              color="text-cyan-400"
            >
              <div className="space-y-1 text-xs font-mono text-slate-300">
                <p className={health.up ? "text-emerald-300" : "text-red-300"}>
                  {health.up ? t("monitor.up") : t("monitor.down")}
                  {health.last?.status ? ` · HTTP ${health.last.status}` : ""}
                  {health.last?.error ? ` · ${health.last.error}` : ""}
                </p>
                <p>
                  {t("monitor.latency")}: {health.last?.latencyMs ?? "-"} ms
                </p>
                <p>
                  {t("monitor.uptimeRatio")}:{" "}
                  {health.uptimePercent != null
                    ? `${health.uptimePercent}%`
                    : "-"}
                </p>
                <div className="flex gap-0.5 pt-1" title={health.url}>
                  {health.recent.map((c) => (
                    <span
                      key={c.t}
                      className={`h-4 w-1.5 rounded-sm ${c.ok ? "bg-emerald-500" : "bg-red-500"}`}
                    />
                  ))}
                </div>
              </div>
            </Card>
          )}

          {ssl.length > 0 && (
            <Card icon={ShieldCheckIcon} title="SSL" color="text-blue-400">
              <ul className="space-y-1 text-xs font-mono">
                {ssl.map((c) => (
                  <li key={c.host} className="truncate">
                    <span className="text-slate-400">{c.host}</span>{" "}
                    {c.ok ? (
                      <span className={sslClass(c.daysLeft)}>
                        {c.daysLeft < 0
                          ? t("monitor.sslExpiredShort")
                          : t("monitor.sslDays", { days: c.daysLeft })}
                      </span>
                    ) : (
                      <span className="text-red-300">{c.error}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {container && (
            <Card
              icon={ArrowPathIcon}
              title={t("monitor.containers")}
              color="text-sky-400"
            >
              <div className="space-y-1 text-xs font-mono text-slate-300">
                <p>
                  {t("monitor.running")}: {container.running}/{container.total}
                </p>
                <p className={restarts > 0 ? "text-amber-300" : ""}>
                  {t("monitor.restarts")}: {restarts}
                </p>
                {oom && (
                  <p className="text-red-300">{t("monitor.oomKilled")}</p>
                )}
                {containers.some((c) => c.health) && (
                  <p>
                    {t("monitor.dockerHealth")}:{" "}
                    {[
                      ...new Set(
                        containers.map((c) => c.health).filter(Boolean)
                      ),
                    ].join(", ")}
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {hasHistory && (
        <Card
          icon={CpuChipIcon}
          title={t("monitor.history", {
            span: formatDuration((data.range.to - data.range.from) / 1000),
          })}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Chart
              label="CPU"
              value={`${last.cpu}%`}
              data={series("cpu")}
              color="#34d399"
            />
            <Chart
              label={t("resourceCard.memoryUsage")}
              value={`${formatBytes(last.mem)} (${last.memPct}%)`}
              data={series("mem")}
              color="#60a5fa"
            />
            <Chart
              label={t("monitor.network")}
              value={`↓ ${formatRate(last.rx)}  ↑ ${formatRate(last.tx)}`}
              data={history.map((s) => s.rx + s.tx)}
              color="#a78bfa"
            />
            <Chart
              label={t("monitor.diskIo")}
              value={`R ${formatRate(last.br)}  W ${formatRate(last.bw)}`}
              data={history.map((s) => s.br + s.bw)}
              color="#f59e0b"
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default ResourceMonitoring;
